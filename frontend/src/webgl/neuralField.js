import { createContext, createProgram, resizeToDisplaySize, hexToRgb } from './glUtils';
import { NODE_VERTEX, NODE_FRAGMENT, LINK_VERTEX, LINK_FRAGMENT } from './shaders';

/**
 * حقل عُقد حيّ (Neural Field) — الخلفية المتحركة تبع الـ hero.
 *
 * ليش هيك بالضبط: الموقع كله عن نماذج ذكاء اصطناعي ومجتمع حواليها، فالخلفية عبارة
 * عن عُقد مترابطة وإشارات عم تمشي بين العقد — نفس فكرة الشبكة العصبية وفكرة المجتمع
 * بنفس الوقت. مش بلوبات ضبابية عامة ممكن تحطها بأي موقع تاني.
 *
 * قرارات هندسية مقصودة:
 *  - WebGL2 خام، صفر مكتبات.
 *  - كل المصفوفات (typed arrays) محجوزة مرة وحدة وقت التهيئة — ما فيه ولا تخصيص
 *    ذاكرة جوّا حلقة الرسم، حتى ما يصير تقطيع من الـ garbage collector.
 *  - عدد العقد بيتحدّد حسب مساحة الكانفس، فالموبايل ما بيتحمّل حمل شاشة ديسكتوب.
 *  - بتوقف كلياً لما تكون الصفحة مخفية أو الكانفس برّا الشاشة.
 *  - بتحترم prefers-reduced-motion: بترسم فريم ثابت وبتسكّر.
 */

const TAU = Math.PI * 2;
const MAX_NODES = 82;
const MIN_NODES = 26;
const NEIGHBOURS = 3;        // عدد الجيران الثابتين لكل عقدة (مسار الإشارات)
const MAX_PULSES = 12;       // إشارات عم تمشي على الوصلات
const MAX_LINKS = 900;
const LINK_RADIUS = 0.46;    // بوحدات العالم
const FLOATS_PER_POINT = 4;  // x, y, size, energy
const FLOATS_PER_LINK_VERTEX = 3; // x, y, alpha

/** مولّد أرقام شبه عشوائية ثابت البذرة — نفس الشكل كل مرة بتفتح الصفحة. */
function seededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function createNeuralField(canvas, options = {}) {
  const gl = createContext(canvas);
  if (!gl) return null;

  const theme = options.theme === 'light' ? 'light' : 'dark';
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const palette = {
    brand: hexToRgb(theme === 'light' ? '#6335f0' : '#7c5cfc'),
    accent: hexToRgb(theme === 'light' ? '#0c8d82' : '#2dd9c7'),
    link: hexToRgb(theme === 'light' ? '#6335f0' : '#6f5bd6'),
  };
  // بالوضع الفاتح الخلفية بيضا، فالجمع الضوئي (additive) بيختفي — منستخدم مزج عادي
  // وشدة أقل حتى يضل العنصر خفيف ومقروء ورا النص.
  const nodeOpacity = theme === 'light' ? 0.55 : 0.95;
  const linkOpacity = theme === 'light' ? 0.5 : 0.85;

  /* ---------------------------------------------------------------- الحالة */

  let nodeCount = 0;
  let aspect = 1;
  let running = false;
  let destroyed = false;
  let rafId = 0;
  let lastTime = 0;
  let elapsed = 0;
  let contextLost = false;

  // خصائص العقد — كل وحدة مصفوفة مستقلة (أسرع من مصفوفة كائنات)
  const baseX = new Float32Array(MAX_NODES);
  const baseY = new Float32Array(MAX_NODES);
  const orbitRadius = new Float32Array(MAX_NODES);
  const orbitSpeed = new Float32Array(MAX_NODES);
  const phase = new Float32Array(MAX_NODES);
  const depth = new Float32Array(MAX_NODES);     // 0.35..1 — بتتحكم بالحجم والبعد
  const posX = new Float32Array(MAX_NODES);      // الموقع الحالي بالعالم
  const posY = new Float32Array(MAX_NODES);
  const neighbours = new Int16Array(MAX_NODES * NEIGHBOURS);

  // الإشارات المتنقلة
  const pulseFrom = new Int16Array(MAX_PULSES);
  const pulseTo = new Int16Array(MAX_PULSES);
  const pulseT = new Float32Array(MAX_PULSES);   // أقل من صفر = بانتظار دورها
  const pulseSpeed = new Float32Array(MAX_PULSES);

  // مخازن الرفع للـ GPU — محجوزة مرة وحدة بأكبر حجم ممكن
  const pointData = new Float32Array((MAX_NODES + MAX_PULSES) * FLOATS_PER_POINT);
  const linkData = new Float32Array(MAX_LINKS * 2 * FLOATS_PER_LINK_VERTEX);

  // مؤشر الماوس (تأثير بارالاكس خفيف) — قيم من -1 لـ 1
  let pointerX = 0;
  let pointerY = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;

  /* ------------------------------------------------------- موارد الـ GPU */

  let nodeProgram = null;
  let linkProgram = null;
  let nodeVao = null;
  let linkVao = null;
  let nodeBuffer = null;
  let linkBuffer = null;

  function initGpu() {
    nodeProgram = createProgram(gl, NODE_VERTEX, NODE_FRAGMENT, [
      'u_brand',
      'u_accent',
      'u_opacity',
    ]);
    linkProgram = createProgram(gl, LINK_VERTEX, LINK_FRAGMENT, ['u_color', 'u_opacity']);

    // --- العقد ---
    nodeVao = gl.createVertexArray();
    gl.bindVertexArray(nodeVao);
    nodeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nodeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pointData.byteLength, gl.DYNAMIC_DRAW);
    const pointStride = FLOATS_PER_POINT * 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, pointStride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, pointStride, 8);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, pointStride, 12);

    // --- الوصلات ---
    linkVao = gl.createVertexArray();
    gl.bindVertexArray(linkVao);
    linkBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, linkBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, linkData.byteLength, gl.DYNAMIC_DRAW);
    const linkStride = FLOATS_PER_LINK_VERTEX * 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, linkStride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, linkStride, 8);

    gl.bindVertexArray(null);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    if (theme === 'light') {
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    } else {
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // جمع ضوئي — بيعطي التوهج
    }
    gl.clearColor(0, 0, 0, 0);
  }

  function destroyGpu() {
    if (nodeProgram) gl.deleteProgram(nodeProgram.program);
    if (linkProgram) gl.deleteProgram(linkProgram.program);
    if (nodeBuffer) gl.deleteBuffer(nodeBuffer);
    if (linkBuffer) gl.deleteBuffer(linkBuffer);
    if (nodeVao) gl.deleteVertexArray(nodeVao);
    if (linkVao) gl.deleteVertexArray(linkVao);
    nodeProgram = linkProgram = nodeBuffer = linkBuffer = nodeVao = linkVao = null;
  }

  /* ------------------------------------------------------------ التوزيع */

  /** بتوزّع العقد على شبكة مهزوزة — توزيع متوازن بدون تكتلات ولا فراغات. */
  function layoutNodes() {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    aspect = width / height;

    const density = options.density ?? 1;
    const target = Math.round(((width * height) / 22000) * density);
    nodeCount = Math.max(MIN_NODES, Math.min(MAX_NODES, target));

    const random = seededRandom(20260916);
    const columns = Math.max(3, Math.round(Math.sqrt(nodeCount * aspect)));
    const rows = Math.max(3, Math.ceil(nodeCount / columns));

    let index = 0;
    for (let row = 0; row < rows && index < nodeCount; row++) {
      for (let col = 0; col < columns && index < nodeCount; col++) {
        const u = (col + 0.5) / columns;
        const v = (row + 0.5) / rows;
        // هزّة عشوائية داخل خلية الشبكة حتى ما يبين إنها صفوف منتظمة
        baseX[index] = (u * 2 - 1) * aspect + (random() - 0.5) * (2 * aspect / columns) * 0.8;
        baseY[index] = (v * 2 - 1) + (random() - 0.5) * (2 / rows) * 0.8;
        orbitRadius[index] = 0.035 + random() * 0.09;
        orbitSpeed[index] = 0.12 + random() * 0.22;
        phase[index] = random() * TAU;
        depth[index] = 0.35 + random() * 0.65;
        posX[index] = baseX[index];
        posY[index] = baseY[index];
        index++;
      }
    }
    nodeCount = index;

    buildNeighbourGraph();
    resetPulses(seededRandom(7717));
  }

  /** لكل عقدة: أقرب 3 عقد إلها — هدول مسارات الإشارات الثابتة. */
  function buildNeighbourGraph() {
    for (let i = 0; i < nodeCount; i++) {
      // اختيار أقرب 3 بتمريرة وحدة بدون ترتيب كامل ولا تخصيص مصفوفات
      let b0 = -1;
      let b1 = -1;
      let b2 = -1;
      let d0 = Infinity;
      let d1 = Infinity;
      let d2 = Infinity;

      for (let j = 0; j < nodeCount; j++) {
        if (j === i) continue;
        const dx = baseX[j] - baseX[i];
        const dy = baseY[j] - baseY[i];
        const dist = dx * dx + dy * dy;
        if (dist < d0) {
          d2 = d1; b2 = b1;
          d1 = d0; b1 = b0;
          d0 = dist; b0 = j;
        } else if (dist < d1) {
          d2 = d1; b2 = b1;
          d1 = dist; b1 = j;
        } else if (dist < d2) {
          d2 = dist; b2 = j;
        }
      }

      neighbours[i * NEIGHBOURS] = b0;
      neighbours[i * NEIGHBOURS + 1] = b1 < 0 ? b0 : b1;
      neighbours[i * NEIGHBOURS + 2] = b2 < 0 ? b0 : b2;
    }
  }

  function resetPulses(random) {
    for (let i = 0; i < MAX_PULSES; i++) {
      spawnPulse(i, random);
      pulseT[i] = -random() * 3; // تأخير أولي متفاوت حتى ما يطلعوا كلهم سوا
    }
  }

  function spawnPulse(index, random) {
    const from = Math.floor(random() * nodeCount) % Math.max(1, nodeCount);
    const slot = Math.floor(random() * NEIGHBOURS) % NEIGHBOURS;
    const to = neighbours[from * NEIGHBOURS + slot];
    pulseFrom[index] = from;
    pulseTo[index] = to >= 0 ? to : from;
    pulseSpeed[index] = 0.22 + random() * 0.45;
    pulseT[index] = -random() * 2.5;
  }

  /* -------------------------------------------------------------- التحديث */

  const pulseRandom = seededRandom(99117);

  function update(dt) {
    elapsed += dt;

    // تنعيم حركة المؤشر حتى ما تكون النقلة حادة
    pointerX += (pointerTargetX - pointerX) * Math.min(1, dt * 2.5);
    pointerY += (pointerTargetY - pointerY) * Math.min(1, dt * 2.5);

    for (let i = 0; i < nodeCount; i++) {
      const t = elapsed * orbitSpeed[i] + phase[i];
      const parallax = depth[i] * 0.05;
      posX[i] = baseX[i] + Math.cos(t) * orbitRadius[i] + pointerX * parallax;
      posY[i] = baseY[i] + Math.sin(t * 1.17) * orbitRadius[i] * 0.8 + pointerY * parallax;
    }

    for (let i = 0; i < MAX_PULSES; i++) {
      pulseT[i] += dt * pulseSpeed[i];
      if (pulseT[i] > 1) spawnPulse(i, pulseRandom);
    }
  }

  /* --------------------------------------------------------------- الرسم */

  function buildBuffers() {
    // --- الوصلات: كل زوج عقد أقرب من LINK_RADIUS بيتوصلوا بخط بيخف كل ما بعدوا ---
    let linkVertices = 0;
    let offset = 0;

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = posX[j] - posX[i];
        const dy = posY[j] - posY[i];
        const distSq = dx * dx + dy * dy;
        if (distSq > LINK_RADIUS * LINK_RADIUS) continue;
        if (linkVertices + 2 > MAX_LINKS * 2) break;

        const dist = Math.sqrt(distSq);
        const strength = 1 - dist / LINK_RADIUS;
        const alpha = strength * strength * 0.5 * ((depth[i] + depth[j]) * 0.5);

        linkData[offset++] = posX[i] / aspect;
        linkData[offset++] = posY[i];
        linkData[offset++] = alpha;
        linkData[offset++] = posX[j] / aspect;
        linkData[offset++] = posY[j];
        linkData[offset++] = alpha;
        linkVertices += 2;
      }
    }

    // --- العقد + الإشارات بنفس المخزن (نفس البرنامج، نداء رسم واحد) ---
    const dpr = canvas.width / Math.max(1, canvas.clientWidth);
    let pointOffset = 0;
    let pointCount = 0;

    for (let i = 0; i < nodeCount; i++) {
      // نبضة حجم خفيفة جداً — بتخلي الحقل يحس فيه حياة بدون ما يشتّت
      const breathe = 1 + Math.sin(elapsed * 0.9 + phase[i]) * 0.12;
      pointData[pointOffset++] = posX[i] / aspect;
      pointData[pointOffset++] = posY[i];
      pointData[pointOffset++] = (1.6 + depth[i] * 4.2) * breathe * dpr;
      pointData[pointOffset++] = 0;
      pointCount++;
    }

    for (let i = 0; i < MAX_PULSES; i++) {
      const t = pulseT[i];
      if (t < 0 || t > 1) continue;
      const from = pulseFrom[i];
      const to = pulseTo[i];
      if (from === to) continue;

      // الإشارة بتتحرك بين العقدتين، وبتخفت بالبداية والنهاية
      const x = posX[from] + (posX[to] - posX[from]) * t;
      const y = posY[from] + (posY[to] - posY[from]) * t;
      const fade = Math.sin(t * Math.PI);

      pointData[pointOffset++] = x / aspect;
      pointData[pointOffset++] = y;
      pointData[pointOffset++] = (2.2 + fade * 4.5) * dpr;
      pointData[pointOffset++] = fade;
      pointCount++;
    }

    return { linkVertices, pointCount, pointFloats: pointOffset, linkFloats: offset };
  }

  function render() {
    if (contextLost) return;

    const { linkVertices, pointCount, pointFloats, linkFloats } = buildBuffers();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (linkVertices > 0) {
      gl.useProgram(linkProgram.program);
      gl.uniform3fv(linkProgram.uniforms.u_color, palette.link);
      gl.uniform1f(linkProgram.uniforms.u_opacity, linkOpacity);
      gl.bindVertexArray(linkVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, linkBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, linkData, 0, linkFloats);
      gl.drawArrays(gl.LINES, 0, linkVertices);
    }

    gl.useProgram(nodeProgram.program);
    gl.uniform3fv(nodeProgram.uniforms.u_brand, palette.brand);
    gl.uniform3fv(nodeProgram.uniforms.u_accent, palette.accent);
    gl.uniform1f(nodeProgram.uniforms.u_opacity, nodeOpacity);
    gl.bindVertexArray(nodeVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, nodeBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, pointData, 0, pointFloats);
    gl.drawArrays(gl.POINTS, 0, pointCount);

    gl.bindVertexArray(null);
  }

  /* ---------------------------------------------------------- حلقة الرسم */

  function frame(now) {
    if (!running || destroyed) return;
    // نحدّد الخطوة بـ 50ms حتى لو رجع التبويب بعد دقيقة ما تقفز الحركة قفزة كبيرة
    const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
    lastTime = now;
    update(dt);
    render();
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running || destroyed || contextLost || reducedMotion) return;
    running = true;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  /* ----------------------------------------------------------- المستمعات */

  function handleResize() {
    if (destroyed) return;
    const changed = resizeToDisplaySize(canvas);
    if (changed) {
      layoutNodes();
      if (!running) render(); // حتى ما تضل الشاشة فاضية وإحنا واقفين
    }
  }

  function handlePointerMove(event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerTargetX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerTargetY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function handlePointerLeave() {
    pointerTargetX = 0;
    pointerTargetY = 0;
  }

  function handleVisibility() {
    if (document.hidden) stop();
    else if (visible) start();
  }

  function handleContextLost(event) {
    event.preventDefault();
    contextLost = true;
    stop();
  }

  function handleContextRestored() {
    contextLost = false;
    initGpu();
    layoutNodes();
    if (visible && !document.hidden) start();
  }

  let visible = true;
  const observer =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(
          (entries) => {
            visible = entries[0]?.isIntersecting ?? true;
            if (visible && !document.hidden) start();
            else stop();
          },
          { threshold: 0 }
        )
      : null;

  /* --------------------------------------------------------------- تشغيل */

  try {
    initGpu();
  } catch (error) {
    // لو فشل تجميع الشيدر لأي سبب (درايفر قديم مثلاً) منرجع للخلفية الثابتة
    if (import.meta.env?.DEV) console.warn(error);
    return null;
  }

  resizeToDisplaySize(canvas);
  layoutNodes();
  render(); // فريم أول فوري — حتى ما يبين وميض فاضي قبل ما تبلش الحركة

  canvas.addEventListener('webglcontextlost', handleContextLost, false);
  canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('resize', handleResize);
  if (options.pointer !== false && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
  }
  if (observer) observer.observe(canvas);
  else start();

  return {
    destroy() {
      destroyed = true;
      stop();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      if (observer) observer.disconnect();
      destroyGpu();
    },
  };
}

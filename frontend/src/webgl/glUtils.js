// أدوات WebGL2 أساسية — مكتوبة بإيدنا بدون أي مكتبة خارجية.
// كل شي هون بيتنادى مرة وحدة وقت التهيئة، مش داخل حلقة الرسم.

/**
 * بترجع سياق WebGL2 جاهز للرسم فوق خلفية شفافة (حتى يبان تدرّج الـ CSS تحته)،
 * أو null لو المتصفح ما بيدعم WebGL2 — وقتها المكوّن بيرجع للبديل الثابت.
 */
export function createContext(canvas) {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: 'low-power',
    desynchronized: true,
  });
  return gl || null;
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`فشل تجميع الشيدر:\n${info}`);
  }
  return shader;
}

/** بتبني برنامج كامل (vertex + fragment) وبترجع معه أماكن الـ uniforms مخزّنة. */
export function createProgram(gl, vertexSource, fragmentSource, uniformNames = []) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  // بعد الربط ما عاد لهم لزمة — منحذفهم حتى ما يضلوا محجوزين بالذاكرة
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`فشل ربط البرنامج:\n${info}`);
  }

  // منخزّن مواقع الـ uniforms مرة وحدة — الاستعلام عنها كل فريم بيكلّف
  const uniforms = {};
  for (const name of uniformNames) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }

  return { program, uniforms };
}

/**
 * بتظبط أبعاد الكانفس على حجمه الفعلي بالشاشة مضروب بكثافة البكسل.
 * بنحدّد DPR بـ 1.5 — الفرق البصري فوق هيك شبه معدوم بتأثير ضبابي متل هاد،
 * بس الكلفة بترتفع أضعاف على شاشات الموبايل.
 */
export function resizeToDisplaySize(canvas, maxDpr = 1.5) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}

/** بتحوّل لون hex لمصفوفة [r,g,b] بمدى 0..1 حتى ننفعه للشيدر. */
export function hexToRgb(hex) {
  const value = parseInt(hex.replace('#', ''), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

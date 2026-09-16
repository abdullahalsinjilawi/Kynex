// شيدرات GLSL ES 3.00 لحقل العُقد بالـ hero.
// مكتوبة بإيدنا كاملة — لا مكتبة، ولا material جاهزة.

/* ---------- العُقد (نقاط) ---------- */

export const NODE_VERTEX = /* glsl */ `#version 300 es
layout(location = 0) in vec2 a_position;   // إحداثيات clip space جاهزة
layout(location = 1) in float a_size;      // قطر النقطة بالبكسل (مضروب بكثافة الشاشة)
layout(location = 2) in float a_energy;    // 0 = عقدة هادية، 1 = عقدة عم "تشتغل"

out float v_energy;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  gl_PointSize = a_size;
  v_energy = a_energy;
}
`;

export const NODE_FRAGMENT = /* glsl */ `#version 300 es
precision mediump float;

in float v_energy;

uniform vec3 u_brand;    // بنفسجي الهوية
uniform vec3 u_accent;   // سماوي - بس للعُقد النشطة
uniform float u_opacity; // شدة عامة (بتنزل على الموبايل)

out vec4 outColor;

void main() {
  // gl_PointCoord بيجي من 0..1 — منحوّله لدائرة مركزها 0
  vec2 offset = gl_PointCoord * 2.0 - 1.0;
  float distSq = dot(offset, offset);
  if (distSq > 1.0) discard;               // نقصّ خارج الدائرة

  float falloff = 1.0 - distSq;
  float core = pow(falloff, 2.5);          // القلب المضيء
  float halo = pow(falloff, 8.0);          // هالة ضيقة حواليه

  vec3 color = mix(u_brand, u_accent, v_energy);
  float alpha = (core * 0.45 + halo * 0.75) * u_opacity;

  outColor = vec4(color, alpha);
}
`;

/* ---------- الوصلات (خطوط) ---------- */

export const LINK_VERTEX = /* glsl */ `#version 300 es
layout(location = 0) in vec2 a_position;
layout(location = 1) in float a_alpha;     // بتضعف كل ما بعدت العقدتين عن بعض

out float v_alpha;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_alpha = a_alpha;
}
`;

export const LINK_FRAGMENT = /* glsl */ `#version 300 es
precision mediump float;

in float v_alpha;

uniform vec3 u_color;
uniform float u_opacity;

out vec4 outColor;

void main() {
  outColor = vec4(u_color, v_alpha * u_opacity);
}
`;

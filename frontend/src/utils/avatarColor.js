// بنولّد لون ثابت لكل مستخدم: نفس المعرّف = نفس اللون دايماً (hash بسيط، مش عشوائي).
// الألوان كلها ضمن عائلة الهوية (بنفسجي/سماوي/نيلي) مش قوس قزح عشوائي، ولكل لون
// نسخة أغمق للوضع الفاتح حتى يضل الحرف مقروء على خلفية بيضا.
const PALETTE = [
  { bg: 'bg-violet-500/15', text: 'text-violet-400' },
  { bg: 'bg-cyan-500/15', text: 'text-cyan-500 light:text-teal-700' },
  { bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-400 light:text-fuchsia-700' },
  { bg: 'bg-indigo-500/15', text: 'text-indigo-400 light:text-indigo-700' },
  { bg: 'bg-sky-500/15', text: 'text-sky-400 light:text-sky-700' },
  { bg: 'bg-purple-500/15', text: 'text-purple-400 light:text-purple-700' },
];

export function avatarColorFor(seed) {
  const str = String(seed || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // نخليه 32-bit
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

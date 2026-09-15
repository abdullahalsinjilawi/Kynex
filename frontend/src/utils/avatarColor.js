// بنولّد لون ثابت لكل مستخدم (نفس المستخدم = نفس اللون دايماً، لأنو معتمد على hash
// بسيط للاسم/المعرّف مش عشوائي). بألوان منسجمة مع هوية الموقع (تدرجات بنفسجي/سماوي/
// وردي-بنفسجي) بدل ألوان قوس قزح عشوائية ما إلها علاقة بالتصميم العام.
const PALETTE = [
  { bg: 'bg-violet-500/20', text: 'text-violet-400' },
  { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-400' },
  { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  { bg: 'bg-sky-500/20', text: 'text-sky-400' },
  { bg: 'bg-purple-500/20', text: 'text-purple-400' },
];

export function avatarColorFor(seed) {
  const str = String(seed || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // نخليه 32-bit integer
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

/**
 * أرقام الواجهة (عدادات، إحصائيات) بنعرضها دايماً بأرقام لاتينية حتى لو اللغة عربي —
 * هيك بتضل متسقة مع الخط والمساحة، وما بتقفز بين ٠١٢ و 012 حسب إعدادات المتصفح.
 */
const formatter = new Intl.NumberFormat('en-US');

export function formatNumber(value) {
  return formatter.format(Number(value) || 0);
}

/** اختصار للأرقام الكبيرة: 1.2k بدل 1200 — للأماكن الضيقة متل البطاقات. */
export function formatCompact(value) {
  const number = Number(value) || 0;
  if (number < 1000) return String(number);
  if (number < 1000000) return `${(number / 1000).toFixed(number < 10000 ? 1 : 0)}k`;
  return `${(number / 1000000).toFixed(1)}M`;
}

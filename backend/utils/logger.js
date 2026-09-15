// Logger بسيط بمستويات، بدون مكتبة خارجية ثقيلة. لو المشروع كبر واحتجت ميزات أكتر
// (حفظ باللوغز بملفات، إرسالها لخدمة مراقبة خارجية)، بدّل هاد بـ winston بسهولة
// لأنو باقي الكود بينادي logger.info/error/warn بس، مش console مباشرة

const levelColors = { info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m' };
const reset = '\x1b[0m';

function log(level, message, meta) {
  const timestamp = new Date().toISOString();
  const color = levelColors[level] || '';
  const line = `${color}[${timestamp}] ${level.toUpperCase()}:${reset} ${message}`;
  if (level === 'error') console.error(line, meta ?? '');
  else console.log(line, meta ?? '');
}

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};

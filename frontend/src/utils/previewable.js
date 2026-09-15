// نفس قائمة الامتدادات المدعومة بـ backend/controllers/projectController.js (isPreviewable) -
// نتحقق منها بالفرونت اند كمان حتى ما نعرض إمكانية "معاينة" لملف نعرف مسبقاً إنه رح يُرفض
// (صورة، أرشيف مضغوط...) بدل ما نخلي المستخدم يضغط ويشوف رسالة خطأ بلا داعي
const PREVIEWABLE_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'py', 'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'json', 'yaml', 'yml',
  'toml', 'ini', 'cfg', 'sh', 'bash', 'zsh', 'c', 'h', 'cpp', 'hpp', 'cc', 'java', 'go', 'rs',
  'rb', 'php', 'sql', 'css', 'scss', 'html', 'htm', 'xml', 'csv', 'env', 'r', 'ipynb', 'conf',
  'log', 'gitignore', 'gitattributes', 'editorconfig',
]);

export function isPreviewable(filename) {
  const parts = filename.split('.');
  if (parts.length === 1) return true;
  return PREVIEWABLE_EXTENSIONS.has(parts.pop().toLowerCase());
}

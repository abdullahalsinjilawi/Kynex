// بتبني شجرة مجلدات من مصفوفة ملفات فيها relativePath (مثلاً "src/utils/helper.py").
// نستخدمها بصفحة الرفع (معاينة قبل الإرسال) وصفحة تفاصيل المشروع (تاب الملفات).
export function buildFileTree(files) {
  const root = { name: '', type: 'folder', children: {} };

  for (const file of files) {
    const rawPath = file.relativePath || file.filename || file.name || 'file';
    const parts = rawPath.split('/').filter(Boolean);
    let node = root;

    parts.forEach((part, i) => {
      const isLast = i === parts.length - 1;
      if (isLast) {
        node.children[`f:${part}`] = { name: part, type: 'file', file };
      } else {
        const key = `d:${part}`;
        if (!node.children[key]) {
          node.children[key] = { name: part, type: 'folder', children: {} };
        }
        node = node.children[key];
      }
    });
  }

  return root;
}

// بترجع أبناء عقدة مرتبين: المجلدات أول (أبجدياً)، بعدها الملفات (أبجدياً)
export function sortedEntries(node) {
  return Object.values(node.children).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name, 'ar');
  });
}

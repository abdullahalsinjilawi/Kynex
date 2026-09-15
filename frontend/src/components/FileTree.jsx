import { useState } from 'react';
import { buildFileTree, sortedEntries } from '../utils/fileTree';

function FolderIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform duration-150 light:text-paper-muted ${open ? '-rotate-90' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function TreeNode({ node, depth, renderLeaf, defaultOpenDepth }) {
  const [open, setOpen] = useState(depth < defaultOpenDepth);

  if (node.type === 'file') {
    return renderLeaf(node.file, depth);
  }

  const entries = sortedEntries(node);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ paddingRight: `${depth * 18 + 16}px` }}
        className="flex w-full items-center gap-2 py-2 pl-4 text-sm transition-colors hover:bg-ink/40 light:hover:bg-paper"
      >
        <ChevronIcon open={open} />
        <FolderIcon />
        <span className="font-mono">{node.name}</span>
        <span className="text-xs text-ink-muted light:text-paper-muted">
          ({Object.keys(node.children).length})
        </span>
      </button>
      {open && (
        <div>
          {entries.map((child) => (
            <TreeNode
              key={(child.type === 'folder' ? 'd:' : 'f:') + child.name}
              node={child}
              depth={depth + 1}
              renderLeaf={renderLeaf}
              defaultOpenDepth={defaultOpenDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// files: مصفوفة فيها relativePath (أو filename/name كـ fallback لملف بدون مجلد)
// renderLeaf: (file, depth) => JSX - كيف تترسم كل ورقة (ملف) بالشجرة
// defaultOpenDepth: كم مستوى ينفتح تلقائياً بأول عرض (افتراضي: كل شي مفتوح لو المشروع صغير)
export default function FileTree({ files, renderLeaf, defaultOpenDepth = 2 }) {
  if (!files || files.length === 0) return null;

  const root = buildFileTree(files);
  const entries = sortedEntries(root);

  return (
    <div>
      {entries.map((node) => (
        <TreeNode
          key={(node.type === 'folder' ? 'd:' : 'f:') + node.name}
          node={node}
          depth={0}
          renderLeaf={renderLeaf}
          defaultOpenDepth={defaultOpenDepth}
        />
      ))}
    </div>
  );
}

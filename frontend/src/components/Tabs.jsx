import { useState } from 'react';

export default function Tabs({ tabs }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b border-ink-border light:border-paper-border">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              active === i
                ? 'text-ink-text light:text-paper-text'
                : 'text-ink-muted hover:text-ink-text light:text-paper-muted light:hover:text-paper-text'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="mr-1.5 rounded-full bg-ink-surface px-1.5 py-0.5 font-mono text-xs light:bg-paper-surface">
                {tab.count}
              </span>
            )}
            {active === i && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-violet-500" />
            )}
          </button>
        ))}
      </div>
      <div>{tabs[active].content}</div>
    </div>
  );
}

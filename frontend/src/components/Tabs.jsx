import { useState } from 'react';

/**
 * تابات على شكل مفتاح مقسّم (segmented) داخل إطار واحد — أوضح من خط تحت النص،
 * وبتشتغل صح بالاتجاهين (عربي/إنجليزي) لأنها ما بتعتمد على يمين/يسار ثابتين.
 */
export default function Tabs({ tabs, initial = 0 }) {
  const [active, setActive] = useState(initial);

  return (
    <div>
      <div
        role="tablist"
        className="no-scrollbar mb-6 flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1"
      >
        {tabs.map((tab, index) => {
          const isActive = active === index;
          return (
            <button
              key={tab.label}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(index)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand/15 text-brand-light'
                  : 'text-muted hover:bg-fg/5 hover:text-fg'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`rounded-md px-1.5 py-0.5 font-display text-xs tnum ${
                    isActive ? 'bg-brand/20' : 'bg-fg/10'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{tabs[active].content}</div>
    </div>
  );
}

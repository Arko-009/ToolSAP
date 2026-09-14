import { useState, type ReactNode, useId } from 'react';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export function Tabs({ tabs, defaultTab, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');
  const baseId = useId();

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index;
    if (e.key === 'ArrowRight') {
      newIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = tabs.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    setActiveTab(tabs[newIndex].id);
    // Focus the new tab
    const tabElement = document.getElementById(`${baseId}-tab-${tabs[newIndex].id}`);
    tabElement?.focus();
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="flex border-b border-neutral-200"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`${baseId}-tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              relative px-4 py-2.5 text-sm font-medium
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset
              ${activeTab === tab.id
                ? 'text-primary-600'
                : 'text-neutral-500 hover:text-neutral-700'
              }
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
            )}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${baseId}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={0}
          className="pt-4 focus:outline-none"
        >
          {activeTab === tab.id && tab.content}
        </div>
      ))}
    </div>
  );
}

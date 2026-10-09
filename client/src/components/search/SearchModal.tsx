import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, BookOpen, ArrowRight, CornerDownLeft, Sparkles, Layers } from 'lucide-react';
import { AnimatedSearchBar } from './AnimatedSearchBar';
import { tools } from '@/data/tools';
import { integrationCategories } from '@/data/learningCategories';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'tool' | 'learning' | 'nav';
  url: string;
  badge?: string;
  icon: typeof Wrench | typeof BookOpen | typeof Layers;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Global shortcut to open/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle or open
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compile searchable items
  const allItems: SearchResult[] = useMemo(() => {
    const items: SearchResult[] = [];

    // Tools
    tools.forEach((t) => {
      items.push({
        id: `tool-${t.id}`,
        title: t.name,
        description: t.description || t.shortDescription,
        type: 'tool',
        url: t.status === 'available' ? `/tools/${t.slug}` : `/tools`,
        badge: t.status === 'coming-soon' ? 'Coming Soon' : 'Available',
        icon: Wrench,
      });
    });

    // Learning Categories
    integrationCategories.forEach((cat) => {
      items.push({
        id: `learn-${cat.id}`,
        title: cat.title,
        description: cat.description,
        type: 'learning',
        url: `/learning`,
        badge: 'Lesson',
        icon: BookOpen,
      });
    });

    // Main Navigation Pages
    items.push(
      {
        id: 'nav-home',
        title: 'Home Page',
        description: 'Explore the ToolSAP integration developer platform.',
        type: 'nav',
        url: '/',
        badge: 'Page',
        icon: Layers,
      },
      {
        id: 'nav-tools',
        title: 'Developer Tools Hub',
        description: 'All free browser-based SAP integration utilities.',
        type: 'nav',
        url: '/tools',
        badge: 'Page',
        icon: Wrench,
      },
      {
        id: 'nav-learning',
        title: 'Learning Hub',
        description: 'Structured, practical SAP learning courses & paths.',
        type: 'nav',
        url: '/learning',
        badge: 'Page',
        icon: BookOpen,
      },
      {
        id: 'nav-about',
        title: 'About ToolSAP',
        description: 'Our mission to help SAP integration developers build faster.',
        type: 'nav',
        url: '/about',
        badge: 'Page',
        icon: Layers,
      }
    );

    return items;
  }, []);

  // Filter items based on query
  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      // Default recommended / popular items
      return allItems.slice(0, 6);
    }
    const q = query.toLowerCase().trim();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  // Adjust selectedIndex if filtered list shrinks
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation within results
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredResults[selectedIndex];
      if (selected) {
        navigate(selected.url);
        onClose();
      }
    }
  };

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-neutral-950/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200/90 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Search Bar in Modal */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 bg-neutral-50/50">
          <AnimatedSearchBar
            size="lg"
            placeholder="Search tools, learning topics, or guides..."
            autoFocus
            showShortcut={false}
            value={query}
            onChange={setQuery}
            onKeyDown={handleKeyDown}
            onClear={() => setQuery('')}
            className="w-full bg-white shadow-xs"
          />
        </div>

        {/* Results List */}
        <div
          ref={resultsContainerRef}
          className="max-h-[60vh] overflow-y-auto p-2 sm:p-3 divide-y divide-neutral-100/60 no-scrollbar"
        >
          {filteredResults.length > 0 ? (
            <div className="space-y-1">
              {!query.trim() && (
                <div className="px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  <Sparkles className="h-3 w-3 text-primary-500" />
                  <span>Popular & Recommended</span>
                </div>
              )}

              {filteredResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const Icon = item.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item.url)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`
                      flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150
                      ${isSelected ? 'bg-primary-50/80 text-primary-950 ring-1 ring-primary-200/60' : 'hover:bg-neutral-50 text-neutral-800'}
                    `}
                  >
                    <div
                      className={`
                        w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors
                        ${isSelected ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600'}
                      `}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm tracking-tight text-neutral-900 truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`
                              px-1.5 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wider
                              ${isSelected ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-500'}
                            `}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5 font-normal">
                        {item.description}
                      </p>
                    </div>

                    <div className="shrink-0 self-center">
                      {isSelected ? (
                        <div className="flex items-center gap-1 text-primary-600 text-xs font-semibold">
                          <span>Open</span>
                          <CornerDownLeft className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <ArrowRight className="h-4 w-4 text-neutral-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-neutral-800">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-neutral-500 mt-1">
                Try searching for &quot;XML&quot;, &quot;Groovy&quot;, &quot;Cloud Integration&quot;, or &quot;Tools&quot;.
              </p>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 font-medium px-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-[10px] shadow-2xs font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-[10px] shadow-2xs font-mono">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-[10px] shadow-2xs font-mono">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-[10px] shadow-2xs font-mono">ESC</kbd>
            <span>to close</span>
          </span>
        </div>
      </div>
    </div>
  );
}

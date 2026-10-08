import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, BookOpen, Wrench, Info, Search, Home } from 'lucide-react';
import { Container } from './Container';
import { MobileNav } from './MobileNav';
import { AnimatedSearchBar } from '@/components/search/AnimatedSearchBar';
import { SearchModal } from '@/components/search/SearchModal';

const navItems = [
  { label: 'Home', to: '/', icon: Home, end: true },
  { label: 'Tool', to: '/tools', icon: Wrench },
  { label: 'Learning', to: '/learning', icon: BookOpen },
  { label: 'About', to: '/about', icon: Info },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [patternIndex, setPatternIndex] = useState(0);
  const TOTAL_PATTERNS = 24;

  // Guaranteed dynamic cycle rotation every 4.8s across 24 distinct flight paths
  useEffect(() => {
    const timer = setInterval(() => {
      setPatternIndex((prev) => {
        const candidates = Array.from({ length: TOTAL_PATTERNS }, (_, i) => i).filter((idx) => idx !== prev);
        return candidates[Math.floor(Math.random() * candidates.length)];
      });
    }, 4800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-neutral-200/80 transition-all duration-200">
        <Container>
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <Link to="/" className="flex items-center group" aria-label="ToolSAP Home">
              <span className="relative inline-flex items-center select-none py-2 px-1.5 -my-2 -mx-1.5 overflow-visible">
                {/* Base Text Layer */}
                <span className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight font-sans">
                  Tool<span className="text-primary-600">SAP</span>
                </span>
                {/* Negative Mask Inverted Layer (Randomized Straight, Opposite, Zig-Zag, Snake, Speed, Figure-8) */}
                <span
                  key={patternIndex}
                  className={`jitter-path-${patternIndex} absolute inset-0 flex items-center px-1.5 pointer-events-none select-none bg-neutral-950 dark:bg-white`}
                  aria-hidden="true"
                >
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight font-sans whitespace-nowrap">
                    <span className="text-white dark:text-neutral-950">Tool</span>
                    <span className="text-sky-400 dark:text-primary-600">SAP</span>
                  </span>
                </span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-neutral-100/70 p-1 rounded-lg border border-neutral-200/50" aria-label="Primary navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `relative flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-150
                    ${isActive
                      ? 'text-neutral-900 bg-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                    }`
                  }
                >
                  <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2.5">
              <AnimatedSearchBar
                size="sm"
                readOnly
                placeholder="Search tools & docs..."
                showShortcut={true}
                onClick={() => setSearchOpen(true)}
                className="w-48 lg:w-56"
              />
              <Link
                to="/tools"
                className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                Free Tools
              </Link>
              <Link
                to="/learning"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-all duration-150 shadow-xs hover:shadow-sm"
              >
                <span>Start Learning</span>
                <span className="text-primary-200">→</span>
              </Link>
            </div>

            {/* Mobile Actions & Menu Trigger */}
            <div className="flex md:hidden items-center gap-1">
              <button
                type="button"
                className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                title="Search (⌘K)"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-2 focus-visible:outline-primary-500"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* Mobile Navigation */}
      <MobileNav
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        items={navItems}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

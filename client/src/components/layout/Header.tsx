import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, BookOpen, Wrench, Info, Search } from 'lucide-react';
import { Container } from './Container';
import { MobileNav } from './MobileNav';

const navItems = [
  { label: 'Learning', to: '/learning', icon: BookOpen },
  { label: 'Tools', to: '/tools', icon: Wrench },
  { label: 'About', to: '/about', icon: Info },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-neutral-200/80 transition-all duration-200">
        <Container>
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-2.5 group" aria-label="ToolSAP Home">
              <div className="w-8.5 h-8.5 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xs group-hover:shadow-sm group-hover:scale-[1.02] transition-all duration-150">
                <span className="text-white font-mono font-bold text-sm tracking-tighter">TS</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-neutral-900 tracking-tight font-sans">
                  Tool<span className="text-primary-600">SAP</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider text-primary-600/80 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200/60">
                  Suite
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-neutral-100/70 p-1 rounded-lg border border-neutral-200/50" aria-label="Primary navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
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
              <button
                type="button"
                className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                aria-label="Search documentation and tools"
                title="Search"
              >
                <Search className="h-4 w-4" />
              </button>
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

            {/* Mobile menu trigger */}
            <button
              className="md:hidden p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-2 focus-visible:outline-primary-500"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </Container>
      </header>

      {/* Mobile Navigation */}
      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} items={navItems} />
    </>
  );
}

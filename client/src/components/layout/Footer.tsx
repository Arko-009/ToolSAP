import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  FileCode,
  ShieldCheck,
  LayoutGrid,
} from 'lucide-react';
import { Container } from './Container';
import { useScrollReveal } from '@/hooks/useScrollReveal';

// Custom Authentic Social Icons
function InstagramIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ig-grad-footer" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f58529" />
          <stop offset="0.4" stopColor="#dd2a7b" />
          <stop offset="1" stopColor="#8134af" />
        </linearGradient>
      </defs>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="url(#ig-grad-footer)" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="url(#ig-grad-footer)" strokeWidth="2" />
      <circle cx="17.25" cy="6.75" r="1.25" fill="url(#ig-grad-footer)" />
    </svg>
  );
}

function YouTubeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#FF0000" />
      <path d="M10 8L16 12L10 16V8Z" fill="white" />
    </svg>
  );
}

function LinkedInIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4.5" fill="#0A66C2" />
      <path
        d="M6.5 19H4V9.5h2.5V19zM5.3 8.3c-.8 0-1.4-.6-1.4-1.4 0-.8.6-1.4 1.4-1.4.8 0 1.4.6 1.4 1.4 0 .8-.6 1.4-1.4 1.4zm14.7 10.7h-2.5v-4.2c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3 1-.1.2-.1.4-.1.7V19h-2.5s.03-8.6 0-9.5h2.5v1.3c.3-.5 1-1.2 2.2-1.2 1.6 0 2.9 1.1 2.9 3.4v6z"
        fill="white"
      />
    </svg>
  );
}

function FacebookIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        d="M15.5 12.3h-2.4V20h-3.2v-7.7H8.4V9.6h1.5V7.8c0-1.5.9-3.8 4-3.8h2.3v2.6h-1.7c-.3 0-.7.2-.7.8v2.2h2.4l-.4 2.7z"
        fill="white"
      />
    </svg>
  );
}

function GmailIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="white" />
      <path
        d="M4 6L12 12.5L20 6"
        stroke="#EA4335"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 18V6"
        stroke="#EA4335"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M20 18V6"
        stroke="#EA4335"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M4 18H20"
        stroke="#EA4335"
        strokeWidth="2"
      />
    </svg>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [footerRef, footerVisible] = useScrollReveal<HTMLElement>(0.1);

  return (
    <footer
      ref={footerRef}
      className="relative border-t border-neutral-200/80 bg-white overflow-hidden"
    >
      {/* Subtle Ambient Curved Glows (as in design reference) */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/60 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <Container>
        <div className={`py-12 sm:py-16 reveal-base reveal-up ${footerVisible ? 'reveal-visible' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* ====================================================
                Column 1: Brand & Positioning (4 cols)
                ==================================================== */}
            <div className="lg:col-span-4">
              <Link to="/" className="inline-flex items-center mb-4 group" aria-label="ToolSAP Home">
                <span className="text-2xl font-extrabold text-neutral-900 tracking-tight font-sans group-hover:opacity-85 transition-opacity">
                  Tool<span className="text-primary-600">SAP</span>
                </span>
              </Link>

              <p className="text-sm text-neutral-500 max-w-sm leading-relaxed mb-5">
                Practical SAP learning and free developer tools — built for developers who actually build with SAP.
              </p>

              {/* Tag Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-100 text-primary-600 text-xs font-medium">
                <span className="font-mono font-bold text-[11px]">&lt;/&gt;</span>
                <span>Learn · Practice · Build Better</span>
              </div>
            </div>

            {/* ====================================================
                Column 2: Learning (3 cols)
                ==================================================== */}
            <div className="lg:col-span-3">
              <h3 className="text-base font-bold text-neutral-900 mb-4">
                Learning
              </h3>
              <ul className="space-y-3.5">
                <li>
                  <Link
                    to="/learning/integration-development"
                    className="flex items-center gap-3 text-sm text-neutral-700 hover:text-primary-600 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center text-primary-600 shrink-0 group-hover:bg-blue-100 transition-colors">
                      <BookOpen className="h-4 w-4 stroke-[2]" />
                    </div>
                    <span>Integration Development</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/learning"
                    className="flex items-center gap-3 text-sm text-neutral-700 hover:text-primary-600 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center text-primary-600 shrink-0 group-hover:bg-blue-100 transition-colors">
                      <BookOpen className="h-4 w-4 stroke-[2]" />
                    </div>
                    <span>API Management</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/learning"
                    className="flex items-center gap-3 text-sm text-neutral-700 hover:text-primary-600 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center text-primary-600 shrink-0 group-hover:bg-blue-100 transition-colors">
                      <BookOpen className="h-4 w-4 stroke-[2]" />
                    </div>
                    <span>SAP BTP Basics</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/learning"
                    className="flex items-center gap-3 text-sm text-neutral-700 hover:text-primary-600 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center text-primary-600 shrink-0 group-hover:bg-blue-100 transition-colors">
                      <BookOpen className="h-4 w-4 stroke-[2]" />
                    </div>
                    <span>All Courses</span>
                  </Link>
                </li>
              </ul>

              <div className="mt-5">
                <Link
                  to="/learning"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors group"
                >
                  <span>View All Courses</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* ====================================================
                Column 3: Tools (3 cols)
                ==================================================== */}
            <div className="lg:col-span-3">
              <h3 className="text-base font-bold text-neutral-900 mb-4">
                Tools
              </h3>
              <ul className="space-y-3.5">
                <li>
                  <Link
                    to="/tools/xml-formatter"
                    className="flex items-center gap-3 text-sm text-neutral-700 hover:text-primary-600 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center text-primary-600 shrink-0 group-hover:bg-blue-100 transition-colors">
                      <FileCode className="h-4 w-4 stroke-[2]" />
                    </div>
                    <span>XML Formatter</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/tools/xml-validator"
                    className="flex items-center gap-3 text-sm text-neutral-700 hover:text-emerald-700 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-100 transition-colors">
                      <ShieldCheck className="h-4 w-4 stroke-[2]" />
                    </div>
                    <span>XML Validator</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/tools/xpath-tester"
                    className="flex items-center gap-3 text-sm text-neutral-700 hover:text-neutral-900 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-slate-200 transition-colors">
                      <span className="font-mono text-[11px] font-bold">&lt;/&gt;</span>
                    </div>
                    <span>XPath Tester</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/tools"
                    className="flex items-center gap-3 text-sm text-neutral-700 hover:text-purple-700 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100/80 flex items-center justify-center text-purple-600 shrink-0 group-hover:bg-purple-100 transition-colors">
                      <LayoutGrid className="h-4 w-4 stroke-[2]" />
                    </div>
                    <span>All Tools</span>
                  </Link>
                </li>
              </ul>

              <div className="mt-5">
                <Link
                  to="/tools"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors group"
                >
                  <span>View All Tools</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* ====================================================
                Column 4: Connect (2 cols)
                ==================================================== */}
            <div className="lg:col-span-2">
              <h3 className="text-base font-bold text-neutral-900 mb-4">
                Connect
              </h3>
              <ul className="space-y-3.5">
                <li>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-neutral-700 hover:text-neutral-900 transition-colors group"
                  >
                    <InstagramIcon className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
                    <span>Instagram</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-neutral-700 hover:text-neutral-900 transition-colors group"
                  >
                    <YouTubeIcon className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
                    <span>YouTube</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-neutral-700 hover:text-neutral-900 transition-colors group"
                  >
                    <LinkedInIcon className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
                    <span>LinkedIn</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-neutral-700 hover:text-neutral-900 transition-colors group"
                  >
                    <FacebookIcon className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
                    <span>Facebook</span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:contact@toolsap.com"
                    className="flex items-center gap-3 text-sm text-neutral-700 hover:text-neutral-900 transition-colors group"
                  >
                    <GmailIcon className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
                    <span>Gmail</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* ====================================================
              Bottom Bar
              ==================================================== */}
          <div className="mt-12 pt-6 border-t border-neutral-200/70 flex flex-col sm:flex-row items-center justify-center text-xs text-neutral-500 gap-2 sm:gap-3 text-center">
            <p>© {currentYear} ToolSAP. All rights reserved.</p>
            <span className="hidden sm:inline text-neutral-300 select-none">·</span>
            <p className="text-neutral-400">Built for SAP developers, by SAP developers.</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

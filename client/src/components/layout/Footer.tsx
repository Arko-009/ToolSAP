import { Link } from 'react-router-dom';
import { Container } from './Container';

const footerLinks = {
  learning: [
    { label: 'Integration Development', to: '/learning/integration-development' },
    { label: 'All Courses', to: '/learning' },
  ],
  tools: [
    { label: 'XML Formatter', to: '/tools/xml-formatter' },
    { label: 'XML Validator', to: '/tools/xml-validator' },
    { label: 'XPath Tester', to: '/tools/xpath-tester' },
    { label: 'All Tools', to: '/tools' },
  ],
  company: [
    { label: 'About', to: '/about' },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <Container>
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">T</span>
                </div>
                <span className="text-base font-bold text-neutral-900 tracking-tight">
                  Tool<span className="text-primary-600">SAP</span>
                </span>
              </Link>
              <p className="text-sm text-neutral-500 max-w-xs leading-relaxed">
                Practical SAP learning and free developer tools — built for developers who actually build with SAP.
              </p>
            </div>

            {/* Learning links */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Learning</h3>
              <ul className="space-y-2">
                {footerLinks.learning.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-neutral-500 hover:text-primary-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tool links */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Tools</h3>
              <ul className="space-y-2">
                {footerLinks.tools.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-neutral-500 hover:text-primary-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Company</h3>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-neutral-500 hover:text-primary-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-neutral-400">
              © {currentYear} ToolSAP. All rights reserved.
            </p>
            <p className="text-xs text-neutral-400">
              Built for SAP developers, by SAP developers.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { getAllRoutesSeo, BASE_URL } from '../src/data/seoConfig.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function seoPrerenderPlugin(): Plugin {
  return {
    name: 'vite-plugin-seo-prerender',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(import.meta.dirname, '../dist');
      const indexPath = path.join(distDir, 'index.html');

      if (!fs.existsSync(indexPath)) {
        console.warn('[seo-prerender] index.html not found in dist, skipping prerender.');
        return;
      }

      const template = fs.readFileSync(indexPath, 'utf-8');
      const routes = getAllRoutesSeo();
      console.log(`\n[seo-prerender] Generating static SEO HTML files for ${routes.length} routes...`);

      for (const route of routes) {
        const fullCanonical = `${BASE_URL}${route.canonical === '/' ? '' : route.canonical}`;
        const escapedTitle = escapeHtml(route.title);
        const escapedDesc = escapeHtml(route.description);
        const keywordsAttr = route.keywords ? escapeHtml(route.keywords.join(', ')) : '';

        let html = template;

        // 1. Replace <title>
        html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapedTitle}</title>`);

        // 2. Replace meta description
        if (/<meta[^>]*name="description"[^>]*>/i.test(html)) {
          html = html.replace(
            /<meta[^>]*name="description"[^>]*>/i,
            `<meta data-rh="true" name="description" content="${escapedDesc}" />`
          );
        } else {
          html = html.replace('</head>', `  <meta data-rh="true" name="description" content="${escapedDesc}" />\n  </head>`);
        }

        // 3. Replace keywords if present
        if (keywordsAttr) {
          if (/<meta[^>]*name="keywords"[^>]*>/i.test(html)) {
            html = html.replace(
              /<meta[^>]*name="keywords"[^>]*>/i,
              `<meta data-rh="true" name="keywords" content="${keywordsAttr}" />`
            );
          }
        }

        // 4. Replace canonical
        if (/<link[^>]*rel="canonical"[^>]*>/i.test(html)) {
          html = html.replace(
            /<link[^>]*rel="canonical"[^>]*>/i,
            `<link data-rh="true" rel="canonical" href="${fullCanonical}" />`
          );
        } else {
          html = html.replace('</head>', `  <link data-rh="true" rel="canonical" href="${fullCanonical}" />\n  </head>`);
        }

        // 5. Replace Open Graph tags
        html = html.replace(
          /<meta[^>]*property="og:title"[^>]*>/i,
          `<meta data-rh="true" property="og:title" content="${escapedTitle}" />`
        );
        html = html.replace(
          /<meta[^>]*property="og:description"[^>]*>/i,
          `<meta data-rh="true" property="og:description" content="${escapedDesc}" />`
        );
        html = html.replace(
          /<meta[^>]*property="og:url"[^>]*>/i,
          `<meta data-rh="true" property="og:url" content="${fullCanonical}" />`
        );

        // 6. Replace Twitter tags
        html = html.replace(
          /<meta[^>]*name="twitter:title"[^>]*>/i,
          `<meta data-rh="true" name="twitter:title" content="${escapedTitle}" />`
        );
        html = html.replace(
          /<meta[^>]*name="twitter:description"[^>]*>/i,
          `<meta data-rh="true" name="twitter:description" content="${escapedDesc}" />`
        );

        // 7. Inject JSON-LD structured data for this route (if not homepage)
        if (route.path !== '/') {
          let structuredData: any;
          if (route.canonical === '/tools/xml-validator') {
            structuredData = {
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebApplication',
                  name: route.title,
                  url: fullCanonical,
                  description: route.description,
                  applicationCategory: 'DeveloperApplication',
                  operatingSystem: 'All',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                  },
                  creator: {
                    '@type': 'Organization',
                    name: 'ToolSAP',
                    url: 'https://tool-sap.vercel.app/',
                  },
                },
                {
                  '@type': 'BreadcrumbList',
                  itemListElement: [
                    {
                      '@type': 'ListItem',
                      position: 1,
                      name: 'Home',
                      item: 'https://tool-sap.vercel.app/',
                    },
                    {
                      '@type': 'ListItem',
                      position: 2,
                      name: 'Tools',
                      item: 'https://tool-sap.vercel.app/tools',
                    },
                    {
                      '@type': 'ListItem',
                      position: 3,
                      name: 'Free XML Validator Online',
                      item: 'https://tool-sap.vercel.app/tools/xml-validator',
                    },
                  ],
                },
                {
                  '@type': 'FAQPage',
                  mainEntity: [
                    {
                      '@type': 'Question',
                      name: 'What is an XML Validator and why is it important?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'An XML Validator is a developer utility that verifies whether an XML document adheres strictly to W3C XML specifications. It performs two critical levels of verification: Well-Formedness (ensuring valid root element, matching case-sensitive tags, proper nesting, and quoted attributes) and Schema Validity (checking elements, sequences, and data types against an XSD schema or DTD). Validating XML prevents parser exceptions, HTTP 500 adapter errors, and broken data integrations.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'How do I validate an XML file online for free?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Paste your XML code directly into the editor or click "Upload File" to load any .xml, .xsd, or .wsdl document. ToolSAP runs real-time syntax checking in your browser, highlighting syntax errors with exact line and column numbers. You can also validate against a custom schema by switching to the "XSD Schema" mode.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'What is the difference between Well-Formed XML and Valid XML?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Well-Formed XML satisfies general XML syntax rules (one root element, all tags closed, correct casing, properly escaped characters like &amp; and &lt;). Valid XML is well-formed XML that also strictly adheres to the structural rules, cardinality constraints, and data types defined in a corresponding XSD (XML Schema Definition) or DTD document.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'How does the 1-Click Auto-Fix XML feature work?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'ToolSAP includes an intelligent client-side Auto-Fix engine. When your XML has syntax errors—such as missing closing tags, unescaped ampersands (& to &amp;), unquoted attributes, unclosed comments, or duplicate XML declarations—clicking "Auto-Fix XML" automatically repairs the syntax and displays an audit diff of every change made.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Is my XML payload secure and private when validating online?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes, 100% private. All XML parsing, syntax checking, and schema validation execute entirely in your web browser using local client-side JavaScript. Your confidential ERP payloads, customer data, and API messages are never transmitted to any external server or stored anywhere.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Can I validate XML against a custom XSD Schema?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes. Toggle to the "XSD Schema" validation mode to input or upload your W3C XSD schema. ToolSAP validates element sequences, required attributes, enumeration constraints, and data types against the provided schema definition.',
                      },
                    },
                  ],
                },
              ],
            };
          } else {
            structuredData = route.structuredDataType === 'WebApplication'
              ? {
                  '@context': 'https://schema.org',
                  '@type': 'WebApplication',
                  name: route.title,
                  url: fullCanonical,
                  description: route.description,
                  applicationCategory: 'DeveloperApplication',
                  operatingSystem: 'All',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                  },
                  creator: {
                    '@type': 'Organization',
                    name: 'ToolSAP',
                    url: 'https://tool-sap.vercel.app/',
                  },
                }
              : {
                  '@context': 'https://schema.org',
                  '@type': 'Article',
                  headline: route.title,
                  url: fullCanonical,
                  description: route.description,
                  publisher: {
                    '@type': 'Organization',
                    name: 'ToolSAP',
                    url: 'https://tool-sap.vercel.app/',
                  },
                };
          }

          const scriptTag = `\n    <!-- Page Specific Structured Data (JSON-LD) -->\n    <script type="application/ld+json">\n    ${JSON.stringify(structuredData, null, 2)}\n    </script>\n  `;
          html = html.replace('</head>', `${scriptTag}</head>`);
        }

        // 8. Replace noscript header & content
        let noscriptContent: string;
        if (route.canonical === '/tools/xml-validator') {
          noscriptContent = `
    <noscript>
      <header>
        <h1>Free XML Validator Online | ToolSAP</h1>
        <p>Validate XML syntax, find errors with line numbers, check well-formedness according to W3C specifications, and validate XML against XSD schemas using ToolSAP’s free online XML Validator.</p>
      </header>
      <main>
        <section>
          <h2>How to Validate XML Online in 3 Easy Steps</h2>
          <ol>
            <li><strong>Step 1: Paste or Upload XML:</strong> Paste raw XML code directly into the editor or upload an .xml, .xsd, or .wsdl file up to 5 MB.</li>
            <li><strong>Step 2: Instant Real-Time Error Detection:</strong> View real-time syntax checking with exact line numbers, column coordinates, and detailed error explanations.</li>
            <li><strong>Step 3: 1-Click Auto-Fix or Validate XSD:</strong> Click Auto-Fix XML to repair unclosed tags and unescaped ampersands, or validate against an XSD schema.</li>
          </ol>
        </section>
        <section>
          <h2>Free Online XML Validator Capabilities</h2>
          <ul>
            <li><strong>W3C Well-Formedness Check:</strong> Validates tags, hierarchies, root elements, and attribute quoting.</li>
            <li><strong>W3C XML Schema (XSD) Validation:</strong> Verify element sequences, required child tags, and data types.</li>
            <li><strong>1-Click Auto-Fix Engine:</strong> Automatically repairs broken syntax with an interactive audit diff.</li>
            <li><strong>Exact Line &amp; Column Error Mapping:</strong> Jump directly to syntax violations.</li>
            <li><strong>100% Client-Side Privacy:</strong> Validation runs in your browser without server upload.</li>
            <li><strong>Enterprise Payload Support:</strong> Supports SAP IDocs, SOAP envelopes, REST XML, and complex namespaces.</li>
          </ul>
        </section>
        <section>
          <h2>Common XML Syntax Errors &amp; Fixes</h2>
          <ul>
            <li><strong>Unescaped Characters:</strong> Bare ampersands (&amp;) must be encoded as &amp;amp;.</li>
            <li><strong>Tag Casing Discrepancies:</strong> Closing tags must match opening tags exactly in case-sensitivity.</li>
            <li><strong>Unclosed Comments &amp; CDATA:</strong> Missing comment or CDATA delimiters break downstream parsing.</li>
          </ul>
        </section>
        <section>
          <h2>Frequently Asked Questions (FAQ)</h2>
          <dl>
            <dt><strong>What is an XML Validator and why is it important?</strong></dt>
            <dd>An XML Validator is a developer utility that verifies whether an XML document adheres strictly to W3C XML specifications, checking both well-formedness and schema validity.</dd>
            <dt><strong>How do I validate an XML file online for free?</strong></dt>
            <dd>Paste your XML code directly into ToolSAP or upload a file. The tool runs instant in-browser syntax checking with exact line numbers.</dd>
            <dt><strong>What is the difference between Well-Formed XML and Valid XML?</strong></dt>
            <dd>Well-formed XML follows XML syntax rules; valid XML also strictly conforms to a designated XSD schema or DTD.</dd>
            <dt><strong>How does the 1-Click Auto-Fix XML feature work?</strong></dt>
            <dd>ToolSAP automatically detects missing closing tags, unescaped ampersands, and unquoted attributes, repairing them with an audit diff.</dd>
            <dt><strong>Is my XML payload secure and private when validating online?</strong></dt>
            <dd>Yes, 100% private. All processing is executed client-side in your web browser. No data leaves your machine.</dd>
            <dt><strong>Can I validate XML against a custom XSD Schema?</strong></dt>
            <dd>Yes. Switch to XSD mode and provide your W3C schema to validate structure and data types.</dd>
          </dl>
        </section>
        <section>
          <h2>Explore More Free Developer Tools</h2>
          <nav>
            <a href="/">ToolSAP Home</a> |
            <a href="/tools">All Tools</a> |
            <a href="/tools/xml-formatter">Free XML Formatter</a> |
            <a href="/tools/xml-to-xsd">XML to XSD Generator</a> |
            <a href="/tools/xpath-tester">XPath Tester</a> |
            <a href="/learning">SAP Learning Hub</a> |
            <a href="/about">About ToolSAP</a>
          </nav>
        </section>
      </main>
      <p>ToolSAP provides developer tools and practical learning for SAP developers. Please enable JavaScript to run this application.</p>
    </noscript>`;
        } else {
          noscriptContent = `
    <noscript>
      <header>
        <h1>${escapedTitle}</h1>
        <p>${escapedDesc}</p>
      </header>
      <main>
        <section>
          <h2>About this Tool / Resource</h2>
          <p>${escapedDesc}</p>
          <nav>
            <a href="/">ToolSAP Home</a>
            <a href="/tools">All Developer Tools</a>
            <a href="/tools/xml-validator">XML Validator</a>
            <a href="/tools/xml-to-xsd">XML to XSD Generator</a>
            <a href="/tools/xml-formatter">XML Formatter</a>
            <a href="/learning">Learning Hub</a>
            <a href="/about">About</a>
          </nav>
        </section>
      </main>
      <p>ToolSAP provides developer tools and practical learning for SAP developers. Please enable JavaScript to run this application.</p>
    </noscript>`;
        }

        html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, noscriptContent);

        // Write output
        if (route.canonical === '/' || route.path === '/') {
          fs.writeFileSync(indexPath, html, 'utf-8');
          console.log(`  ✓ Prerendered [ / ] -> dist/index.html`);
        } else {
          const relPath = route.canonical.replace(/^\//, '');
          const targetHtmlFile = path.join(distDir, `${relPath}.html`);
          const targetDir = path.dirname(targetHtmlFile);

          fs.mkdirSync(targetDir, { recursive: true });
          fs.writeFileSync(targetHtmlFile, html, 'utf-8');
          console.log(`  ✓ Prerendered [ ${route.canonical} ] -> dist/${relPath}.html`);
        }
      }

      console.log(`[seo-prerender] Successfully generated static SEO pages for all ${routes.length} routes!`);

      // ── Auto-update vercel.json (both root and client/) with explicit rewrites ──
      // Vercel's catch-all rewrite "/(.*)" → "/index.html" intercepts requests before
      // cleanUrls can resolve them to their static .html files. By adding explicit
      // rewrites for every prerendered route *before* the catch-all, Vercel will serve
      // the correct per-page HTML (with unique title, description, canonical, JSON-LD)
      // instead of the generic homepage index.html.
      const rootVercelPath = path.resolve(import.meta.dirname, '../../vercel.json');
      const clientVercelPath = path.resolve(import.meta.dirname, '../vercel.json');
      const vercelConfigPaths = [rootVercelPath, clientVercelPath];

      // Build explicit rewrites for every prerendered non-homepage route
      const prerenderRewrites = routes
        .filter((r) => r.path !== '/' && r.canonical !== '/')
        .map((r) => {
          const cleanPath = r.canonical.replace(/^\//, '');
          return {
            source: r.canonical,
            destination: `/${cleanPath}.html`,
          };
        });

      // SPA catch-all fallback (must be last)
      const spaFallback = { source: '/(.*)', destination: '/index.html' };

      for (const vercelPath of vercelConfigPaths) {
        if (fs.existsSync(vercelPath)) {
          try {
            const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
            vercelConfig.cleanUrls = true;
            vercelConfig.trailingSlash = false;
            vercelConfig.rewrites = [...prerenderRewrites, spaFallback];

            fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2) + '\n', 'utf-8');
            const displayPath = path.relative(path.resolve(import.meta.dirname, '../..'), vercelPath) || 'vercel.json';
            console.log(`[seo-prerender] Updated ${displayPath} with ${prerenderRewrites.length} explicit rewrites + SPA fallback.`);
          } catch (err) {
            console.warn(`[seo-prerender] Warning: Could not update ${vercelPath}:`, err);
          }
        }
      }

      console.log(`[seo-prerender] Done!\n`);
    },
  };
}

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
          } else if (route.canonical === '/tools/xml-formatter') {
            structuredData = {
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebApplication',
                  name: 'Best Free XML Formatter Online — Beautify, Pretty Print & Minify XML | ToolSAP',
                  alternateName: [
                    'XML Formatter',
                    'XML Formatter Online',
                    'Free XML Formatter',
                    'XML Beautifier',
                    'XML Beautifier Online',
                    'Best XML Formatter',
                    'Pretty Print XML Online',
                    'Free Online XML Formatter',
                    'SAP XML Formatter',
                  ],
                  url: fullCanonical,
                  description: route.description,
                  applicationCategory: 'DeveloperApplication',
                  operatingSystem: 'All (Windows, macOS, Linux, ChromeOS, iOS, Android)',
                  browserRequirements: 'Requires any modern web browser with JavaScript enabled',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                  },
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: '4.9',
                    bestRating: '5',
                    ratingCount: '1280',
                  },
                  featureList: [
                    'Instant W3C XML pretty print formatting and hierarchical indentation',
                    'Safe XML minification without data corruption or loss',
                    '100% client-side privacy — zero data sent to external servers',
                    'Strict preservation of CDATA sections, DTD internal subsets, and special entities',
                    'Customizable 2-space and 4-space tab indentation and quote styles',
                    'Real-time syntax error auto-detection with 1-click XML Validator integration',
                    'Direct support for SAP IDocs, SOAP envelopes, XSD, WSDL, SVG, RSS, and large files up to 5 MB',
                  ],
                  creator: {
                    '@type': 'Organization',
                    name: 'ToolSAP',
                    url: 'https://tool-sap.vercel.app/',
                  },
                },
                {
                  '@type': 'HowTo',
                  name: 'How to Format and Beautify XML Online for Free',
                  description:
                    'Step-by-step guide to formatting, pretty printing, and minifying XML markup online with 100% client-side privacy.',
                  step: [
                    {
                      '@type': 'HowToStep',
                      position: 1,
                      name: 'Paste or Upload XML',
                      text: 'Paste your raw or minified XML code into the editor or upload an .xml, .xsd, or .wsdl file up to 5 MB.',
                    },
                    {
                      '@type': 'HowToStep',
                      position: 2,
                      name: 'Select Indentation Settings',
                      text: 'Choose your preferred indentation width (2 spaces or 4 spaces) and attribute quote style using the Options toolbar.',
                    },
                    {
                      '@type': 'HowToStep',
                      position: 3,
                      name: 'Format XML or Minify',
                      text: 'Click "Format XML" for clean indentation or "Minify XML" to compress payload size.',
                    },
                    {
                      '@type': 'HowToStep',
                      position: 4,
                      name: 'Copy or Download Clean XML',
                      text: 'Copy the formatted XML output to your clipboard or download it as a formatted .xml file.',
                    },
                  ],
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
                      name: 'Best Free XML Formatter Online',
                      item: 'https://tool-sap.vercel.app/tools/xml-formatter',
                    },
                  ],
                },
                {
                  '@type': 'FAQPage',
                  mainEntity: [
                    {
                      '@type': 'Question',
                      name: 'What is an XML Formatter and why should I use it?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'An XML Formatter (or XML Beautifier / Pretty Printer) organizes raw, unformatted, minified, or single-line XML markup with standard indentation, line breaks, and tag alignment according to official W3C specifications. It makes complex XML documents, SOAP messages, SAP IDocs, SVG graphics, and REST API payloads human-readable, simple to debug, and easy to maintain.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'How do I format or pretty print XML online for free?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Simply paste your raw or unformatted XML into the left code editor or click "Upload File" to load any .xml, .xsd, or .wsdl file up to 5 MB. Choose your preferred indentation (2 spaces or 4 spaces) and quote style, then click "Format XML". Your beautified, syntax-highlighted XML appears instantly in the right pane ready to copy or download.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'What is the difference between XML Formatting (Pretty Print) and Minification?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'XML Formatting (Pretty Print) adds standardized indentation and newlines to maximize human readability for development, code reviews, and debugging. XML Minification removes all unnecessary whitespace, indentations, and line breaks without altering element data, reducing payload file size by 30% to 60% for faster HTTP transmission over networks.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Does this formatter preserve XML CDATA blocks, DTD subsets, and special entities?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes. ToolSAP uses an advanced enhanced parser that strictly preserves CDATA sections (<![CDATA[...]]>), DOCTYPE internal DTD subsets (<!DOCTYPE root [...]>), special character entities (&amp;, &lt;, &gt;, &quot;, &apos;), whitespace-only delimiter tags, and XML namespace prefixes (xmlns) without data loss or corruption.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Is my XML payload private and secure when formatting online?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes, 100% private. All formatting and minification execute entirely inside your web browser using client-side JavaScript. Your confidential ERP payloads, customer data, and API messages are never sent across the internet to any external server or stored anywhere. You can safely use it for proprietary and enterprise data.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Can I format SAP IDoc XML, SOAP envelopes, and enterprise integration payloads?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes! ToolSAP is specifically engineered for enterprise developers working with SAP Cloud Integration (CPI), SAP Integration Suite, SAP S/4HANA, SAP PO/PI, SOAP web services, WSDLs, and B2B standards like cXML and UBL 2.1.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'How do I format XML strings from REST APIs or command-line outputs (cURL, Postman)?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Copy the raw XML response from Postman, cURL, or your terminal, paste it directly into ToolSAP’s input editor, and click "Format XML". The tool instantly turns single-line compact XML into a clean, hierarchical tree with color-coded syntax highlighting.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'What happens if my XML contains syntax errors?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'If invalid or malformed XML is provided, ToolSAP detects syntax errors with exact line and column numbers, displays a clear notification, and provides a direct 1-click button to launch our companion XML Validator tool preloaded with your code to automatically inspect and auto-fix the issues.',
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
        } else if (route.canonical === '/tools/xml-formatter') {
          noscriptContent = `
    <noscript>
      <header>
        <h1>Best Free XML Formatter Online — Beautify, Pretty Print &amp; Minify XML | ToolSAP</h1>
        <p>Best free online XML formatter and beautifier. Pretty print, indent, tidy, and safely minify XML code with 100% in-browser privacy. Fast, secure, and preserves CDATA, entities &amp; SAP IDocs.</p>
      </header>
      <main>
        <section>
          <h2>How to Format &amp; Beautify XML Online in 3 Easy Steps</h2>
          <ol>
            <li><strong>Step 1: Paste or Upload XML:</strong> Paste raw XML markup into the code editor or upload an .xml, .xsd, or .wsdl file up to 5 MB.</li>
            <li><strong>Step 2: Choose Indentation Options:</strong> Select 2-space or 4-space tab widths and double or single quotes using the toolbar.</li>
            <li><strong>Step 3: Format XML or Minify:</strong> Click Format XML for pretty print indentation, or click Minify to compress payload size. Copy or download output instantly.</li>
          </ol>
        </section>
        <section>
          <h2>Free Online XML Formatter Capabilities</h2>
          <ul>
            <li><strong>W3C Pretty Print Formatting:</strong> Clean indentation and alignment adhering to W3C specifications.</li>
            <li><strong>Safe XML Minification:</strong> Removes whitespace and line breaks while preserving data.</li>
            <li><strong>100% In-Browser Privacy:</strong> All processing is executed client-side without server transmission.</li>
            <li><strong>CDATA &amp; Entity Integrity:</strong> Strict protection for CDATA sections, DTD subsets, and special entities.</li>
            <li><strong>Customizable Indentation:</strong> Toggle between 2 spaces and 4 spaces.</li>
            <li><strong>Syntax Error Auto-Detection:</strong> Instant error warnings with 1-click XML Validator repair.</li>
          </ul>
        </section>
        <section>
          <h2>Popular XML Formats, Payloads &amp; Schemas Supported</h2>
          <ul>
            <li><strong>SOAP &amp; Web Services:</strong> SOAP 1.1 / 1.2 Envelopes, WSDL contracts, XML-RPC, REST XML.</li>
            <li><strong>SAP &amp; Enterprise Integration:</strong> SAP IDocs (ORDERS, INVOIC, DESADV), SAP CPI, SAP Integration Suite, S/4HANA OData XML.</li>
            <li><strong>B2B &amp; E-Invoicing Standards:</strong> cXML punchout catalogs, UBL 2.1 electronic invoices, ebXML.</li>
            <li><strong>Web Standards &amp; Vector Graphics:</strong> SVG graphics, RSS 2.0 &amp; Atom feeds, XML sitemaps, XHTML.</li>
            <li><strong>Developer &amp; Build Configurations:</strong> Maven pom.xml, AndroidManifest.xml, web.xml, Spring XML beans.</li>
            <li><strong>Banking &amp; Financial Payloads:</strong> ISO 20022, SEPA credit transfer (pain.001), bank statements (camt.053).</li>
          </ul>
        </section>
        <section>
          <h2>ToolSAP vs. Typical Online XML Formatters</h2>
          <p>Unlike other formatters that upload private data to third-party servers, ToolSAP runs 100% in your browser. It strictly preserves CDATA sections, internal DTD subsets, and escaped entities (&amp;amp;) without data corruption, and links directly to our XML Validator for 1-click syntax auto-repair.</p>
        </section>
        <section>
          <h2>100+ Supported XML Formatter Queries &amp; Everyday Use Cases</h2>
          <p><strong>General Searches:</strong> xml formatter, xml formatter online, free xml formatter, best xml formatter, xml beautifier, pretty print xml, xml prettifier, xml indenter, xml tidy, xml cleaner, online xml viewer, format xml string, unminify xml, expand xml.</p>
          <p><strong>Developer Searches:</strong> client side xml formatter, private xml formatter, secure xml beautifier, large xml file formatter, xml minifier, strip whitespace xml, cdata xml formatter, xml namespaces formatter, auto format xml payload.</p>
          <p><strong>SAP &amp; Enterprise Searches:</strong> sap xml formatter, sap cpi xml beautifier, sap integration suite xml formatter, sap idoc xml formatter, soap envelope beautifier, wsdl formatter online, xsd schema formatter, cxml formatter, ubl xml formatter.</p>
          <p><strong>Standards &amp; Configs:</strong> svg formatter online, rss feed formatter, atom feed beautifier, kml formatter online, gpx formatter online, maven pom xml formatter, android manifest xml formatter, sepa xml formatter.</p>
        </section>
        <section>
          <h2>XML Pretty Print vs. XML Minification</h2>
          <p><strong>XML Formatting (Pretty Print):</strong> Adds standardized indentation and newlines to maximize human readability for development and debugging.</p>
          <p><strong>XML Minification (Compress):</strong> Removes unnecessary whitespace to reduce file size by 30% to 60% for faster network transmission.</p>
        </section>
        <section>
          <h2>Frequently Asked Questions (FAQ)</h2>
          <dl>
            <dt><strong>What is an XML Formatter and why should I use it?</strong></dt>
            <dd>An XML Formatter organizes raw, minified, or unindented XML markup with standard indentation, line breaks, and tag alignment according to W3C specifications.</dd>
            <dt><strong>How do I format or pretty print XML online for free?</strong></dt>
            <dd>Paste your XML code directly into ToolSAP, select 2 or 4 spaces indentation, and click Format XML.</dd>
            <dt><strong>What is the difference between XML Formatting (Pretty Print) and Minification?</strong></dt>
            <dd>Formatting adds indentation for human readability; minification strips whitespace for compact file size and faster transmission.</dd>
            <dt><strong>Does this formatter preserve XML CDATA blocks, DTD subsets, and special entities?</strong></dt>
            <dd>Yes. ToolSAP preserves CDATA sections, DTD internal subsets, and escaped entities without alteration.</dd>
            <dt><strong>Is my XML payload private and secure when formatting online?</strong></dt>
            <dd>Yes, 100% private. All processing runs locally in your browser with zero server uploads.</dd>
            <dt><strong>Can I format SAP IDoc XML, SOAP envelopes, and enterprise integration payloads?</strong></dt>
            <dd>Yes! ToolSAP is specifically engineered for enterprise developers working with SAP Cloud Integration (CPI), SAP Integration Suite, SOAP web services, WSDLs, and B2B standards like cXML and UBL 2.1.</dd>
            <dt><strong>How do I format XML strings from REST APIs or command-line outputs (cURL, Postman)?</strong></dt>
            <dd>Copy the raw XML response from Postman or cURL, paste it directly into ToolSAP, and click Format XML.</dd>
            <dt><strong>What happens if my XML contains syntax errors?</strong></dt>
            <dd>ToolSAP alerts you to syntax issues and provides a 1-click redirect to our XML Validator tool preloaded with your XML for auto-repair.</dd>
          </dl>
        </section>
        <section>
          <h2>Explore More Free Developer Tools</h2>
          <nav>
            <a href="/">ToolSAP Home</a> |
            <a href="/tools">All Tools</a> |
            <a href="/tools/xml-validator">Free XML Validator</a> |
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

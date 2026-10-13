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
          const structuredData = route.structuredDataType === 'WebApplication'
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

          const scriptTag = `\n    <!-- Page Specific Structured Data (JSON-LD) -->\n    <script type="application/ld+json">\n    ${JSON.stringify(structuredData, null, 2)}\n    </script>\n  `;
          html = html.replace('</head>', `${scriptTag}</head>`);
        }

        // 8. Replace noscript header & content
        const noscriptContent = `
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

      console.log(`[seo-prerender] Successfully generated static SEO pages for all ${routes.length} routes!\n`);
    },
  };
}

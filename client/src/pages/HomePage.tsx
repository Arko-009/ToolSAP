import { SEOHead } from '@/components/common/SEOHead';
import { HeroSection } from '@/components/home/HeroSection';
import { PillarsSection } from '@/components/home/PillarsSection';
import { ToolsPreviewSection } from '@/components/home/ToolsPreviewSection';
import { CurriculumSection } from '@/components/home/CurriculumSection';
import { PrivacyBanner } from '@/components/home/PrivacyBanner';
import { CtaSection } from '@/components/home/CtaSection';

export function HomePage() {
  return (
    <>
      <SEOHead
        title="ToolSAP — Learn SAP. Build Faster. Solve Problems."
        description="A modern, developer-first platform for SAP developers. Master SAP Integration Suite with structured, practical lessons and free client-side developer utilities."
        canonical="/"
        keywords={[
          'SAP learning',
          'SAP developer tools',
          'SAP Integration Suite',
          'SAP Cloud Integration',
          'CPI Groovy script',
          'SAP XML formatter',
          'SAP XSD validator',
        ]}
      />

      {/* Modular Homepage Architecture */}
      <main id="main-content" className="flex flex-col min-h-screen">
        <HeroSection />
        <PillarsSection />
        <ToolsPreviewSection />
        <CurriculumSection />
        <PrivacyBanner />
        <CtaSection />
      </main>
    </>
  );
}

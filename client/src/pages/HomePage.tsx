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
        title="ToolSAP — SAP Tools & Learning"
        description="Explore free SAP developer tools and practical SAP learning resources to build skills and solve problems faster."
        canonical="/"
        keywords={[
          'ToolSAP',
          'toolsap',
          'tool sap',
          'SAP developer tools',
          'SAP learning',
          'SAP Integration Suite',
          'SAP Cloud Integration',
          'CPI Groovy script',
          'SAP XML formatter',
          'SAP XML validator',
        ]}
      />

      {/* Modular Homepage Architecture */}
      <div className="flex flex-col">
        <HeroSection />
        <PillarsSection />
        <ToolsPreviewSection />
        <CurriculumSection />
        <PrivacyBanner />
        <CtaSection />
      </div>
    </>
  );
}

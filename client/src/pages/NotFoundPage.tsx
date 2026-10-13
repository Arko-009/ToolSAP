import { useState, useEffect, useCallback } from 'react';
import { SEOHead } from '@/components/common/SEOHead';
import { ArchiveScene3D, type LostArtifact } from '@/components/notFound/ArchiveScene3D';
import { InteractivePagesOverlay } from '@/components/notFound/InteractivePagesOverlay';
import { NotFoundHUD } from '@/components/notFound/NotFoundHUD';

export function NotFoundPage() {
  const [isChaosMode, setIsChaosMode] = useState(false);
  const [hasWobbled, setHasWobbled] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<LostArtifact | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  // Check WebGL availability and reduced motion preferences
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(motionQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      motionQuery.addEventListener('change', handleChange);
      return () => motionQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const handleTriggerChaos = useCallback(() => {
    setHasWobbled(true);
    setIsChaosMode(true);
  }, []);

  // Automatically trigger the dimensional reality warp portal animation after 10 seconds
  useEffect(() => {
    if (isChaosMode) return;

    const timer = setTimeout(() => {
      handleTriggerChaos();
    }, 10000);

    return () => clearTimeout(timer);
  }, [isChaosMode, handleTriggerChaos]);

  return (
    <>
      <SEOHead
        title="404 - Page Not Found | ToolSAP"
        description="The page you are looking for has escaped the ToolSAP archive. Explore free developer tools and learning resources to get back on track."
        noIndex
      />

      <div className="fixed inset-0 w-screen h-screen bg-[#f8fafc] text-neutral-900 overflow-hidden select-none z-50">
        {/* Soft atmospheric gradient glow behind scene */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-primary-100/35 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[300px] bg-amber-100/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[300px] bg-purple-100/25 rounded-full blur-3xl pointer-events-none" />

        {/* 3D WebGL Scene */}
        {webglSupported ? (
          <ArchiveScene3D
            isChaosMode={isChaosMode}
            onTriggerChaos={handleTriggerChaos}
            onSelectArtifact={setSelectedArtifact}
            reducedMotion={reducedMotion}
          />
        ) : (
          /* Graceful WebGL Fallback */
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div className="max-w-md p-8 rounded-3xl bg-white border border-neutral-200 text-neutral-600 shadow-xl">
              <div className="font-coiny text-6xl text-primary-600 mb-4">404</div>
              <h2 className="font-coiny text-xl text-neutral-900 mb-2">Page Lost in the Clouds</h2>
              <p className="text-sm text-neutral-500 mb-6">
                Hardware 3D acceleration is not available, but your requested page has floated away!
              </p>
            </div>
          </div>
        )}

        {/* Artifact Dossier Modal when 3D page is clicked */}
        <InteractivePagesOverlay
          selectedArtifact={selectedArtifact}
          onCloseArtifact={() => setSelectedArtifact(null)}
        />

        {/* Cinematic HUD Overlay (Header, 404 Typography, Navigation, Audio Toggle) */}
        <NotFoundHUD
          isChaosMode={isChaosMode}
          onTriggerChaos={handleTriggerChaos}
          hasWobbled={hasWobbled}
        />
      </div>
    </>
  );
}

/**
 * AmbientBackground — A premium, full-page animated background layer.
 * Renders floating gradient orbs with CSS animations for a living, breathing feel.
 * Lightweight: pure CSS + a single div tree. No canvas, no JS animation loop.
 */
export function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden="true">
      {/* Primary gradient mesh */}
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />
      <div className="ambient-orb ambient-orb-4" />
      
      {/* Subtle grid overlay */}
      <div className="ambient-grid" />
    </div>
  );
}

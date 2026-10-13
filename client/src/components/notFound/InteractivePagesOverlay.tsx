import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Copy, Check, ArrowRight } from 'lucide-react';
import type { LostArtifact } from './ArchiveScene3D';

interface InteractivePagesOverlayProps {
  selectedArtifact: LostArtifact | null;
  onCloseArtifact: () => void;
}

export function InteractivePagesOverlay({
  selectedArtifact,
  onCloseArtifact,
}: InteractivePagesOverlayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySnippet = () => {
    if (!selectedArtifact?.codeSnippet) return;
    navigator.clipboard.writeText(selectedArtifact.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!selectedArtifact) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white/95 border border-neutral-200/90 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-slate-900/10 backdrop-blur-xl text-neutral-900 transform transition-all animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="artifact-title"
      >
        {/* Top Bar with Cute Pill */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200/80 text-primary-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
            <span>NOTEBOOK DISCOVERY</span>
          </div>
          <button
            onClick={onCloseArtifact}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Tag */}
        <div className="mb-3">
          <h3 id="artifact-title" className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            {selectedArtifact.title}
          </h3>
          <div className="mt-1.5 inline-block font-mono text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-lg border border-primary-200/60">
            {selectedArtifact.tag}
          </div>
        </div>

        {/* Story Message */}
        <p className="text-sm text-neutral-600 leading-relaxed mb-4">
          {selectedArtifact.message}
        </p>

        {/* Code Snippet Box */}
        {selectedArtifact.codeSnippet && (
          <div className="relative mb-5 bg-neutral-900 rounded-2xl p-4 font-mono text-xs text-sky-200 overflow-x-auto shadow-inner">
            <pre>{selectedArtifact.codeSnippet}</pre>
            <button
              onClick={handleCopySnippet}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Copy snippet"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100">
          <button
            onClick={onCloseArtifact}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            Let It Float
          </button>

          <div className="flex items-center gap-2">
            {selectedArtifact.category === 'xml' ? (
              <Link
                to="/tools/xml-validator"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white transition-all shadow-sm hover:shadow-md"
              >
                <span>Open in XML Validator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/tools"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white transition-all shadow-sm hover:shadow-md"
              >
                <span>Explore Free Tools</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

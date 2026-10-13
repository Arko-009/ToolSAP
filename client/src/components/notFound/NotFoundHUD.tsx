import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Wrench,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { archiveAudio } from './ArchiveSoundSynth';

function PortalIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm0 18c-4.41 0-8-3.59-8-8 0-2.1.81-4.01 2.14-5.44l1.42 1.42A5.96 5.96 0 0 0 6 12c0 3.31 2.69 6 6 6 1.83 0 3.47-.82 4.58-2.12l1.42 1.42A7.95 7.95 0 0 1 12 20Zm5.86-5.86-1.42-1.42A3.98 3.98 0 0 0 16 12c0-2.21-1.79-4-4-4-.89 0-1.71.29-2.38.78L8.2 7.36A5.96 5.96 0 0 1 12 6c3.31 0 6 2.69 6 6 0 1.07-.28 2.07-.78 2.94l.64.2Z" />
    </svg>
  );
}

interface NotFoundHUDProps {
  isChaosMode: boolean;
  onTriggerChaos: () => void;
  hasWobbled: boolean;
}

export function NotFoundHUD({
  isChaosMode,
  onTriggerChaos,
  hasWobbled,
}: NotFoundHUDProps) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  const handleToggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    archiveAudio.setMuted(!newState);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 lg:p-8 z-30 select-none">
      {/* 1. TOP-LEFT NAVIGATION: Go Home & Explore Tools */}
      <nav
        aria-label="Back and tools navigation"
        className="absolute top-3.5 left-3.5 sm:top-4 sm:left-5 pointer-events-auto flex items-center gap-2 z-40"
      >
        <Link
          to="/"
          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-2xs flex items-center gap-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0 font-nunito"
          title="Return to ToolSAP Home"
        >
          <Home className="w-3.5 h-3.5 text-white" />
          <span>Go Home</span>
        </Link>

        <Link
          to="/tools"
          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/90 hover:bg-white border border-neutral-200/90 hover:border-neutral-300 text-neutral-800 shadow-2xs backdrop-blur-md flex items-center gap-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0 font-nunito"
          title="Explore ToolSAP Developer Tools"
        >
          <Wrench className="w-3.5 h-3.5 text-primary-600" />
          <span>Explore Tools</span>
        </Link>
      </nav>

      {/* 2. TOP-RIGHT CONTROLS: Playful Wobble (disappears once clicked) & Sound */}
      <header className="absolute top-3.5 right-3.5 sm:top-4 sm:right-5 pointer-events-auto flex items-center gap-2 z-40">
        {/* Solid Portal Icon Button: triggers reality warp portal */}
        {!hasWobbled && (
          <button
            onClick={onTriggerChaos}
            disabled={isChaosMode}
            className={`w-8 h-8 rounded-full border backdrop-blur-md transition-all flex items-center justify-center shadow-2xs hover:scale-110 active:scale-95 ${
              isChaosMode
                ? 'bg-purple-100 border-purple-300 text-purple-700 animate-spin'
                : 'bg-white/90 border-neutral-200/90 text-neutral-800 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50'
            }`}
            title="Dimensional Portal Warp"
            aria-label="Dimensional Portal Warp"
          >
            <PortalIcon className="w-4 h-4 text-purple-600" />
          </button>
        )}

        {/* Sound Toggle */}
        <button
          onClick={handleToggleAudio}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md transition-all flex items-center gap-1.5 shadow-2xs ${
            isAudioEnabled
              ? 'bg-primary-50 border-primary-300 text-primary-700'
              : 'bg-white/90 border-neutral-200/90 text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
          }`}
          aria-label={isAudioEnabled ? 'Mute sound effects' : 'Enable sound effects'}
        >
          {isAudioEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-primary-600 animate-pulse" />
              <span className="hidden sm:inline">Sound ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Sound OFF</span>
            </>
          )}
        </button>
      </header>

      {/* Screen reader announcement for 404 page */}
      <h1 className="sr-only">404 — Page Not Found</h1>
    </div>
  );
}

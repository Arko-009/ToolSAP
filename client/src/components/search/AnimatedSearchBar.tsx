import React, { useRef, useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface AnimatedSearchBarProps {
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  placeholder?: string;
  showShortcut?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  value?: string;
  onChange?: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear?: () => void;
}

export function AnimatedSearchBar({
  onClick,
  size = 'md',
  className = '',
  placeholder = 'Search tools, docs...',
  showShortcut = true,
  readOnly = false,
  autoFocus = false,
  value,
  onChange,
  onKeyDown,
  onClear,
}: AnimatedSearchBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [sizeDimensions, setSizeDimensions] = useState({ width: 0, height: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setSizeDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const strokeWidth = size === 'lg' ? 2.5 : 2;
  const w = Math.max(0, sizeDimensions.width - strokeWidth);
  const h = Math.max(0, sizeDimensions.height - strokeWidth);
  const radius = h > 0 ? h / 2 : 9999;
  const offset = strokeWidth / 2;

  // Active state: hovered or focused
  const isActive = isHovered || isFocused;

  // Size specific styling
  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs',
    md: 'h-9 px-3 text-xs sm:text-sm',
    lg: 'h-12 px-4 text-base',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (onClick) onClick();
        if (!readOnly && inputRef.current) inputRef.current.focus();
      }}
      className={`
        relative group search-bar-container rounded-full cursor-pointer select-none
        transition-all duration-300 ease-out flex items-center
        ${sizeClasses[size]}
        ${isActive ? 'bg-white shadow-md' : 'bg-neutral-50/90 hover:bg-white hover:shadow-xs'}
        ${className}
      `}
      role={readOnly ? 'button' : undefined}
      tabIndex={readOnly ? 0 : undefined}
      onKeyDown={(e) => {
        if (readOnly && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* SVG Interactive Edge-Covering Border */}
      {sizeDimensions.width > 0 && sizeDimensions.height > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          style={{ width: sizeDimensions.width, height: sizeDimensions.height }}
        >
          <defs>
            <linearGradient id="searchEdgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          {/* Background track border */}
          <rect
            x={offset}
            y={offset}
            width={w}
            height={h}
            rx={radius}
            ry={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            className={`transition-colors duration-300 ${isActive ? 'stroke-neutral-200' : 'group-hover:stroke-neutral-300'}`}
          />

          {/* Dynamic Corner -> Full Edge Border Stroke */}
          <rect
            x={offset}
            y={offset}
            width={w}
            height={h}
            rx={radius}
            ry={radius}
            fill="none"
            stroke="url(#searchEdgeGradient)"
            strokeWidth={strokeWidth + 0.4}
            strokeLinecap="round"
            pathLength="100"
            className={`search-corner-stroke ${isActive ? 'search-corner-stroke-active' : ''}`}
          />
        </svg>
      )}

      {/* Search Icon */}
      <div
        className={`relative z-10 flex items-center justify-center shrink-0 mr-2 transition-all duration-300 ${
          isActive ? 'text-primary-600 scale-105' : 'text-neutral-400 group-hover:text-primary-600'
        }`}
      >
        <Search className={`${iconSizes[size]} transition-transform duration-300`} />
      </div>

      {/* Input or Placeholder */}
      <div className="relative z-10 flex-1 min-w-0 flex items-center overflow-hidden">
        {readOnly ? (
          <span
            className={`font-medium truncate tracking-tight text-xs sm:text-xs transition-colors duration-200 ${
              isActive ? 'text-neutral-700' : 'text-neutral-500'
            }`}
          >
            {placeholder}
          </span>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus={autoFocus}
            placeholder={placeholder}
            className="w-full bg-transparent border-none outline-none text-neutral-900 placeholder:text-neutral-400 font-medium text-sm leading-normal focus:ring-0 p-0"
          />
        )}
      </div>

      {/* Clear Button */}
      {!readOnly && value && value.length > 0 && onClear && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
            inputRef.current?.focus();
          }}
          className="relative z-10 p-1 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors ml-1.5"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Keyboard Shortcut Tag */}
      {showShortcut && readOnly && (
        <div
          className={`relative z-10 hidden sm:flex items-center gap-0.5 ml-2 pl-1.5 py-0.5 pr-1.5 text-[10px] font-mono font-semibold rounded border shadow-2xs transition-all duration-200 ${
            isActive
              ? 'bg-primary-50 border-primary-200 text-primary-700 scale-105'
              : 'bg-white/80 border-neutral-200/80 text-neutral-400 group-hover:border-neutral-300 group-hover:text-neutral-600'
          }`}
        >
          <span>⌘</span>
          <span>K</span>
        </div>
      )}
    </div>
  );
}

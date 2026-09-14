import { CopyButton } from '@/components/common/CopyButton';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  showCopy?: boolean;
  maxHeight?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = 'xml',
  title,
  showLineNumbers = false,
  showCopy = true,
  maxHeight = '400px',
  className = '',
}: CodeBlockProps) {
  const lines = code.split('\n');

  return (
    <div className={`rounded-lg border border-neutral-200 overflow-hidden bg-neutral-900 ${className}`}>
      {/* Header */}
      {(title || showCopy) && (
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-800 border-b border-neutral-700">
          <div className="flex items-center gap-2">
            {/* Terminal dots */}
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
            </div>
            {title && (
              <span className="text-xs text-neutral-400 ml-2 font-mono">{title}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {language && (
              <span className="text-xs text-neutral-500 font-mono">{language}</span>
            )}
            {showCopy && <CopyButton text={code} size="sm" variant="dark" />}
          </div>
        </div>
      )}

      {/* Code content */}
      <div className="overflow-auto" style={{ maxHeight }}>
        <pre className="p-4 text-sm leading-relaxed">
          <code className="font-mono text-neutral-100">
            {showLineNumbers
              ? lines.map((line, i) => (
                  <div key={i} className="flex">
                    <span className="select-none text-neutral-600 w-8 text-right mr-4 shrink-0 text-xs leading-relaxed">
                      {i + 1}
                    </span>
                    <span>{line}</span>
                  </div>
                ))
              : code}
          </code>
        </pre>
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import CodeMirror, { type ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { xml } from '@codemirror/lang-xml';
import { EditorView } from '@codemirror/view';

export interface CodeEditorProps {
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  language?: 'xml';
  className?: string;
  hasError?: boolean;
}

// Cute, small and delicate light-orange custom text cursor SVG data URI
const CUTE_ORANGE_IBEAM = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='16' viewBox='0 0 10 16' fill='none'%3E%3Cpath d='M2.5 1.5h5M5 1.5v13M2.5 14.5h5' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' opacity='0.75'/%3E%3Cpath d='M2.5 1.5h5M5 1.5v13M2.5 14.5h5' stroke='%23f97316' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") 5 8, text`;

// Custom crisp theme tailored to ToolSAP's developer palette
const editorTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
    fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 0%',
    cursor: CUTE_ORANGE_IBEAM,
  },
  '.cm-scroller': {
    flex: '1 1 0%',
    overflow: 'auto',
    cursor: CUTE_ORANGE_IBEAM,
  },
  '.cm-content': {
    padding: '12px 0',
    caretColor: '#f97316',
    cursor: CUTE_ORANGE_IBEAM,
  },
  '.cm-line': {
    cursor: CUTE_ORANGE_IBEAM,
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#f97316 !important',
    borderLeftWidth: '2.5px',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#f97316 !important',
  },
  '.cm-gutters': {
    backgroundColor: '#f8fafc',
    color: '#94a3b8',
    borderRight: '1px solid #e2e8f0',
    paddingRight: '4px',
    userSelect: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#fff7ed',
    color: '#ea580c',
    fontWeight: '600',
  },
  '.cm-activeLine': {
    backgroundColor: '#fffaf5',
  },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: '#fed7aa !important',
  },
  // XML Token Highlighting
  '.cm-tag': { color: '#2563eb', fontWeight: '500' },
  '.cm-attribute': { color: '#0284c7' },
  '.cm-attribute-value, .cm-string': { color: '#059669' },
  '.cm-comment': { color: '#64748b', fontStyle: 'italic' },
  '.cm-meta, .cm-processingInstruction': { color: '#7c3aed' },
  '.cm-cdata': { color: '#d97706', fontWeight: '500' },
  '.cm-error': { backgroundColor: '#fee2e2', color: '#dc2626' },
});

export function CodeEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = 'Paste or type XML here...',
  height = '100%',
  minHeight = '380px',
  maxHeight,
  language = 'xml',
  className = '',
  hasError = false,
}: CodeEditorProps) {
  const extensions = useMemo(() => {
    const list = [
      editorTheme,
      EditorView.lineWrapping,
    ];

    if (language === 'xml') {
      list.push(xml());
    }

    return list;
  }, [language]);

  const editorProps: ReactCodeMirrorProps = {
    value,
    onChange,
    readOnly,
    editable: !readOnly,
    placeholder,
    height,
    minHeight,
    maxHeight,
    extensions,
    basicSetup: {
      lineNumbers: true,
      highlightActiveLineGutter: true,
      highlightActiveLine: !readOnly,
      foldGutter: true,
      dropCursor: true,
      allowMultipleSelections: false,
      indentOnInput: true,
      bracketMatching: true,
      closeBrackets: true,
      autocompletion: false,
    },
  };

  return (
    <div
      className={`
        w-full h-full flex-1 flex flex-col overflow-hidden bg-white
        ${hasError ? 'ring-1 ring-error-400' : ''}
        ${className}
      `}
      style={{ cursor: CUTE_ORANGE_IBEAM }}
    >
      <CodeMirror className="w-full h-full flex-1 flex flex-col" {...editorProps} />
    </div>
  );
}

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
  },
  '.cm-scroller': {
    flex: '1 1 0%',
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '12px 0',
    caretColor: '#2563eb',
  },
  '.cm-cursor': {
    borderLeftColor: '#2563eb',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#2563eb',
  },
  '.cm-gutters': {
    backgroundColor: '#f8fafc',
    color: '#94a3b8',
    borderRight: '1px solid #e2e8f0',
    paddingRight: '4px',
    userSelect: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontWeight: '600',
  },
  '.cm-activeLine': {
    backgroundColor: '#f8fafc',
  },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: '#dbeafe !important',
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
    >
      <CodeMirror className="w-full h-full flex-1 flex flex-col" {...editorProps} />
    </div>
  );
}

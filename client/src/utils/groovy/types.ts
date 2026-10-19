/**
 * SAP CPI Groovy Script Tester Types
 * Models com.sap.gateway.ip.core.customdev.util.Message and simulation interfaces
 */

export type GroovyRuntimeVersion = '4.0.29' | '2.4.21';

export type DiagnosticCategory =
  | 'SYNTAX_ERROR'
  | 'RUNTIME_EXCEPTION'
  | 'UNSUPPORTED_SAP_API'
  | 'COMPATIBILITY_WARNING'
  | 'EXECUTION_TIMEOUT'
  | 'LIMITATION';

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface ExecutionDiagnostic {
  category: DiagnosticCategory;
  severity: DiagnosticSeverity;
  message: string;
  line?: number;
  column?: number;
  snippet?: string;
  suggestion?: string;
}

export interface Attachment {
  id: string;
  content: string;
  contentType: string;
}

export type DiffStatus = 'added' | 'modified' | 'deleted' | 'unchanged';

export interface KeyValueDiff {
  key: string;
  originalValue?: string;
  newValue?: string;
  status: DiffStatus;
}

export interface ExecutionInput {
  script: string;
  body: string;
  headers: Record<string, any>;
  properties: Record<string, any>;
  runtime?: GroovyRuntimeVersion;
  entryPoint?: string; // Default 'processData'
}

export interface ExecutionResult {
  success: boolean;
  outputBody: string;
  originalBody: string;
  bodyType: 'string' | 'xml' | 'json' | 'bytes' | 'empty';
  headers: Record<string, any>;
  properties: Record<string, any>;
  headerDiffs: KeyValueDiff[];
  propertyDiffs: KeyValueDiff[];
  consoleLogs: string[];
  attachments: Attachment[];
  diagnostics: ExecutionDiagnostic[];
  durationMs: number;
  runtimeVersion: GroovyRuntimeVersion;
  timestamp: string;
}

export interface ScriptTemplate {
  id: string;
  name: string;
  category: 'General' | 'XML' | 'JSON' | 'Routing' | 'Security' | 'Logging';
  description: string;
  script: string;
  sampleBody: string;
  sampleHeaders: Record<string, string>;
  sampleProperties: Record<string, string>;
}

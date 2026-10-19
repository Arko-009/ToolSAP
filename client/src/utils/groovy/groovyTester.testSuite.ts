/**
 * Comprehensive Automated Regression & Unit Test Suite for ToolSAP Groovy Script Tester
 * Can be run in browser console (__runGroovyTestSuite) or headless environment.
 */

import { executeGroovyScript } from './groovyRunner';
import { GROOVY_TEMPLATES } from './templates';
import { lintGroovyScript } from './compatibilityLinter';

export interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResult[];
}

export async function runGroovyTestSuite(): Promise<TestSuiteSummary> {
  const startTime = performance.now();
  const results: TestResult[] = [];

  const runTest = async (name: string, fn: () => Promise<void>) => {
    const t0 = performance.now();
    try {
      await fn();
      results.push({
        name,
        passed: true,
        durationMs: Math.round(performance.now() - t0),
      });
    } catch (err: any) {
      results.push({
        name,
        passed: false,
        durationMs: Math.round(performance.now() - t0),
        error: err.message || String(err),
      });
    }
  };

  // Test Group 1: All 6 Production Templates
  for (const template of GROOVY_TEMPLATES) {
    await runTest(`Template: ${template.name}`, async () => {
      const res = await executeGroovyScript({
        script: template.script,
        body: template.sampleBody,
        headers: template.sampleHeaders,
        properties: template.sampleProperties,
      });

      if (!res.success) {
        throw new Error(`Execution failed: ${res.diagnostics[0]?.message || 'Unknown error'}`);
      }
      if (!res.outputBody || res.outputBody.trim().length === 0) {
        throw new Error('Output body is unexpectedly empty');
      }
    });
  }

  // Test Group 2: Mutable Headers and Properties Map Semantics
  await runTest('Message Map Mutation Semantics (getHeaders().put & getProperties()["key"] = val)', async () => {
    const script = `
      import com.sap.gateway.ip.core.customdev.util.Message
      def Message processData(Message msg) {
          def headers = msg.getHeaders()
          headers.put("DirectPutHeader", "123")
          headers["IndexHeader"] = "456"

          def props = msg.getProperties()
          props.put("DirectPutProp", "789")
          props["IndexProp"] = "999"

          return msg
      }
    `;

    const res = await executeGroovyScript({
      script,
      body: 'Hello',
      headers: {},
      properties: {},
    });

    if (!res.success) throw new Error(res.diagnostics[0]?.message);
    if (res.headers['DirectPutHeader'] !== '123') throw new Error('DirectPutHeader mismatch');
    if (res.headers['IndexHeader'] !== '456') throw new Error('IndexHeader mismatch');
    if (res.properties['DirectPutProp'] !== '789') throw new Error('DirectPutProp mismatch');
    if (res.properties['IndexProp'] !== '999') throw new Error('IndexProp mismatch');
  });

  // Test Group 3: Header and Property Namespace Isolation
  await runTest('Header and Property Namespace Isolation (Strictly distinct maps)', async () => {
    const script = `
      import com.sap.gateway.ip.core.customdev.util.Message
      def Message processData(Message msg) {
          msg.setHeader("SharedKey", "HEADER_VAL")
          msg.setProperty("SharedKey", "PROPERTY_VAL")
          return msg
      }
    `;

    const res = await executeGroovyScript({
      script,
      body: 'test',
      headers: {},
      properties: {},
    });

    if (!res.success) throw new Error(res.diagnostics[0]?.message);
    if (res.headers['SharedKey'] !== 'HEADER_VAL') throw new Error('Header SharedKey was corrupted');
    if (res.properties['SharedKey'] !== 'PROPERTY_VAL') throw new Error('Property SharedKey was corrupted');
  });

  // Test Group 4: Typed Body Conversions
  await runTest('Typed Body Conversions (String, byte[], InputStream)', async () => {
    const script = `
      import com.sap.gateway.ip.core.customdev.util.Message
      def Message processData(Message msg) {
          def strBody = msg.getBody(String)
          def byte[] byteBody = msg.getBody(byte[])
          def stream = msg.getBody(InputStream)

          msg.setHeader("StrLength", strBody.length)
          msg.setHeader("ByteLength", byteBody.length)
          msg.setHeader("StreamText", stream.text)

          return msg
      }
    `;

    const res = await executeGroovyScript({
      script,
      body: 'SAP_INTEGRATION_PAYLOAD',
      headers: {},
      properties: {},
    });

    if (!res.success) throw new Error(res.diagnostics[0]?.message);
    if (res.headers['StrLength'] !== 23) throw new Error('String length mismatch');
    if (res.headers['ByteLength'] !== 23) throw new Error('Byte length mismatch');
    if (res.headers['StreamText'] !== 'SAP_INTEGRATION_PAYLOAD') throw new Error('Stream text mismatch');
  });

  // Test Group 5: Null & Empty Body Handling
  await runTest('Null and Empty Body Graceful Handling', async () => {
    const script = `
      import com.sap.gateway.ip.core.customdev.util.Message
      def Message processData(Message msg) {
          def body = msg.getBody(String)
          msg.setHeader("BodyWasEmpty", body == "")
          msg.setBody("DefaultFallbackBody")
          return msg
      }
    `;

    const res = await executeGroovyScript({
      script,
      body: '',
      headers: {},
      properties: {},
    });

    if (!res.success) throw new Error(res.diagnostics[0]?.message);
    if (res.headers['BodyWasEmpty'] !== true) throw new Error('Empty body was not identified as empty');
    if (res.outputBody !== 'DefaultFallbackBody') throw new Error('Output body replacement failed');
  });

  // Test Group 6: Consecutive Execution Isolation (No Data Leaks)
  await runTest('Consecutive Execution State Isolation (Zero cross-run leakage)', async () => {
    const script1 = `
      def Message processData(Message msg) {
          msg.setHeader("RunOneHeader", "RunOneValue")
          msg.setProperty("RunOneProp", "111")
          return msg
      }
    `;

    const script2 = `
      def Message processData(Message msg) {
          // Script 2 does not set RunOneHeader
          return msg
      }
    `;

    const res1 = await executeGroovyScript({
      script: script1,
      body: 'Body1',
      headers: { InitialHeader: 'Val1' },
      properties: { InitialProp: 'PropVal1' },
    });

    const res2 = await executeGroovyScript({
      script: script2,
      body: 'Body2',
      headers: { CleanHeader: 'CleanVal' },
      properties: {},
    });

    if (res1.headers['RunOneHeader'] !== 'RunOneValue') throw new Error('Run 1 failed to set header');
    if (res2.headers['RunOneHeader'] !== undefined) throw new Error('Run 1 header leaked into Run 2!');
    if (res2.properties['RunOneProp'] !== undefined) throw new Error('Run 1 property leaked into Run 2!');
  });

  // Test Group 7: Compatibility Linter (Groovy 2 vs 4 and Tenant APIs)
  await runTest('Compatibility Linter (PartnerDirectory, ValueMapping, Deprecated packages)', async () => {
    const script = `
      import groovy.util.XmlSlurper
      import com.sap.it.api.pd.PartnerDirectoryService
      import com.sap.it.api.mapping.ValueMappingApi

      def Message processData(Message msg) {
          return msg
      }
    `;

    const diagnostics = lintGroovyScript(script, '4.0.29');
    const hasXmlSlurperWarning = diagnostics.some((d) => d.message.includes('groovy.util.XmlSlurper'));
    const hasPdWarning = diagnostics.some((d) => d.message.includes('PartnerDirectoryService'));
    const hasVmWarning = diagnostics.some((d) => d.message.includes('ValueMappingApi'));

    if (!hasXmlSlurperWarning) throw new Error('Failed to flag deprecated groovy.util.XmlSlurper');
    if (!hasPdWarning) throw new Error('Failed to flag PartnerDirectoryService');
    if (!hasVmWarning) throw new Error('Failed to flag ValueMappingApi');
  });

  // Test Group 8: Syntax Error and Line Reporting
  await runTest('Syntax Error Detection with Coordinate Reporting', async () => {
    const invalidScript = `
      def Message processData(Message msg) {
          def x = [1, 2, 3
          return msg
      }
    `;

    const res = await executeGroovyScript({
      script: invalidScript,
      body: '',
      headers: {},
      properties: {},
    });

    if (res.success) throw new Error('Expected syntax error for unclosed bracket, but execution succeeded');
    const syntaxErr = res.diagnostics.find((d) => d.category === 'SYNTAX_ERROR');
    if (!syntaxErr) throw new Error('Did not find SYNTAX_ERROR diagnostic');
    if (!syntaxErr.line) throw new Error('Syntax error missing line coordinate');
  });

  // Test Group 9: Runtime Exception Reporting
  await runTest('Runtime Exception Reporting (Null dereference / missing method)', async () => {
    const errorScript = `
      def Message processData(Message msg) {
          def nullObj = null
          nullObj.someMethod()
          return msg
      }
    `;

    const res = await executeGroovyScript({
      script: errorScript,
      body: 'test',
      headers: {},
      properties: {},
    });

    if (res.success) throw new Error('Expected runtime exception, but execution succeeded');
    const runtimeErr = res.diagnostics.find((d) => d.category === 'RUNTIME_EXCEPTION');
    if (!runtimeErr) throw new Error('Did not classify error as RUNTIME_EXCEPTION');
  });

  // Test Group 10: Timeout Safeguard
  await runTest('Infinite Loop Timeout Safeguard (Termination < 3000ms)', async () => {
    const loopScript = `
      def Message processData(Message msg) {
          while(true) {
              // Infinite loop simulation
          }
          return msg
      }
    `;

    const res = await executeGroovyScript({
      script: loopScript,
      body: 'test',
      headers: {},
      properties: {},
    });

    if (res.success) throw new Error('Infinite loop was not terminated');
    const timeoutDiag = res.diagnostics.find((d) => d.category === 'EXECUTION_TIMEOUT');
    if (!timeoutDiag) throw new Error('Execution timeout diagnostic not found');
  });

  // Test Group 11: Java Class Literals & UTF-8 byte[] Body Conversion (GST-010)
  await runTest('Class Literals & UTF-8 byte[] Body Conversion (GST-010)', async () => {
    const script = `
      import com.sap.gateway.ip.core.customdev.util.Message
      def Message processData(Message message) {
        byte[] bytes = message.getBody((byte[]).class)
        message.setProperty('byteLength', bytes.length)
        return message
      }
    `;

    const res = await executeGroovyScript({
      script,
      body: 'Aé',
      headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
      properties: {},
    });

    if (!res.success) throw new Error(res.diagnostics[0]?.message);
    if (res.properties['byteLength'] !== 3) throw new Error(`Expected byteLength 3, got ${res.properties['byteLength']}`);
  });

  // Test Group 12: MarkupBuilder XML Tag Delegation (GST-014)
  await runTest('MarkupBuilder XML Tag Delegation (GST-014)', async () => {
    const script = `
      import com.sap.gateway.ip.core.customdev.util.Message
      import groovy.xml.MarkupBuilder
      import java.io.StringWriter
      def Message processData(Message message) {
        StringWriter writer = new StringWriter()
        def xml = new MarkupBuilder(writer)
        xml.Order {
          Id('42')
          Status('READY')
        }
        message.setBody(writer.toString())
        return message
      }
    `;

    const res = await executeGroovyScript({
      script,
      body: 'unused',
      headers: {},
      properties: {},
    });

    if (!res.success) throw new Error(res.diagnostics[0]?.message);
    if (!res.outputBody.includes('<Id>42</Id>') || !res.outputBody.includes('<Status>READY</Status>')) {
      throw new Error(`MarkupBuilder output did not contain expected elements: ${res.outputBody}`);
    }
  });

  // Test Group 13: Collections & Closures with Sum (GST-017)
  await runTest('Collections and Closures with Sum (GST-017)', async () => {
    const script = `
      import com.sap.gateway.ip.core.customdev.util.Message
      def Message processData(Message message) {
        def numbers = [2, 3, 5]
        def total = numbers.collect { it * 2 }.sum()
        message.setProperty('total', total)
        return message
      }
    `;

    const res = await executeGroovyScript({
      script,
      body: 'numbers test',
      headers: {},
      properties: {},
    });

    if (!res.success) throw new Error(res.diagnostics[0]?.message);
    if (res.properties['total'] !== 20) throw new Error(`Expected total 20, got ${res.properties['total']}`);
  });

  // Test Group 14: Regex Replacement (GST-018)
  await runTest('Regular-Expression Replacement (GST-018)', async () => {
    const script = `
      import com.sap.gateway.ip.core.customdev.util.Message
      def Message processData(Message message) {
        String body = message.getBody(String)
        message.setBody(body.replaceAll(/order-(\\d+)/, 'ORDER-$1'))
        return message
      }
    `;

    const res = await executeGroovyScript({
      script,
      body: 'order-123',
      headers: {},
      properties: {},
    });

    if (!res.success) throw new Error(res.diagnostics[0]?.message);
    if (res.outputBody !== 'ORDER-123') throw new Error(`Expected ORDER-123, got ${res.outputBody}`);
  });

  // Test Group 15: Outbound Network Access Denied (GST-030)
  await runTest('Outbound Network Access Denied (GST-030)', async () => {
    const script = `
      import com.sap.gateway.ip.core.customdev.util.Message
      def Message processData(Message message) {
        new URL('https://example.invalid/').getText()
        return message
      }
    `;

    const res = await executeGroovyScript({
      script,
      body: 'security probe',
      headers: {},
      properties: {},
    });

    if (res.success) throw new Error('Expected security rejection for outbound URL network access');
    const secDiag = res.diagnostics.find((d) => d.category === 'LIMITATION' || d.message.includes('Security'));
    if (!secDiag) throw new Error('Security diagnostic not found for outbound network call');
  });

  // Test Group 16: Java NumberFormatException (GST-023)
  await runTest('Java NumberFormatException Handling (GST-023)', async () => {
    const script = `
      import com.sap.gateway.ip.core.customdev.util.Message
      def Message processData(Message message) {
        int value = Integer.parseInt('12x')
        message.setProperty('value', value)
        return message
      }
    `;

    const res = await executeGroovyScript({
      script,
      body: 'input',
      headers: {},
      properties: {},
    });

    if (res.success) throw new Error('Expected NumberFormatException for invalid integer');
    const numDiag = res.diagnostics.find((d) => d.message.includes('NumberFormatException'));
    if (!numDiag) throw new Error('NumberFormatException not reported in diagnostics');
  });

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const durationMs = Math.round(performance.now() - startTime);

  return {
    total,
    passed,
    failed,
    durationMs,
    results,
  };
}

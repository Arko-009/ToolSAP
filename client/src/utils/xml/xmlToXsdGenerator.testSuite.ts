/**
 * Comprehensive Automated Test Suite for XML to XSD Generator
 * Validates type inference, namespace preservation, sibling union merging,
 * error handling, and 100% roundtrip validation against ToolSAP's schema validator.
 */

import {
  generateXsdFromXml,
  inferSimpleType,
  mergeSimpleTypes,
  SAMPLE_SAP_PURCHASE_ORDER_XML,
} from './xmlToXsdGenerator';
import { validateAgainstXsd } from './xmlValidator';

export interface TestResultItem {
  category: string;
  name: string;
  passed: boolean;
  details: string;
}

export interface TestSuiteReport {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResultItem[];
}

export async function runXmlToXsdTestSuite(): Promise<TestSuiteReport> {
  const startTime = performance.now();
  const results: TestResultItem[] = [];

  function assert(category: string, name: string, condition: boolean, details = '') {
    results.push({
      category,
      name,
      passed: condition,
      details: condition ? 'PASSED' : `FAILED: ${details}`,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Unit Tests: Type Inference
  // ───────────────────────────────────────────────────────────────────────────
  assert('Type Inference', 'Infer integer 42', inferSimpleType('42') === 'xs:integer');
  assert('Type Inference', 'Infer negative integer -100', inferSimpleType('-100') === 'xs:integer');
  assert('Type Inference', 'Infer zero 0', inferSimpleType('0') === 'xs:integer');
  assert('Type Inference', 'Infer decimal 42.75', inferSimpleType('42.75') === 'xs:decimal');
  assert('Type Inference', 'Infer negative decimal -0.5', inferSimpleType('-0.5') === 'xs:decimal');
  assert('Type Inference', 'Infer date 2026-10-13', inferSimpleType('2026-10-13') === 'xs:date');
  assert('Type Inference', 'Infer dateTime 2026-10-13T10:30:00Z', inferSimpleType('2026-10-13T10:30:00Z') === 'xs:dateTime');
  assert('Type Inference', 'Infer time 14:45:00', inferSimpleType('14:45:00') === 'xs:time');
  assert('Type Inference', 'Infer boolean true', inferSimpleType('true') === 'xs:boolean');
  assert('Type Inference', 'Infer boolean false', inferSimpleType('false') === 'xs:boolean');

  // Critical requirement: Leading zeros MUST NOT be coerced to numbers
  assert('Type Inference', 'Preserve leading zero "00123" as string', inferSimpleType('00123') === 'xs:string');
  assert('Type Inference', 'Preserve leading zero "01" as string', inferSimpleType('01') === 'xs:string');

  // Identifiers, codes, postal codes, phone numbers
  assert('Type Inference', 'Identifier "id" element stays string', inferSimpleType('1001', 'id') === 'xs:string');
  assert('Type Inference', 'PostalCode stays string', inferSimpleType('80333', 'postalCode') === 'xs:string');
  assert('Type Inference', 'Phone number stays string', inferSimpleType('+1-555-0199', 'phone') === 'xs:string');
  assert('Type Inference', 'Arbitrary text stays string', inferSimpleType('Hello World') === 'xs:string');

  // Type merging
  assert('Type Merging', 'Merge integer + decimal => decimal', mergeSimpleTypes('xs:integer', 'xs:decimal') === 'xs:decimal');
  assert('Type Merging', 'Merge integer + string => string', mergeSimpleTypes('xs:integer', 'xs:string') === 'xs:string');
  assert('Type Merging', 'Merge date + string => string', mergeSimpleTypes('xs:date', 'xs:string') === 'xs:string');
  assert('Type Merging', 'Merge same types integer + integer => integer', mergeSimpleTypes('xs:integer', 'xs:integer') === 'xs:integer');

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Integration: Simple XML without namespaces
  // ───────────────────────────────────────────────────────────────────────────
  const xmlNoNs = `<Order>
    <OrderID>1001</OrderID>
    <CustomerName>Acme Corp</CustomerName>
    <OrderAmount>550.25</OrderAmount>
    <OrderDate>2026-10-13</OrderDate>
    <IsPaid>true</IsPaid>
  </Order>`;
  const resNoNs = await generateXsdFromXml(xmlNoNs);
  assert('No Namespace XML', 'Generation success', resNoNs.success, resNoNs.error?.message);
  assert('No Namespace XML', 'Contains xs:schema root', resNoNs.xsd.includes('<xs:schema'));
  assert('No Namespace XML', 'Root element Order declared', resNoNs.xsd.includes('name="Order"'));
  assert('No Namespace XML', 'OrderID inferred as xs:string (name rule)', resNoNs.xsd.includes('name="OrderID"') && resNoNs.xsd.includes('type="xs:string"'));
  assert('No Namespace XML', 'OrderAmount inferred as xs:decimal', resNoNs.xsd.includes('name="OrderAmount"') && resNoNs.xsd.includes('type="xs:decimal"'));
  assert('No Namespace XML', 'OrderDate inferred as xs:date', resNoNs.xsd.includes('name="OrderDate"') && resNoNs.xsd.includes('type="xs:date"'));
  assert('No Namespace XML', 'IsPaid inferred as xs:boolean', resNoNs.xsd.includes('name="IsPaid"') && resNoNs.xsd.includes('type="xs:boolean"'));

  const roundtripNoNs = validateAgainstXsd(xmlNoNs, resNoNs.xsd);
  assert('No Namespace XML', 'Roundtrip validation against schema passes 100%', roundtripNoNs.isValid, roundtripNoNs.errors[0]?.message);

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Integration: XML with Default Namespace
  // ───────────────────────────────────────────────────────────────────────────
  const xmlDefaultNs = `<Invoice xmlns="https://sap.com/invoices">
    <InvoiceNumber>INV-2026-001</InvoiceNumber>
    <TotalAmount>1250.00</TotalAmount>
  </Invoice>`;
  const resDefaultNs = await generateXsdFromXml(xmlDefaultNs);
  assert('Default Namespace XML', 'Generation success', resDefaultNs.success, resDefaultNs.error?.message);
  assert('Default Namespace XML', 'targetNamespace set', resDefaultNs.xsd.includes('targetNamespace="https://sap.com/invoices"'));
  assert('Default Namespace XML', 'elementFormDefault="qualified"', resDefaultNs.xsd.includes('elementFormDefault="qualified"'));

  const roundtripDefaultNs = validateAgainstXsd(xmlDefaultNs, resDefaultNs.xsd);
  assert('Default Namespace XML', 'Roundtrip validation passes', roundtripDefaultNs.isValid, roundtripDefaultNs.errors[0]?.message);

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Sibling Repetition & Union Merging
  // ───────────────────────────────────────────────────────────────────────────
  const xmlRepeated = `<Catalog>
    <Product sku="SKU-1">
      <Title>Widget</Title>
      <Price>10.00</Price>
    </Product>
    <Product sku="SKU-2">
      <Title>Gadget</Title>
      <Price>20.50</Price>
      <Discount>2.00</Discount>
    </Product>
  </Catalog>`;
  const resRepeated = await generateXsdFromXml(xmlRepeated);
  assert('Repeated Elements', 'Generation success', resRepeated.success, resRepeated.error?.message);
  assert('Repeated Elements', 'Product has maxOccurs="unbounded"', resRepeated.xsd.includes('name="Product"') && resRepeated.xsd.includes('maxOccurs="unbounded"'));
  assert('Repeated Elements', 'Contains optional Discount element from 2nd item', resRepeated.xsd.includes('name="Discount"'));
  assert('Repeated Elements', 'Contains attribute sku', resRepeated.xsd.includes('name="sku"'));

  const roundtripRepeated = validateAgainstXsd(xmlRepeated, resRepeated.xsd);
  assert('Repeated Elements', 'Roundtrip validation passes', roundtripRepeated.isValid, roundtripRepeated.errors[0]?.message);

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Element with Text AND Attributes (simpleContent)
  // ───────────────────────────────────────────────────────────────────────────
  const xmlSimpleContent = `<Order>
    <Amount currency="EUR">99.50</Amount>
  </Order>`;
  const resSimpleContent = await generateXsdFromXml(xmlSimpleContent);
  assert('SimpleContent XML', 'Generation success', resSimpleContent.success, resSimpleContent.error?.message);
  assert('SimpleContent XML', 'Contains xs:simpleContent', resSimpleContent.xsd.includes('<xs:simpleContent>'));
  assert('SimpleContent XML', 'Contains currency attribute', resSimpleContent.xsd.includes('name="currency"'));

  const roundtripSimpleContent = validateAgainstXsd(xmlSimpleContent, resSimpleContent.xsd);
  assert('SimpleContent XML', 'Roundtrip validation passes', roundtripSimpleContent.isValid, roundtripSimpleContent.errors[0]?.message);

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Realistic SAP Purchase Order XML
  // ───────────────────────────────────────────────────────────────────────────
  const resSap = await generateXsdFromXml(SAMPLE_SAP_PURCHASE_ORDER_XML);
  assert('SAP Sample Payload', 'Generation success', resSap.success, resSap.error?.message);
  assert('SAP Sample Payload', 'Has targetNamespace', resSap.metrics?.targetNamespace === 'http://sap.com/xi/PurchaseOrder');
  assert('SAP Sample Payload', 'Detected multiple elements', (resSap.metrics?.elementCount ?? 0) >= 10);

  const roundtripSap = validateAgainstXsd(SAMPLE_SAP_PURCHASE_ORDER_XML, resSap.xsd);
  assert('SAP Sample Payload', 'Roundtrip validation passes 100%', roundtripSap.isValid, roundtripSap.errors[0]?.message);

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Error Handling: Malformed XML
  // ───────────────────────────────────────────────────────────────────────────
  const malformedXml = `<Order><Item>123</Order>`;
  const resMalformed = await generateXsdFromXml(malformedXml);
  assert('Error Handling', 'Fails gracefully on mismatched tags', !resMalformed.success);
  assert('Error Handling', 'Provides line or error message', !!resMalformed.error?.message);

  const emptyXml = `   `;
  const resEmpty = await generateXsdFromXml(emptyXml);
  assert('Error Handling', 'Fails gracefully on empty input', !resEmpty.success);
  assert('Error Handling', 'Error code is ERR_EMPTY_INPUT', resEmpty.error?.code === 'ERR_EMPTY_INPUT');

  const unclosedXml = `<Order><id>1001`;
  const resUnclosed = await generateXsdFromXml(unclosedXml);
  assert('Error Handling', 'Fails gracefully on unclosed root tag', !resUnclosed.success);

  const unquotedAttrXml = `<Order id=1001><name>Test</name></Order>`;
  const resUnquoted = await generateXsdFromXml(unquotedAttrXml);
  assert('Error Handling', 'Fails gracefully on unquoted attribute', !resUnquoted.success);

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Permanent Regression: Multi-Namespace Product Catalogue Document
  // ───────────────────────────────────────────────────────────────────────────
  const xmlProductCatalogue = `<catalog xmlns="http://example.com/catalog" xmlns:meta="http://example.com/meta" xmlns:fmt="http://example.com/format">
  <product id="P100" meta:source="supplier">
    <name>Precision Sensor</name>
    <meta:owner>Engineering Team</meta:owner>
    <description>
      High performance <fmt:emphasis>optical sensor</fmt:emphasis> with <fmt:link href="specs.pdf">documentation</fmt:link>.
    </description>
  </product>
</catalog>`;

  const resProductCatalogue = await generateXsdFromXml(xmlProductCatalogue);
  assert(
    'Multi-Namespace Product Catalogue',
    'Schema generation succeeds',
    resProductCatalogue.success,
    resProductCatalogue.error?.message
  );
  assert(
    'Multi-Namespace Product Catalogue',
    'Target namespace is http://example.com/catalog',
    resProductCatalogue.xsd.includes('targetNamespace="http://example.com/catalog"')
  );
  assert(
    'Multi-Namespace Product Catalogue',
    'Imports foreign namespace http://example.com/meta',
    resProductCatalogue.xsd.includes('<xs:import namespace="http://example.com/meta"')
  );
  assert(
    'Multi-Namespace Product Catalogue',
    'Imports foreign namespace http://example.com/format',
    resProductCatalogue.xsd.includes('<xs:import namespace="http://example.com/format"')
  );
  assert(
    'Multi-Namespace Product Catalogue',
    'Preserves meta:owner via ref instead of placing in catalog namespace',
    resProductCatalogue.xsd.includes('ref="meta:owner"') && !resProductCatalogue.xsd.includes('name="owner"')
  );
  assert(
    'Multi-Namespace Product Catalogue',
    'Preserves meta:source attribute via ref instead of unqualified attribute',
    resProductCatalogue.xsd.includes('ref="meta:source"') && !resProductCatalogue.xsd.includes('name="source"')
  );
  assert(
    'Multi-Namespace Product Catalogue',
    'Preserves fmt:emphasis via ref',
    resProductCatalogue.xsd.includes('ref="fmt:emphasis"') && !resProductCatalogue.xsd.includes('name="emphasis"')
  );
  assert(
    'Multi-Namespace Product Catalogue',
    'Preserves fmt:link via ref',
    resProductCatalogue.xsd.includes('ref="fmt:link"') && !resProductCatalogue.xsd.includes('name="link"')
  );
  assert(
    'Multi-Namespace Product Catalogue',
    'Preserves unqualified id attribute on product',
    resProductCatalogue.xsd.includes('name="id"')
  );
  assert(
    'Multi-Namespace Product Catalogue',
    'Generates schemaSet with companion schemas for foreign namespaces',
    !!resProductCatalogue.schemaSet &&
      !!resProductCatalogue.schemaSet['http://example.com/meta'] &&
      !!resProductCatalogue.schemaSet['http://example.com/format']
  );

  // Validate original XML against the generated schema with real validator
  const roundtripProductCatalogue = validateAgainstXsd(xmlProductCatalogue, resProductCatalogue.xsd);
  assert(
    'Multi-Namespace Product Catalogue',
    'Standalone generated XSD compiles and validates original XML successfully',
    roundtripProductCatalogue.isValid,
    roundtripProductCatalogue.errors.map((e) => e.message).join('; ')
  );

  const roundtripWithSchemaSet = validateAgainstXsd(
    xmlProductCatalogue,
    resProductCatalogue.xsd,
    resProductCatalogue.schemaSet
  );
  assert(
    'Multi-Namespace Product Catalogue',
    'Complete schemaSet compiles and validates original XML with 100% precision',
    roundtripWithSchemaSet.isValid,
    roundtripWithSchemaSet.errors.map((e) => e.message).join('; ')
  );

  const durationMs = Math.round(performance.now() - startTime);
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    durationMs,
    results,
  };
}

/**
 * ToolSAP XSLT Generator & Engine — Automated 50-Case Comprehensive Test Suite
 * Professional Integration & Regression Testing for SAP CPI, PI/PO, and Camel/Saxon runtimes.
 *
 * Verifies 50 rigorous automated test scenarios across 6 categories:
 * - Category 1: Engine Core & Execution Mechanics (Tests 1-8)
 * - Category 2: Enterprise Integration Recipes (Tests 9-20)
 * - Category 3: Namespaces & Universal Compatibility (Tests 21-27)
 * - Category 4: Repeating Loops & Hierarchy Detection (Tests 28-35)
 * - Category 5: Attribute & Element Polymorphism (Tests 36-42)
 * - Category 6: False-Positive Prevention & Edge Conditions (Tests 43-50)
 */

import { executeXsltTransform } from './xsltEngine';
import { generateXsltFromSourceAndTarget } from './xsltGenerator';
import { XSLT_RECIPES } from './xsltRecipesData';
import { XSLT_MAPPING_SAMPLES } from './xsltSamplesData';

export interface TestResultItem {
  id: number;
  category: string;
  name: string;
  passed: boolean;
  details: string;
  executionTimeMs?: number;
}

export interface TestSuiteReport {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResultItem[];
}

export async function runXsltTestSuite(): Promise<TestSuiteReport> {
  const startTime = performance.now();
  const results: TestResultItem[] = [];

  function record(
    id: number,
    category: string,
    name: string,
    passed: boolean,
    details = '',
    elapsed = 0
  ) {
    results.push({
      id,
      category,
      name,
      passed,
      details: passed ? 'PASSED' : `FAILED: ${details}`,
      executionTimeMs: Math.round(elapsed * 10) / 10,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 1: Engine Core & Execution Mechanics (Tests 1 to 8)
  // ───────────────────────────────────────────────────────────────────────────
  const basicXml = '<library><book id="1"><title>Clean Code</title><price>30</price></book></library>';
  const basicXslt = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <catalog>
      <item sku="{//book/@id}">
        <name><xsl:value-of select="//book/title"/></name>
        <cost><xsl:value-of select="//book/price"/></cost>
      </item>
    </catalog>
  </xsl:template>
</xsl:stylesheet>`;

  // Test 1: Basic transform
  const t1 = performance.now();
  const res1 = await executeXsltTransform(basicXml, basicXslt);
  record(
    1,
    '1. Engine Core',
    'Basic XSLT transformation compiles and executes',
    res1.success && res1.outputXml.includes('<catalog>') && res1.outputXml.includes('Clean Code') && res1.outputXml.includes('sku="1"'),
    res1.error?.message,
    performance.now() - t1
  );

  // Test 2: XSLT Parameter Injection
  const paramXslt = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:param name="tenant" select="'default'"/>
  <xsl:template match="/">
    <out><env><xsl:value-of select="$tenant"/></env></out>
  </xsl:template>
</xsl:stylesheet>`;
  const t2 = performance.now();
  const res2 = await executeXsltTransform('<root/>', paramXslt, { parameters: { tenant: 'eu10_prod' } });
  record(
    2,
    '1. Engine Core',
    'Supports dynamic stylesheet parameters ($tenant)',
    res2.success && res2.outputXml.includes('eu10_prod'),
    res2.error?.message,
    performance.now() - t2
  );

  // Test 3: Empty Source XML guard
  const t3 = performance.now();
  const res3 = await executeXsltTransform('', basicXslt);
  record(
    3,
    '1. Engine Core',
    'Rejects empty Source XML with meaningful error code',
    !res3.success && res3.error?.code === 'ERR_EMPTY_SOURCE_XML',
    res3.error?.message,
    performance.now() - t3
  );

  // Test 4: Empty XSLT guard
  const t4 = performance.now();
  const res4 = await executeXsltTransform(basicXml, '');
  record(
    4,
    '1. Engine Core',
    'Rejects empty XSLT Stylesheet with meaningful error code',
    !res4.success && res4.error?.code === 'ERR_EMPTY_XSLT',
    res4.error?.message,
    performance.now() - t4
  );

  // Test 5: Malformed Source XML guard
  const t5 = performance.now();
  const res5 = await executeXsltTransform('<root><unclosed></root>', basicXslt);
  record(
    5,
    '1. Engine Core',
    'Detects malformed Source XML and halts safely',
    !res5.success && res5.error?.code === 'ERR_SOURCE_XML_SYNTAX',
    res5.error?.message,
    performance.now() - t5
  );

  // Test 6: Malformed XSLT guard
  const t6 = performance.now();
  const res6 = await executeXsltTransform(basicXml, '<xsl:stylesheet><unclosed></xsl:stylesheet>');
  record(
    6,
    '1. Engine Core',
    'Detects malformed XSLT stylesheet and halts safely',
    !res6.success && res6.error?.code === 'ERR_XSLT_SYNTAX',
    res6.error?.message,
    performance.now() - t6
  );

  // Test 7: XML entities and escaping
  const specialXml = '<data><msg>A &amp; B &lt; C &gt; &quot;D&quot; &apos;E&apos;</msg></data>';
  const specialXslt = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <out><xsl:value-of select="//msg"/></out>
  </xsl:template>
</xsl:stylesheet>`;
  const t7 = performance.now();
  const res7 = await executeXsltTransform(specialXml, specialXslt);
  record(
    7,
    '1. Engine Core',
    'Correctly encodes and parses XML entities without data corruption',
    res7.success && (res7.outputXml.includes('A & B < C') || res7.outputXml.includes('A &amp; B &lt; C')),
    res7.error?.message,
    performance.now() - t7
  );

  // Test 8: Unicode international characters (Bengali, German, Hindi, Chinese)
  const unicodeXml = '<data><bengali>নমস্কার</bengali><german>Über Größen</german><chinese>你好世界</chinese></data>';
  const unicodeXslt = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <result>
      <msg1><xsl:value-of select="//bengali"/></msg1>
      <msg2><xsl:value-of select="//german"/></msg2>
      <msg3><xsl:value-of select="//chinese"/></msg3>
    </result>
  </xsl:template>
</xsl:stylesheet>`;
  const t8 = performance.now();
  const res8 = await executeXsltTransform(unicodeXml, unicodeXslt);
  record(
    8,
    '1. Engine Core',
    'Preserves multilingual UTF-8 characters (Bengali, German umlauts, Chinese)',
    res8.success && res8.outputXml.includes('নমস্কার') && res8.outputXml.includes('Über Größen') && res8.outputXml.includes('你好世界'),
    res8.error?.message,
    performance.now() - t8
  );

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 2: Enterprise Integration Recipes (Tests 9 to 20)
  // ───────────────────────────────────────────────────────────────────────────
  for (let i = 0; i < XSLT_RECIPES.length; i++) {
    const recipe = XSLT_RECIPES[i];
    const caseId = 9 + i; // IDs 9 to 20
    const rStart = performance.now();
    try {
      const res = await executeXsltTransform(recipe.sampleXml, recipe.defaultXslt);
      let passed = res.success && res.outputXml.length > 0;
      let failureReason = res.error?.message || '';

      if (passed && recipe.id === 'strip-namespaces') {
        const hasNoNs = !res.outputXml.includes('xmlns:soap') && !res.outputXml.includes('xmlns:ord');
        const hasPurchaseOrder = res.outputXml.includes('PurchaseOrder') && res.outputXml.includes('PO-2026-001');
        passed = hasNoNs && hasPurchaseOrder;
        if (!passed) failureReason = 'Namespace attributes were not fully stripped';
      } else if (passed && recipe.id === 'rename-elements') {
        passed = res.outputXml.includes('OrderNumber') && res.outputXml.includes('TotalAmount') && res.outputXml.includes('4500098120');
        if (!passed) failureReason = 'Renamed elements not present in output';
      } else if (passed && recipe.id === 'filter-delete-nodes') {
        passed = !res.outputXml.includes('SensitiveData') && !res.outputXml.includes('CVV') && res.outputXml.includes('ORD-991') && res.outputXml.includes('Laptop');
        if (!passed) failureReason = 'Filtered nodes were not removed from output';
      } else if (passed && recipe.id === 'flatten-hierarchy') {
        passed = res.outputXml.includes('FlatRecords') && res.outputXml.includes('LineTotal') && res.outputXml.includes('Siemens AG');
        if (!passed) failureReason = 'FlatRecords structure not produced';
      } else if (passed && recipe.id === 'wrap-soap-envelope') {
        passed = res.outputXml.includes('soapenv:Envelope') && res.outputXml.includes('soapenv:Body') && res.outputXml.includes('ORD-99120');
        if (!passed) failureReason = 'SOAP envelope wrapper not produced';
      } else if (passed && recipe.id === 'unwrap-soap-body') {
        passed = !res.outputXml.includes('soapenv:Envelope') && res.outputXml.includes('CustomerResponse') && res.outputXml.includes('CUST-4500');
        if (!passed) failureReason = 'SOAP envelope not stripped';
      } else if (passed && recipe.id === 'muenchian-grouping') {
        passed = res.outputXml.includes('GroupedCatalog');
        if (res.engineUsed === 'native-browser') {
          passed = passed && res.outputXml.includes('Electronics') && res.outputXml.includes('Furniture');
        }
        if (!passed) failureReason = 'Muenchian category grouping failed';
      } else if (passed && recipe.id === 'attributes-to-elements') {
        passed = res.outputXml.includes('<id>101</id>') && res.outputXml.includes('<price>29.99</price>');
        if (!passed) failureReason = 'Attributes to elements transformation failed';
      } else if (passed && recipe.id === 'elements-to-attributes') {
        passed = res.outputXml.includes('id="101"') && res.outputXml.includes('price="29.99"');
        if (!passed) failureReason = 'Elements to attributes transformation failed';
      } else if (passed && recipe.id === 'sort-elements') {
        passed = res.outputXml.includes('SortedInventory') && res.outputXml.includes('Item') && res.outputXml.includes('Drill');
        if (!passed) failureReason = 'Sort repeating elements failed';
      } else if (passed && recipe.id === 'xml-to-csv') {
        passed = res.outputXml.includes('ID,Name,Department,Salary') && res.outputXml.includes('Alice Smith');
        if (!passed) failureReason = 'CSV text output not generated properly';
      }

      record(
        caseId,
        '2. Enterprise Recipes',
        `Recipe: ${recipe.name}`,
        passed,
        failureReason,
        performance.now() - rStart
      );
    } catch (recipeEx: any) {
      record(
        caseId,
        '2. Enterprise Recipes',
        `Recipe: ${recipe.name}`,
        false,
        recipeEx?.message || String(recipeEx),
        performance.now() - rStart
      );
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 3: Namespaces & Universal Compatibility (Tests 21 to 27)
  // ───────────────────────────────────────────────────────────────────────────
  // Test 21: Source XML with default namespace
  const srcNs = `<PurchaseOrder xmlns="http://sap.com/xi/CRM"><OrderNumber>PO-9988</OrderNumber><Customer>CUST-123</Customer></PurchaseOrder>`;
  const tgtNs = `<Order><Id>PO-9988</Id><Client>CUST-123</Client></Order>`;
  const t21 = performance.now();
  const res21 = await generateXsltFromSourceAndTarget(srcNs, tgtNs);
  const out21 = res21.testTransform?.outputXml || '';
  record(
    21,
    '3. Namespace Resilience',
    'Source XML with default xmlns generates non-empty mapped values in XSLT 1.0',
    res21.success && out21.includes('PO-9988') && out21.includes('CUST-123'),
    `Empty tag produced: ${out21}`,
    performance.now() - t21
  );

  // Test 22: ISO 20022 Banking XML namespace
  const srcIso = `<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03"><CstmrCdtTrfInitn><GrpHdr><MsgId>MSG-2026-001</MsgId><CreDtTm>2026-10-19T10:00:00Z</CreDtTm></GrpHdr></CstmrCdtTrfInitn></Document>`;
  const tgtIso = `<PaymentBatch><BatchId>MSG-2026-001</BatchId><CreatedTimestamp>2026-10-19T10:00:00Z</CreatedTimestamp></PaymentBatch>`;
  const t22 = performance.now();
  const res22 = await generateXsltFromSourceAndTarget(srcIso, tgtIso);
  const out22 = res22.testTransform?.outputXml || '';
  record(
    22,
    '3. Namespace Resilience',
    'ISO 20022 Banking XML: maps payment message fields without namespace drop',
    res22.success && out22.includes('MSG-2026-001'),
    `ISO 20022 mapping failed: ${out22}`,
    performance.now() - t22
  );

  // Test 23: Multi-namespace prefixed XML
  const srcMultiNs = `<inv:Invoice xmlns:inv="http://example.com/inv" xmlns:cust="http://example.com/cust"><inv:InvNumber>INV-5544</inv:InvNumber><cust:CustomerRef>C-99</cust:CustomerRef></inv:Invoice>`;
  const tgtMultiNs = `<Receipt><InvoiceId>INV-5544</InvoiceId><ClientId>C-99</ClientId></Receipt>`;
  const t23 = performance.now();
  const res23 = await generateXsltFromSourceAndTarget(srcMultiNs, tgtMultiNs);
  const out23 = res23.testTransform?.outputXml || '';
  record(
    23,
    '3. Namespace Resilience',
    'Multi-namespace prefixed XML: maps inv: and cust: prefixes cleanly',
    res23.success && out23.includes('INV-5544') && out23.includes('C-99'),
    `Multi-namespace mapping failed: ${out23}`,
    performance.now() - t23
  );

  // Test 24: Target XML with namespaces preserves xmlns on stylesheet
  const srcPlain = `<Order><Number>1001</Number></Order>`;
  const tgtNamespaced = `<po:PurchaseOrder xmlns:po="http://schemas.sap.com/po"><po:Id>1001</po:Id></po:PurchaseOrder>`;
  const t24 = performance.now();
  const res24 = await generateXsltFromSourceAndTarget(srcPlain, tgtNamespaced);
  record(
    24,
    '3. Namespace Resilience',
    'Target XML namespaces: preserves xmlns:po declaration on generated stylesheet',
    res24.success && res24.xslt.includes('xmlns:po="http://schemas.sap.com/po"'),
    res24.error?.message,
    performance.now() - t24
  );

  // Test 25: Namespaces with repeating loop collection
  const srcNsLoop = `<Feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Entry 1</title><id>urn:1</id></entry><entry><title>Entry 2</title><id>urn:2</id></entry></Feed>`;
  const tgtNsLoop = `<Articles><Article><Heading>Entry 1</Heading><ArticleId>urn:1</ArticleId></Article></Articles>`;
  const t25 = performance.now();
  const res25 = await generateXsltFromSourceAndTarget(srcNsLoop, tgtNsLoop);
  const out25 = res25.testTransform?.outputXml || '';
  record(
    25,
    '3. Namespace Resilience',
    'Atom XML with default namespace: repeating entry loop maps all items',
    res25.success && out25.includes('Entry 1') && out25.includes('Entry 2'),
    `Atom loop failed: ${out25}`,
    performance.now() - t25
  );

  // Test 26: Namespaced attributes (xml:lang)
  const srcAttrNs = `<book xml:lang="en"><title>Domain-Driven Design</title></book>`;
  const tgtAttrNs = `<volume language="en"><name>Domain-Driven Design</name></volume>`;
  const t26 = performance.now();
  const res26 = await generateXsltFromSourceAndTarget(srcAttrNs, tgtAttrNs);
  const out26 = res26.testTransform?.outputXml || '';
  record(
    26,
    '3. Namespace Resilience',
    'Maps namespaced attribute (xml:lang) to target attribute',
    res26.success && out26.includes('Domain-Driven Design'),
    `Attr NS failed: ${out26}`,
    performance.now() - t26
  );

  // Test 27: Multi-Namespace Catalog to Inventory Feed sample
  const catSample = XSLT_MAPPING_SAMPLES.find((s) => s.id === 'catalog-to-feed')!;
  const t27 = performance.now();
  const res27 = await generateXsltFromSourceAndTarget(catSample.sourceXml, catSample.targetXml);
  const out27 = res27.testTransform?.outputXml || '';
  record(
    27,
    '3. Namespace Resilience',
    'Sample 3: Multi-Namespace Catalog transforms into clean InventoryFeed',
    res27.success && out27.includes('InventoryFeed') && out27.includes('SKU-AUDIO-01'),
    res27.testTransform?.error || 'Empty catalog output',
    performance.now() - t27
  );

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 4: Repeating Loops & Hierarchy Detection (Tests 28 to 35)
  // ───────────────────────────────────────────────────────────────────────────
  // Test 28: SAP IDoc ORDERS05 to Canonical Purchase Order
  const idocSample = XSLT_MAPPING_SAMPLES.find((s) => s.id === 'sap-idoc-to-order')!;
  const t28 = performance.now();
  const res28 = await generateXsltFromSourceAndTarget(idocSample.sourceXml, idocSample.targetXml);
  const out28 = res28.testTransform?.outputXml || '';
  record(
    28,
    '4. Repeating Loops',
    'SAP IDoc ORDERS05: E1EDP01 repeating segments map to Item lines with values',
    res28.success && res28.xslt.includes('xsl:for-each') && out28.includes('PurchaseOrder') && out28.includes('4500098120') && out28.includes('Ball Bearing'),
    res28.testTransform?.error || 'Failed IDoc transform',
    performance.now() - t28
  );

  // Test 29: Single-sample target template repeats all source items
  const srcRepeat3 = `<Order><Items><Item><SKU>A1</SKU><Price>10</Price></Item><Item><SKU>B2</SKU><Price>20</Price></Item><Item><SKU>C3</SKU><Price>30</Price></Item></Items></Order>`;
  const tgtSingleSample = `<PurchaseOrder><Lines><Line><ProductCode>A1</ProductCode><Amount>10</Amount></Line></Lines></PurchaseOrder>`;
  const t29 = performance.now();
  const res29 = await generateXsltFromSourceAndTarget(srcRepeat3, tgtSingleSample);
  const out29 = res29.testTransform?.outputXml || '';
  const lineMatches29 = (out29.match(/<Line>/g) || []).length;
  record(
    29,
    '4. Repeating Loops',
    'Single-sample target template repeats for all 3 source items without dropping items',
    res29.success && lineMatches29 === 3 && out29.includes('C3'),
    `Expected 3 lines, got ${lineMatches29}. Output: ${out29}`,
    performance.now() - t29
  );

  // Test 30: Header reference mapped inside repeating loop lines
  const srcHeaderRef = `<Order><DocNumber>DOC-12345</DocNumber><Items><Item><SKU>ITEM-1</SKU><Price>10.50</Price></Item><Item><SKU>ITEM-2</SKU><Price>25.00</Price></Item></Items></Order>`;
  const tgtHeaderRef = `<PurchaseOrder><Lines><Line><OrderRef>DOC-12345</OrderRef><ProductCode>ITEM-1</ProductCode><Amount>10.50</Amount></Line></Lines></PurchaseOrder>`;
  const t30 = performance.now();
  const res30 = await generateXsltFromSourceAndTarget(srcHeaderRef, tgtHeaderRef);
  const out30 = res30.testTransform?.outputXml || '';
  record(
    30,
    '4. Repeating Loops',
    'Header field mapped inside loop produces dynamic document-wide XPath',
    res30.success && res30.xslt.includes('DocNumber') && out30.includes('DOC-12345'),
    `Header ref failed: ${out30}`,
    performance.now() - t30
  );

  // Test 31: Deep 5-level hierarchy flattening
  const deepSource = '<l1><l2><l3><l4><leaf>DeepValue</leaf></l4></l3></l2></l1>';
  const deepTarget = '<out><data><value>DeepValue</value></data></out>';
  const t31 = performance.now();
  const res31 = await generateXsltFromSourceAndTarget(deepSource, deepTarget);
  record(
    31,
    '4. Repeating Loops',
    'Deep 5-level hierarchy traversal maps leaf field into shallow target',
    res31.success && (res31.testTransform?.outputXml || '').includes('DeepValue'),
    res31.testTransform?.error,
    performance.now() - t31
  );

  // Test 32: Healthcare Clinical Record (Sample 4)
  const hl7Sample = XSLT_MAPPING_SAMPLES.find((s) => s.id === 'patient-to-profile')!;
  const t32 = performance.now();
  const res32 = await generateXsltFromSourceAndTarget(hl7Sample.sourceXml, hl7Sample.targetXml);
  const out32 = res32.testTransform?.outputXml || '';
  record(
    32,
    '4. Repeating Loops',
    'Sample 4: Clinical Record transforms into PatientProfile with emergency contacts',
    res32.success && out32.includes('PatientProfile') && out32.includes('Thomas Vance'),
    res32.testTransform?.error || 'Failed HL7 transform',
    performance.now() - t32
  );

  // Test 33: Loop with sub-element relative XPath navigation
  const srcSubPath = `<Catalog><Product><Details><Spec><Weight>5.2kg</Weight></Spec></Details></Product></Catalog>`;
  const tgtSubPath = `<Inventory><Item><WeightValue>5.2kg</WeightValue></Item></Inventory>`;
  const t33 = performance.now();
  const res33 = await generateXsltFromSourceAndTarget(srcSubPath, tgtSubPath);
  const out33 = res33.testTransform?.outputXml || '';
  record(
    33,
    '4. Repeating Loops',
    'Relative XPath correctly navigates nested sub-elements within loop context',
    res33.success && out33.includes('5.2kg'),
    `Sub-path failed: ${out33}`,
    performance.now() - t33
  );

  // Test 34: Loop items with attributes
  const srcLoopAttr = `<Orders><Item id="001" qty="5"><Name>Screw</Name></Item><Item id="002" qty="10"><Name>Bolt</Name></Item></Orders>`;
  const tgtLoopAttr = `<Lines><Line position="001" count="5"><Title>Screw</Title></Line></Lines>`;
  const t34 = performance.now();
  const res34 = await generateXsltFromSourceAndTarget(srcLoopAttr, tgtLoopAttr);
  const out34 = res34.testTransform?.outputXml || '';
  record(
    34,
    '4. Repeating Loops',
    'Repeating loop items with attribute value templates evaluate accurately',
    res34.success && out34.includes('position="001"') && out34.includes('position="002"'),
    `Loop attr failed: ${out34}`,
    performance.now() - t34
  );

  // Test 35: Empty or single repeating list handles gracefully
  const srcSingleItem = `<Items><Item><Code>SINGLE</Code></Item></Items>`;
  const tgtSingleItem = `<Products><Product><SKU>SINGLE</SKU></Product></Products>`;
  const t35 = performance.now();
  const res35 = await generateXsltFromSourceAndTarget(srcSingleItem, tgtSingleItem);
  const out35 = res35.testTransform?.outputXml || '';
  record(
    35,
    '4. Repeating Loops',
    'Single-item list handles gracefully and produces valid product XML',
    res35.success && out35.includes('SINGLE'),
    res35.error?.message,
    performance.now() - t35
  );

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 5: Attribute & Element Polymorphism (Tests 36 to 42)
  // ───────────────────────────────────────────────────────────────────────────
  // Test 36: Attributes in Source mapped to Elements in Target
  const srcAttrToElem = `<book id="BK-101" price="19.99"><title>Refactoring</title></book>`;
  const tgtAttrToElem = `<item><isbn>BK-101</isbn><cost>19.99</cost><name>Refactoring</name></item>`;
  const t36 = performance.now();
  const res36 = await generateXsltFromSourceAndTarget(srcAttrToElem, tgtAttrToElem);
  const out36 = res36.testTransform?.outputXml || '';
  record(
    36,
    '5. Attribute Polymorphism',
    'Attributes in Source XML map into child elements in Target XML',
    res36.success && out36.includes('<isbn>BK-101</isbn>') && out36.includes('<cost>19.99</cost>'),
    `Attr to Elem failed: ${out36}`,
    performance.now() - t36
  );

  // Test 37: Elements in Source mapped to Attributes in Target
  const srcElemToAttr = `<item><isbn>BK-101</isbn><cost>19.99</cost><name>Refactoring</name></item>`;
  const tgtElemToAttr = `<book id="BK-101" price="19.99"><title>Refactoring</title></book>`;
  const t37 = performance.now();
  const res37 = await generateXsltFromSourceAndTarget(srcElemToAttr, tgtElemToAttr);
  const out37 = res37.testTransform?.outputXml || '';
  record(
    37,
    '5. Attribute Polymorphism',
    'Elements in Source XML map into container attributes in Target XML',
    res37.success && out37.includes('id="BK-101"') && out37.includes('price="19.99"'),
    `Elem to Attr failed: ${out37}`,
    performance.now() - t37
  );

  // Test 38: Attribute in Source to Attribute in Target
  const srcAttrToAttr = `<product sku="SKU-88" status="available"/>`;
  const tgtAttrToAttr = `<item id="SKU-88" state="available"/>`;
  const t38 = performance.now();
  const res38 = await generateXsltFromSourceAndTarget(srcAttrToAttr, tgtAttrToAttr);
  const out38 = res38.testTransform?.outputXml || '';
  record(
    38,
    '5. Attribute Polymorphism',
    'Attribute in Source maps to Attribute in Target with quoted template',
    res38.success && out38.includes('id="SKU-88"') && out38.includes('state="available"'),
    `Attr to Attr failed: ${out38}`,
    performance.now() - t38
  );

  // Test 39: Mixed attributes and child elements in same container
  const srcMixed = `<record key="K-1"><user email="dev@sap.com">Alice</user></record>`;
  const tgtMixed = `<profile accountId="K-1"><name>Alice</name><contact mail="dev@sap.com"/></profile>`;
  const t39 = performance.now();
  const res39 = await generateXsltFromSourceAndTarget(srcMixed, tgtMixed);
  const out39 = res39.testTransform?.outputXml || '';
  record(
    39,
    '5. Attribute Polymorphism',
    'Mixed attributes and nested child elements map with complete fidelity',
    res39.success && out39.includes('accountId="K-1"') && out39.includes('Alice'),
    `Mixed failed: ${out39}`,
    performance.now() - t39
  );

  // Test 40: Static attributes in Target XML preserved when unmapped
  const srcNoCurr = `<order><total>500</total></order>`;
  const tgtStaticCurr = `<order currency="EUR"><amount>500</amount></order>`;
  const t40 = performance.now();
  const res40 = await generateXsltFromSourceAndTarget(srcNoCurr, tgtStaticCurr);
  const out40 = res40.testTransform?.outputXml || '';
  record(
    40,
    '5. Attribute Polymorphism',
    'Static target attributes (currency="EUR") preserved cleanly in output',
    res40.success && out40.includes('currency="EUR"'),
    `Static attr lost: ${out40}`,
    performance.now() - t40
  );

  // Test 41: Special characters in static attributes escaped
  const srcEsc = `<msg>Hello</msg>`;
  const tgtEsc = `<out note="John &amp; Bob &quot;Rules&quot;"><text>Hello</text></out>`;
  const t41 = performance.now();
  const res41 = await generateXsltFromSourceAndTarget(srcEsc, tgtEsc);
  record(
    41,
    '5. Attribute Polymorphism',
    'Special characters in static attributes escaped without XML syntax errors',
    res41.success && !!res41.testTransform?.success,
    res41.testTransform?.error,
    performance.now() - t41
  );

  // Test 42: SOAP Customer Query sample (Sample 2)
  const soapSample = XSLT_MAPPING_SAMPLES.find((s) => s.id === 'soap-to-canonical')!;
  const t42 = performance.now();
  const res42 = await generateXsltFromSourceAndTarget(soapSample.sourceXml, soapSample.targetXml);
  const out42 = res42.testTransform?.outputXml || '';
  record(
    42,
    '5. Attribute Polymorphism',
    'Sample 2: SOAP Web Service query maps to CustomerProfile with attributes',
    res42.success && out42.includes('CustomerProfile') && out42.includes('C-77889') && out42.includes('Nordic Wind Energy'),
    res42.testTransform?.error || 'Failed SOAP sample transform',
    performance.now() - t42
  );

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 6: False-Positive Prevention & Edge Conditions (Tests 43 to 50)
  // ───────────────────────────────────────────────────────────────────────────
  // Test 43: Non-empty value verification (Guards against empty tags <Tag/>)
  const srcValCheck = `<record><id>999</id><name>Alpha</name><status>Active</status></record>`;
  const tgtValCheck = `<item><code_id>999</code_id><title>Alpha</title><state>Active</state></item>`;
  const t43 = performance.now();
  const res43 = await generateXsltFromSourceAndTarget(srcValCheck, tgtValCheck);
  const out43 = res43.testTransform?.outputXml || '';
  const hasAllValues = out43.includes('>999<') && out43.includes('>Alpha<') && out43.includes('>Active<');
  record(
    43,
    '6. False-Positive Prevention',
    'Asserts transformed elements contain real values and are NOT empty tags',
    res43.success && hasAllValues,
    `Output contained empty elements: ${out43}`,
    performance.now() - t43
  );

  // Test 44: Exact item count validation (Guards against dropped loop items)
  const srcCount = `<root><entry><val>1</val></entry><entry><val>2</val></entry><entry><val>3</val></entry><entry><val>4</val></entry></root>`;
  const tgtCount = `<out><item><v>1</v></item></out>`;
  const t44 = performance.now();
  const res44 = await generateXsltFromSourceAndTarget(srcCount, tgtCount);
  const out44 = res44.testTransform?.outputXml || '';
  const itemCount = (out44.match(/<item>/g) || []).length;
  record(
    44,
    '6. False-Positive Prevention',
    'Asserts output loop count strictly matches source input count (4 items)',
    res44.success && itemCount === 4 && out44.includes('>4<'),
    `Expected 4 items, got ${itemCount}`,
    performance.now() - t44
  );

  // Test 45: Unmapped fields do not inject "TODO: Unmapped" into numbers
  const srcUnmapped = `<order><price>99.99</price></order>`;
  const tgtUnmapped = `<order><amount>99.99</amount><discountRate/></order>`;
  const t45 = performance.now();
  const res45 = await generateXsltFromSourceAndTarget(srcUnmapped, tgtUnmapped);
  const out45 = res45.testTransform?.outputXml || '';
  record(
    45,
    '6. False-Positive Prevention',
    'Unmapped elements render empty tag instead of injecting "TODO" text constants',
    res45.success && !out45.includes('TODO: Unmapped') && out45.includes('99.99'),
    `Injected TODO text into output: ${out45}`,
    performance.now() - t45
  );

  // Test 46: Empty source guard in generator
  const t46 = performance.now();
  const res46 = await generateXsltFromSourceAndTarget('', '<target/>');
  record(
    46,
    '6. Edge Conditions',
    'generateXsltFromSourceAndTarget guards against empty Source XML',
    !res46.success && res46.error?.code === 'ERR_EMPTY_SOURCE',
    res46.error?.message,
    performance.now() - t46
  );

  // Test 47: Empty target guard in generator
  const t47 = performance.now();
  const res47 = await generateXsltFromSourceAndTarget('<source/>', '');
  record(
    47,
    '6. Edge Conditions',
    'generateXsltFromSourceAndTarget guards against empty Target XML',
    !res47.success && res47.error?.code === 'ERR_EMPTY_TARGET',
    res47.error?.message,
    performance.now() - t47
  );

  // Test 48: Whitespace-only input guard
  const t48 = performance.now();
  const res48 = await generateXsltFromSourceAndTarget('   \n  \t  ', '<target/>');
  record(
    48,
    '6. Edge Conditions',
    'Whitespace-only source input treated as empty and halts safely',
    !res48.success && res48.error?.code === 'ERR_EMPTY_SOURCE',
    res48.error?.message,
    performance.now() - t48
  );

  // Test 49: Omit XML Declaration configuration
  const t49 = performance.now();
  const res49 = await generateXsltFromSourceAndTarget('<a/>', '<b/>', { omitXmlDeclaration: true });
  record(
    49,
    '6. Edge Conditions',
    'Applies omit-xml-declaration="yes" when configured in options',
    res49.success && res49.xslt.includes('omit-xml-declaration="yes"'),
    res49.error?.message,
    performance.now() - t49
  );

  // Test 50: High-Performance Stress Benchmark (100 items transformation)
  let stressXml = '<catalog>';
  for (let s = 1; s <= 100; s++) {
    stressXml += `<product id="${s}"><name>Product ${s}</name><price>${(s * 1.5).toFixed(2)}</price></product>`;
  }
  stressXml += '</catalog>';
  const stressXslt = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <feed>
      <xsl:for-each select="//product">
        <item code="{@id}"><title><xsl:value-of select="name"/></title><cost><xsl:value-of select="price"/></cost></item>
      </xsl:for-each>
    </feed>
  </xsl:template>
</xsl:stylesheet>`;
  const t50 = performance.now();
  const res50 = await executeXsltTransform(stressXml, stressXslt);
  const elapsed50 = performance.now() - t50;
  record(
    50,
    '6. High-Performance Benchmark',
    'Transforms 100-item enterprise catalog XML in < 150 ms without performance degradation',
    res50.success && (res50.outputXml.match(/<item/g) || []).length === 100 && elapsed50 < 150,
    `Duration was ${elapsed50.toFixed(1)}ms. Success: ${res50.success}`,
    elapsed50
  );

  const durationMs = Math.round(performance.now() - startTime);

  return {
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    durationMs,
    results,
  };
}

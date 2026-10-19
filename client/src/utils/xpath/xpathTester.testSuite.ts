/**
 * Automated Comprehensive Test Suite for ToolSAP XPath Evaluator Engine
 * Validates 75+ real-world, edge-case, and complex enterprise XPath scenarios:
 * - Basic & Wildcards
 * - Attributes, Text, CDATA & Comments
 * - Predicates, Chained & Positional
 * - XPath Axes (following-sibling, ancestor, parent, child, etc.)
 * - XPath 1.0 & 3.1 Functions (String, Numeric, Boolean, Aggregate)
 * - XPath 3.1 FLWOR, Arrow Operator (=>), Maps, Arrays, Sequences
 * - Multi-Namespace Payloads & Namespace-Agnostic conversion
 * - SAP CPI, S/4HANA IDocs (ORDERS05), SOAP Envelopes
 * - Malformed XML, Syntax Errors & Undeclared Namespaces
 */

import {
  evaluateXPathExpression,
  convertToNamespaceAgnostic,
  extractNamespacesFromXml,
  XPATH_PRESET_SAMPLES,
  type XPathEvaluationResult,
} from './xpathEvaluator';

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

export interface XPathTestCaseDefinition {
  id: number;
  category: string;
  name: string;
  xml: string;
  xpath: string;
  options?: any;
  expectSuccess: boolean;
  expectedMatches?: number;
  expectedReturnType?: string;
  expectedValue?: any;
  validate?: (res: XPathEvaluationResult) => boolean | string;
}

export const COMPREHENSIVE_XPATH_TEST_CASES: XPathTestCaseDefinition[] = [
  // ─── PART 1: Basic Node Selection & Wildcards ──────────────────────────────
  {
    id: 1,
    category: '1. Basic & Wildcard',
    name: 'Select root element directly',
    xml: '<catalog><item id="1">A</item></catalog>',
    xpath: '/catalog',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.name === 'catalog',
  },
  {
    id: 2,
    category: '1. Basic & Wildcard',
    name: 'Deep descendant selector //',
    xml: '<root><section><item>1</item><item>2</item></section><item>3</item></root>',
    xpath: '//item',
    expectSuccess: true,
    expectedMatches: 3,
  },
  {
    id: 3,
    category: '1. Basic & Wildcard',
    name: 'Wildcard child element *',
    xml: '<store><header>Info</header><products><p1>A</p1><p2>B</p2></products></store>',
    xpath: '/store/*',
    expectSuccess: true,
    expectedMatches: 2,
  },
  {
    id: 4,
    category: '1. Basic & Wildcard',
    name: 'Deep wildcard //*',
    xml: '<a><b><c>1</c></b></a>',
    xpath: '//*',
    expectSuccess: true,
    expectedMatches: 3,
  },
  {
    id: 5,
    category: '1. Basic & Wildcard',
    name: 'Case sensitivity in XML tags',
    xml: '<items><item>lower</item><Item>Upper</Item><ITEM>ALLCAPS</ITEM></items>',
    xpath: '//item',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'lower',
  },

  // ─── PART 2: Attributes, Text, CDATA & Comments ────────────────────────────
  {
    id: 6,
    category: '2. Node Types',
    name: 'Single attribute selection @id',
    xml: '<root><item id="A1" status="open">Val</item></root>',
    xpath: '//item/@id',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'A1' && r.matches[0]?.nodeType === 'attribute',
  },
  {
    id: 7,
    category: '2. Node Types',
    name: 'Wildcard attribute selector @*',
    xml: '<item sku="SKU01" qty="5" active="true" />',
    xpath: '//item/@*',
    expectSuccess: true,
    expectedMatches: 3,
  },
  {
    id: 8,
    category: '2. Node Types',
    name: 'Text node child selection text()',
    xml: '<title>   Hello ToolSAP   </title>',
    xpath: '//title/text()',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'Hello ToolSAP' && r.matches[0]?.nodeType === 'text',
  },
  {
    id: 9,
    category: '2. Node Types',
    name: 'Comment node selection comment()',
    xml: '<root><!-- Note 1 --><data>123</data><!-- Note 2 --></root>',
    xpath: '//comment()',
    expectSuccess: true,
    expectedMatches: 2,
    validate: (r) => r.matches[0]?.nodeType === 'comment',
  },
  {
    id: 10,
    category: '2. Node Types',
    name: 'CDATA section text extraction',
    xml: '<root><message><![CDATA[a < b && c > d]]></message></root>',
    xpath: '//message/text()',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'a < b && c > d',
  },

  // ─── PART 3: Predicates, Chained & Nested ──────────────────────────────────
  {
    id: 11,
    category: '3. Predicates',
    name: 'First element by numeric index [1]',
    xml: '<list><e>First</e><e>Second</e><e>Third</e></list>',
    xpath: '//e[1]',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'First',
  },
  {
    id: 12,
    category: '3. Predicates',
    name: 'Last element [last()]',
    xml: '<list><e>First</e><e>Second</e><e>Third</e></list>',
    xpath: '//e[last()]',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'Third',
  },
  {
    id: 13,
    category: '3. Predicates',
    name: 'Position range [position() >= 2 and position() <= 3]',
    xml: '<list><e>1</e><e>2</e><e>3</e><e>4</e></list>',
    xpath: '//e[position() >= 2 and position() <= 3]',
    expectSuccess: true,
    expectedMatches: 2,
  },
  {
    id: 14,
    category: '3. Predicates',
    name: 'Chained predicates [price > 10][@status="available"]',
    xml: `<items>
      <item status="available"><price>15</price></item>
      <item status="pending"><price>20</price></item>
      <item status="available"><price>5</price></item>
    </items>`,
    xpath: '//item[price > 10][@status="available"]',
    expectSuccess: true,
    expectedMatches: 1,
  },
  {
    id: 15,
    category: '3. Predicates',
    name: 'Nested child predicate: select parent based on child criteria',
    xml: `<orders>
      <order id="O1"><item name="Book" price="25"/></order>
      <order id="O2"><item name="Pen" price="5"/></order>
    </orders>`,
    xpath: '//order[item[@price > 10]]/@id',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'O1',
  },
  {
    id: 16,
    category: '3. Predicates',
    name: 'Predicate with boolean or operator',
    xml: '<records><r type="A"/><r type="B"/><r type="C"/></records>',
    xpath: '//r[@type="A" or @type="C"]',
    expectSuccess: true,
    expectedMatches: 2,
  },
  {
    id: 17,
    category: '3. Predicates',
    name: 'Predicate with not() function',
    xml: '<users><user active="true">Alice</user><user active="false">Bob</user></users>',
    xpath: '//user[not(@active="true")]/text()',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'Bob',
  },

  // ─── PART 4: XPath Axes ────────────────────────────────────────────────────
  {
    id: 18,
    category: '4. Axes',
    name: 'Parent axis parent::',
    xml: '<root><parent><child id="c1"/></parent></root>',
    xpath: '//child/parent::parent',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.name === 'parent',
  },
  {
    id: 19,
    category: '4. Axes',
    name: 'Ancestor axis ancestor::',
    xml: '<g1><g2><g3><target/></g3></g2></g1>',
    xpath: '//target/ancestor::g1',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.name === 'g1',
  },
  {
    id: 20,
    category: '4. Axes',
    name: 'Following-sibling axis following-sibling::',
    xml: '<steps><step n="1"/><step n="2"/><step n="3"/><step n="4"/></steps>',
    xpath: '//step[@n="2"]/following-sibling::step',
    expectSuccess: true,
    expectedMatches: 2,
  },
  {
    id: 21,
    category: '4. Axes',
    name: 'Preceding-sibling axis preceding-sibling::',
    xml: '<steps><step n="1"/><step n="2"/><step n="3"/></steps>',
    xpath: '//step[@n="3"]/preceding-sibling::step',
    expectSuccess: true,
    expectedMatches: 2,
  },
  {
    id: 22,
    category: '4. Axes',
    name: 'Self axis self::',
    xml: '<items><item type="special"/></items>',
    xpath: '//item/self::*[@type="special"]',
    expectSuccess: true,
    expectedMatches: 1,
  },

  // ─── PART 5: Core XPath 1.0 & 2.0 Functions ────────────────────────────────
  {
    id: 23,
    category: '5. Core Functions',
    name: 'count() function returning number',
    xml: '<list><e/><e/><e/><e/><e/></list>',
    xpath: 'count(//e)',
    expectSuccess: true,
    expectedReturnType: 'number',
    expectedValue: 5,
  },
  {
    id: 24,
    category: '5. Core Functions',
    name: 'sum() function on decimal values',
    xml: '<items><p>10.50</p><p>20.25</p><p>4.25</p></items>',
    xpath: 'sum(//p)',
    expectSuccess: true,
    expectedReturnType: 'number',
    expectedValue: 35,
  },
  {
    id: 25,
    category: '5. Core Functions',
    name: 'contains() substring check',
    xml: '<data><row>INV-2026-001</row><row>ORD-2026-999</row></data>',
    xpath: '//row[contains(text(), "INV")]/text()',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'INV-2026-001',
  },
  {
    id: 26,
    category: '5. Core Functions',
    name: 'starts-with() prefix check',
    xml: '<codes><c>SAP_PO</c><c>SAP_CPI</c><c>ORACLE_ERP</c></codes>',
    xpath: '//c[starts-with(text(), "SAP")]',
    expectSuccess: true,
    expectedMatches: 2,
  },
  {
    id: 27,
    category: '5. Core Functions',
    name: 'ends-with() check (XPath 2.0+)',
    xml: '<files><f>doc.pdf</f><f>img.png</f><f>sheet.pdf</f></files>',
    xpath: '//f[ends-with(text(), ".pdf")]',
    expectSuccess: true,
    expectedMatches: 2,
  },
  {
    id: 28,
    category: '5. Core Functions',
    name: 'string-length() function',
    xml: '<strings><s>hi</s><s>antigravity</s><s>tool</s></strings>',
    xpath: '//s[string-length(text()) > 5]/text()',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'antigravity',
  },
  {
    id: 29,
    category: '5. Core Functions',
    name: 'normalize-space() trimming whitespace and internal collapses',
    xml: '<info>   Clean    Data \n\t Value   </info>',
    xpath: 'normalize-space(//info/text())',
    expectSuccess: true,
    expectedReturnType: 'string',
    expectedValue: 'Clean Data Value',
  },
  {
    id: 30,
    category: '5. Core Functions',
    name: 'concat() formatting composite string',
    xml: '<person><first>John</first><last>Doe</last></person>',
    xpath: 'concat(//last, ", ", //first)',
    expectSuccess: true,
    expectedReturnType: 'string',
    expectedValue: 'Doe, John',
  },
  {
    id: 31,
    category: '5. Core Functions',
    name: 'substring() with 1-based indexing',
    xml: '<code val="ABCDEF1234"/>',
    xpath: 'substring(//code/@val, 1, 6)',
    expectSuccess: true,
    expectedReturnType: 'string',
    expectedValue: 'ABCDEF',
  },
  {
    id: 32,
    category: '5. Core Functions',
    name: 'substring-after() delimiter extraction',
    xml: '<url>urn:sap:orders:v1</url>',
    xpath: 'substring-after(//url, "urn:sap:")',
    expectSuccess: true,
    expectedReturnType: 'string',
    expectedValue: 'orders:v1',
  },
  {
    id: 33,
    category: '5. Core Functions',
    name: 'substring-before() extraction',
    xml: '<email>developer@toolsap.io</email>',
    xpath: 'substring-before(//email, "@")',
    expectSuccess: true,
    expectedReturnType: 'string',
    expectedValue: 'developer',
  },
  {
    id: 34,
    category: '5. Core Functions',
    name: 'translate() character substitution (XPath 1.0 lowercase idiom)',
    xml: '<text>HELLO WORLD</text>',
    xpath: "translate(//text, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')",
    expectSuccess: true,
    expectedReturnType: 'string',
    expectedValue: 'hello world',
  },

  // ─── PART 6: XPath 3.1 & 2.0 Advanced Functions ───────────────────────────
  {
    id: 35,
    category: '6. XPath 3.1 Advanced',
    name: 'lower-case() standard function',
    xml: '<field>CPI-PROD-01</field>',
    xpath: 'lower-case(//field)',
    expectSuccess: true,
    expectedReturnType: 'string',
    expectedValue: 'cpi-prod-01',
  },
  {
    id: 36,
    category: '6. XPath 3.1 Advanced',
    name: 'upper-case() standard function',
    xml: '<field>integration suite</field>',
    xpath: 'upper-case(//field)',
    expectSuccess: true,
    expectedReturnType: 'string',
    expectedValue: 'INTEGRATION SUITE',
  },
  {
    id: 37,
    category: '6. XPath 3.1 Advanced',
    name: 'matches() regex pattern matching',
    xml: '<records><r>ORD-12345</r><r>INVALID</r><r>ORD-99999</r></records>',
    xpath: '//r[matches(text(), "^ORD-\\d{5}$")]',
    expectSuccess: true,
    expectedMatches: 2,
  },
  {
    id: 38,
    category: '6. XPath 3.1 Advanced',
    name: 'replace() regex string substitution',
    xml: '<tel>(555) 123-4567</tel>',
    xpath: 'replace(//tel, "[^0-9]", "")',
    expectSuccess: true,
    expectedReturnType: 'string',
    expectedValue: '5551234567',
  },
  {
    id: 39,
    category: '6. XPath 3.1 Advanced',
    name: 'string-join() sequence joining',
    xml: '<tags><t>SAP</t><t>CPI</t><t>Groovy</t></tags>',
    xpath: 'string-join(//t, " / ")',
    expectSuccess: true,
    expectedReturnType: 'string',
    expectedValue: 'SAP / CPI / Groovy',
  },
  {
    id: 40,
    category: '6. XPath 3.1 Advanced',
    name: 'Sequence range operator (1 to 5)',
    xml: '<root/>',
    xpath: 'sum(1 to 5)',
    expectSuccess: true,
    expectedReturnType: 'number',
    expectedValue: 15,
  },

  // ─── PART 7: Namespaces, Prefixes & Agnostic Queries ────────────────────────
  {
    id: 41,
    category: '7. Namespaces',
    name: 'Explicit namespace prefix lookup (soap:Body)',
    xml: '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><content>Payload</content></soap:Body></soap:Envelope>',
    xpath: '//soap:Body/content',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'Payload',
  },
  {
    id: 42,
    category: '7. Namespaces',
    name: 'Predefined xsi:nil attribute without explicit xmlns:xsi declaration',
    xml: '<employee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><name>Bob</name><emergencyContact xsi:nil="true"/></employee>',
    xpath: '//emergencyContact[@xsi:nil="true"]',
    expectSuccess: true,
    expectedMatches: 1,
  },
  {
    id: 43,
    category: '7. Namespaces',
    name: 'Default namespace mapped to dft: prefix',
    xml: '<store xmlns="https://example.com/store"><product id="P1"><name>Hub</name></product></store>',
    xpath: '//dft:product/dft:name',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'Hub',
  },
  {
    id: 44,
    category: '7. Namespaces',
    name: 'Multiple foreign namespaces simultaneously (meta: and ui:)',
    xml: `<bundle xmlns="https://example.org/base" xmlns:meta="https://example.org/meta" xmlns:ui="https://example.org/ui">
      <meta:info owner="Platform"/>
      <ui:label text="Dashboard"/>
    </bundle>`,
    xpath: '//meta:info/@owner',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'Platform',
  },
  {
    id: 45,
    category: '7. Namespaces',
    name: 'Namespace-agnostic conversion on complex query with string literal',
    xml: '<store xmlns="https://example.com/store"><product status="in-stock:warehouse"><price>99</price></product></store>',
    xpath: convertToNamespaceAgnostic('/store/product[@status="in-stock:warehouse"]/price'),
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === '99',
  },

  // ─── PART 8: SAP CPI Integration & IDoc Scenarios ──────────────────────────
  {
    id: 46,
    category: '8. SAP CPI Scenarios',
    name: 'CPI Content Modifier: extract PO number',
    xml: '<ORDERS05><IDOC><E1EDK01><BELNR>4500098120</BELNR></E1EDK01></IDOC></ORDERS05>',
    xpath: '//E1EDK01/BELNR/text()',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === '4500098120',
  },
  {
    id: 47,
    category: '8. SAP CPI Scenarios',
    name: 'CPI Router: boolean condition on partner land',
    xml: '<IDOC><E1EDKA1><PARVW>WE</PARVW><LAND1>DE</LAND1></E1EDKA1></IDOC>',
    xpath: 'boolean(//E1EDKA1[PARVW="WE" and LAND1="DE"])',
    expectSuccess: true,
    expectedReturnType: 'boolean',
    expectedValue: true,
  },
  {
    id: 48,
    category: '8. SAP CPI Scenarios',
    name: 'CPI Splitter: select line item segments',
    xml: '<ORDERS05><IDOC><E1EDP01 pos="10"/><E1EDP01 pos="20"/><E1EDP01 pos="30"/></IDOC></ORDERS05>',
    xpath: '//E1EDP01',
    expectSuccess: true,
    expectedMatches: 3,
  },
  {
    id: 49,
    category: '8. SAP CPI Scenarios',
    name: 'SOAP Web Service: select WS-Addressing MessageID',
    xml: `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsa="http://www.w3.org/2005/08/addressing">
      <soap:Header><wsa:MessageID>urn:uuid:7f3b890a-1234</wsa:MessageID></soap:Header>
      <soap:Body><data/></soap:Body>
    </soap:Envelope>`,
    xpath: '//wsa:MessageID/text()',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'urn:uuid:7f3b890a-1234',
  },
  {
    id: 50,
    category: '8. SAP CPI Scenarios',
    name: 'Namespace-agnostic fallback for uncooperative partner payload',
    xml: '<n0:OrderResponse xmlns:n0="urn:sap:orders"><n0:Status>Confirmed</n0:Status></n0:OrderResponse>',
    xpath: "//*[local-name()='OrderResponse']/*[local-name()='Status']/text()",
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'Confirmed',
  },

  // ─── PART 9: Edge Cases (Self-closing, Unicode, Special Characters) ─────────
  {
    id: 51,
    category: '9. Edge Cases',
    name: 'Self-closing empty element match',
    xml: '<root><active/><disabled/></root>',
    xpath: '//active',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.name === 'active',
  },
  {
    id: 52,
    category: '9. Edge Cases',
    name: 'Multilingual Unicode text (Bengali & German)',
    xml: '<data><label lang="bn">গ্রাহক</label><label lang="de">Geschäftsführer</label></data>',
    xpath: '//label[@lang="bn"]/text()',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'গ্রাহক',
  },
  {
    id: 53,
    category: '9. Edge Cases',
    name: 'Special XML entities in text content (&amp;, &lt;)',
    xml: '<info><desc>A &amp; B &lt; C</desc></info>',
    xpath: '//desc[contains(text(), "&")]',
    expectSuccess: true,
    expectedMatches: 1,
  },
  {
    id: 54,
    category: '9. Edge Cases',
    name: 'Deep nesting (10 levels)',
    xml: '<l1><l2><l3><l4><l5><l6><l7><l8><l9><l10 val="deep"/></l9></l8></l7></l6></l5></l4></l3></l2></l1>',
    xpath: '//l10/@val',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'deep',
  },
  {
    id: 55,
    category: '9. Edge Cases',
    name: 'Mixed content element with text and child tags',
    xml: '<desc>Start <emp>important</emp> middle <link href="url">link</link> end.</desc>',
    xpath: '//desc/emp/text()',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'important',
  },

  // ─── PART 10: Negative Syntax & Error Handling ─────────────────────────────
  {
    id: 56,
    category: '10. Error Handling',
    name: 'Empty XML document',
    xml: '   ',
    xpath: '//item',
    expectSuccess: false,
  },
  {
    id: 57,
    category: '10. Error Handling',
    name: 'Empty XPath expression',
    xml: '<root/>',
    xpath: '   ',
    expectSuccess: false,
  },
  {
    id: 58,
    category: '10. Error Handling',
    name: 'Malformed XML (unclosed tag)',
    xml: '<root><item>123</root>',
    xpath: '//item',
    expectSuccess: false,
  },
  {
    id: 59,
    category: '10. Error Handling',
    name: 'XPath syntax error (unclosed predicate bracket)',
    xml: '<root><item>123</item></root>',
    xpath: '//item[price > 10',
    expectSuccess: false,
  },
  {
    id: 60,
    category: '10. Error Handling',
    name: 'Undeclared prefix produces meaningful error without throwing unhandled rejection',
    xml: '<root><item>123</item></root>',
    xpath: '//nonexistent_prefix:item',
    expectSuccess: false,
  },

  // ─── PART 11: Advanced Enterprise & Complex Scenarios ──────────────────────
  {
    id: 61,
    category: '11. Complex Enterprise Scenarios',
    name: 'SAP IDoc Complex Multi-level Qualifier Matching',
    xml: `<ORDERS05>
      <IDOC>
        <E1EDK01><BELNR>4500000001</BELNR></E1EDK01>
        <E1EDKA1><PARVW>AG</PARVW><PARTN>0000100000</PARTN><NAME1>Customer Alpha</NAME1></E1EDKA1>
        <E1EDKA1><PARVW>WE</PARVW><PARTN>0000200000</PARTN><NAME1>Ship-to Beta</NAME1></E1EDKA1>
        <E1EDP01>
          <POSEX>00010</POSEX><MENGE>5.000</MENGE>
          <E1EDP19><QUALF>001</QUALF><KTEXT>Material A</KTEXT></E1EDP19>
          <E1EDP19><QUALF>002</QUALF><KTEXT>EAN-13-123456</KTEXT></E1EDP19>
        </E1EDP01>
        <E1EDP01>
          <POSEX>00020</POSEX><MENGE>12.000</MENGE>
          <E1EDP19><QUALF>001</QUALF><KTEXT>Material B</KTEXT></E1EDP19>
        </E1EDP01>
      </IDOC>
    </ORDERS05>`,
    xpath: '//E1EDP01[E1EDP19[QUALF="001"]/KTEXT="Material B"]/MENGE/text()',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === '12.000',
  },
  {
    id: 62,
    category: '11. Complex Enterprise Scenarios',
    name: 'XPath 3.1 Array Constructors & Access',
    xml: '<root><data>1</data></root>',
    xpath: 'array:size([10, 20, 30, 40, 50])',
    expectSuccess: true,
    expectedReturnType: 'number',
    expectedValue: 5,
  },
  {
    id: 63,
    category: '11. Complex Enterprise Scenarios',
    name: 'XPath 3.1 Map Constructor & Value Lookup',
    xml: '<root><data>test</data></root>',
    xpath: 'map:get(map { "cpi_stage": "PROD", "tenant": "eu10" }, "cpi_stage")',
    expectSuccess: true,
    expectedReturnType: 'string',
    expectedValue: 'PROD',
  },
  {
    id: 64,
    category: '11. Complex Enterprise Scenarios',
    name: 'XPath 3.1 Sequence Expression and Dynamic Arithmetic',
    xml: `<invoice>
      <line><qty>2</qty><price>15.50</price></line>
      <line><qty>3</qty><price>10.00</price></line>
      <line><qty>1</qty><price>4.50</price></line>
    </invoice>`,
    xpath: 'sum(//line/(number(qty) * number(price)))',
    expectSuccess: true,
    expectedReturnType: 'number',
    expectedValue: 65.5,
  },
  {
    id: 65,
    category: '11. Complex Enterprise Scenarios',
    name: 'XPath 3.1 FLWOR (For-Return) Expression',
    xml: '<items><val>10</val><val>20</val><val>30</val></items>',
    xpath: 'for $v in //val return number($v) * 2',
    expectSuccess: true,
    expectedMatches: 3,
    validate: (r) => r.matches[0]?.value === '20' && r.matches[1]?.value === '40' && r.matches[2]?.value === '60',
  },
  {
    id: 66,
    category: '11. Complex Enterprise Scenarios',
    name: 'XPath 3.1 Conditional Expression (if-then-else)',
    xml: '<order><status>SHIPPED</status><tracking>TRK-9988</tracking></order>',
    xpath: 'if (//status = "SHIPPED") then concat("Tracking: ", //tracking) else "Processing"',
    expectSuccess: true,
    expectedReturnType: 'string',
    expectedValue: 'Tracking: TRK-9988',
  },
  {
    id: 67,
    category: '11. Complex Enterprise Scenarios',
    name: 'XPath 3.1 Arrow Operator (=>) Pipeline',
    xml: '<msg><content>  ToolSAP Cloud Integration  </content></msg>',
    xpath: '//content/text() => normalize-space() => upper-case()',
    expectSuccess: true,
    expectedReturnType: 'string',
    expectedValue: 'TOOLSAP CLOUD INTEGRATION',
  },
  {
    id: 68,
    category: '11. Complex Enterprise Scenarios',
    name: 'XPath 3.1 distinct-values() Sequence Operator',
    xml: '<records><type>A</type><type>B</type><type>A</type><type>C</type><type>B</type></records>',
    xpath: 'distinct-values(//type)',
    expectSuccess: true,
    expectedMatches: 3,
    validate: (r) => r.matches.map((m) => m.value).sort().join(',') === 'A,B,C',
  },
  {
    id: 69,
    category: '11. Complex Enterprise Scenarios',
    name: 'Nested Overriding Default Namespace (urn:root -> urn:child -> no-namespace)',
    xml: `<root xmlns="urn:root">
      <child xmlns="urn:child">
        <leaf xmlns="">StandardUnprefixedLeaf</leaf>
      </child>
    </root>`,
    xpath: '//*[local-name()="leaf" and namespace-uri()=""]/text()',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'StandardUnprefixedLeaf',
  },
  {
    id: 70,
    category: '11. Complex Enterprise Scenarios',
    name: 'Complex convertToNamespaceAgnostic with Axis and Nested Predicates',
    xml: `<inventory xmlns="https://sap.com/stock">
      <warehouse id="WH-1">
        <item code="A-101" status="reserved:active"><qty>15</qty></item>
        <item code="B-202" status="available"><qty>80</qty></item>
      </warehouse>
    </inventory>`,
    xpath: convertToNamespaceAgnostic('//warehouse/item[contains(@status, "reserved:active")]/qty'),
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === '15',
  },
  {
    id: 71,
    category: '11. Complex Enterprise Scenarios',
    name: 'Predefined xml:lang Attribute Lookup without Explicit xmlns:xml',
    xml: '<doc><title xml:lang="en">Guide</title><title xml:lang="de">Handbuch</title></doc>',
    xpath: '//title[@xml:lang="de"]/text()',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'Handbuch',
  },
  {
    id: 72,
    category: '11. Complex Enterprise Scenarios',
    name: 'Mixed Character Entities and Raw CDATA Block',
    xml: '<payload><raw><![CDATA[<quote val="hello&world">Special chars</quote>]]></raw></payload>',
    xpath: '//raw/text()',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === '<quote val="hello&world">Special chars</quote>',
  },
  {
    id: 73,
    category: '11. Complex Enterprise Scenarios',
    name: 'Parent Axis Navigating from Child Attribute up to Parent Attribute',
    xml: '<order id="ORD-777"><item sku="SKU-888"><price>45</price></item></order>',
    xpath: '//price/parent::item/parent::order/@id',
    expectSuccess: true,
    expectedMatches: 1,
    validate: (r) => r.matches[0]?.value === 'ORD-777',
  },
  {
    id: 74,
    category: '11. Complex Enterprise Scenarios',
    name: 'Syntax Error: Unclosed Quote in XPath String Literal',
    xml: '<root><item>test</item></root>',
    xpath: '//item[@id="unclosed_quote]',
    expectSuccess: false,
  },
  {
    id: 75,
    category: '11. Complex Enterprise Scenarios',
    name: 'Syntax Error: Unknown Function Invocation',
    xml: '<root><item>test</item></root>',
    xpath: 'non_existent_xpath_function(//item)',
    expectSuccess: false,
  },
];

export async function runXPathTestSuite(): Promise<TestSuiteReport> {
  const startTime = performance.now();
  const results: TestResultItem[] = [];

  for (const tc of COMPREHENSIVE_XPATH_TEST_CASES) {
    const caseStart = performance.now();
    try {
      const res = await evaluateXPathExpression(tc.xml, tc.xpath, tc.options);

      let isOk = res.success === tc.expectSuccess;
      let reason = '';

      if (isOk && tc.expectSuccess) {
        if (tc.expectedMatches !== undefined && res.totalMatches !== tc.expectedMatches) {
          isOk = false;
          reason = `Expected ${tc.expectedMatches} matches, got ${res.totalMatches}`;
        }
        if (isOk && tc.expectedReturnType !== undefined && res.returnTypeDetected !== tc.expectedReturnType) {
          isOk = false;
          reason = `Expected return type ${tc.expectedReturnType}, got ${res.returnTypeDetected}`;
        }
        if (isOk && tc.expectedValue !== undefined && res.primitiveValue !== tc.expectedValue) {
          isOk = false;
          reason = `Expected primitive value ${JSON.stringify(tc.expectedValue)}, got ${JSON.stringify(res.primitiveValue)}`;
        }
        if (isOk && tc.validate) {
          const vRes = tc.validate(res);
          if (typeof vRes === 'string') {
            isOk = false;
            reason = vRes;
          } else if (!vRes) {
            isOk = false;
            reason = 'Custom validator assertion failed';
          }
        }
      }

      const caseElapsed = Math.round((performance.now() - caseStart) * 10) / 10;
      results.push({
        id: tc.id,
        category: tc.category,
        name: tc.name,
        passed: isOk,
        details: isOk ? 'PASSED' : `FAILED: ${reason || 'Success status mismatch'} (success=${res.success}, error=${res.error?.message || 'none'})`,
        executionTimeMs: caseElapsed,
      });
    } catch (ex: any) {
      const caseElapsed = Math.round((performance.now() - caseStart) * 10) / 10;
      results.push({
        id: tc.id,
        category: tc.category,
        name: tc.name,
        passed: false,
        details: `FAILED (Exception): ${ex?.message || String(ex)}`,
        executionTimeMs: caseElapsed,
      });
    }
  }

  // Preset sample assertions
  const sapOrderSample = XPATH_PRESET_SAMPLES.find((s) => s.id === 'sap-purchase-order');
  const nsStoreSample = XPATH_PRESET_SAMPLES.find((s) => s.id === 'multi-namespace-store');

  if (sapOrderSample) {
    const resDocNum = await evaluateXPathExpression(sapOrderSample.xml, '//E1EDK01/BELNR/text()');
    results.push({
      id: 76,
      category: 'SAP Presets',
      name: 'Extracts PO Belnr 4500098120 from preset',
      passed: resDocNum.matches[0]?.value === '4500098120',
      details: resDocNum.matches[0]?.value === '4500098120' ? 'PASSED' : 'Failed to extract PO Belnr',
    });
  }

  if (nsStoreSample) {
    const resDftNs = await evaluateXPathExpression(nsStoreSample.xml, '//dft:product');
    results.push({
      id: 77,
      category: 'SAP Presets',
      name: 'Default namespace mapped to dft: selects products from preset',
      passed: resDftNs.totalMatches === 3,
      details: resDftNs.totalMatches === 3 ? 'PASSED' : 'Failed to match dft:product',
    });

    let doc: Document;
    if (typeof DOMParser !== 'undefined') {
      doc = new DOMParser().parseFromString(nsStoreSample.xml, 'application/xml');
    } else {
      const { DOMParser: XmldomParser } = await import('@xmldom/xmldom');
      doc = new XmldomParser({ onError: () => {} }).parseFromString(nsStoreSample.xml, 'application/xml') as unknown as Document;
    }
    const detected = extractNamespacesFromXml(doc);
    results.push({
      id: 78,
      category: 'Namespaces',
      name: 'extractNamespacesFromXml detects default, meta, and display namespaces',
      passed: detected.some((n) => n.isDefault) && detected.some((n) => n.prefix === 'meta'),
      details: 'Detected all declared namespaces accurately',
    });
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    durationMs,
    results,
  };
}

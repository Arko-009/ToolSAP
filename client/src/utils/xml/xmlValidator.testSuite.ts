/**
 * Comprehensive Automated Test Suite for ToolSAP XML + XSD Validation & Auto-Fix Engine
 * Covers all 27 error families and verification requirements from Master Engineering Task.
 */

import {
  validateXmlStructure,
  validateAgainstXsd,
  autoFixXml,
  autoFixXmlWithXsd,
} from './xmlValidator';

export interface TestResult {
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
  results: TestResult[];
}

export function runXmlValidatorTestSuite(): TestSuiteReport {
  const startTime = performance.now();
  const results: TestResult[] = [];

  function assert(category: string, name: string, condition: boolean, details = '') {
    results.push({
      category,
      name,
      passed: condition,
      details: condition ? 'PASSED' : `FAILED: ${details}`,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Valid XML with Valid XSD
  // ───────────────────────────────────────────────────────────────────────────
  const validXml1 = `<Order xmlns="https://example.com/orders">
    <ID>1001</ID>
    <Customer>Acme Corp</Customer>
    <Amount>250.50</Amount>
  </Order>`;
  const validXsd1 = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="https://example.com/orders" elementFormDefault="qualified">
    <xs:element name="Order">
      <xs:complexType>
        <xs:sequence>
          <xs:element name="ID" type="xs:integer" />
          <xs:element name="Customer" type="xs:string" />
          <xs:element name="Amount" type="xs:decimal" />
        </xs:sequence>
      </xs:complexType>
    </xs:element>
  </xs:schema>`;
  const res1 = validateAgainstXsd(validXml1, validXsd1);
  assert('1. Valid XML + XSD', 'Valid document passes without errors', res1.isValid && res1.errors.length === 0, JSON.stringify(res1.errors));

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Valid XML Without XSD (Syntax-Only Mode)
  // ───────────────────────────────────────────────────────────────────────────
  const syntaxRes = validateXmlStructure(validXml1);
  assert('2. Syntax Only Mode', 'Well-formed document is valid in syntax mode', syntaxRes.isValid && syntaxRes.errors.length === 0);

  // ───────────────────────────────────────────────────────────────────────────
  // 3. XML with Malformed Tags and Attributes
  // ───────────────────────────────────────────────────────────────────────────
  const malformedTagXml = `<root><child>text</chld></root>`;
  const malformedTagRes = validateXmlStructure(malformedTagXml);
  assert('3. Malformed Tags', 'Mismatched closing tag detected', !malformedTagRes.isValid && malformedTagRes.errors.some(e => e.message.toLowerCase().includes('mismatch') || e.message.includes('child')));

  const unquotedAttrXml = `<root item=123></root>`;
  const unquotedAttrRes = validateXmlStructure(unquotedAttrXml);
  assert('3. Malformed Attributes', 'Unquoted attribute value detected', !unquotedAttrRes.isValid);

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Invalid Character References and Unescaped Ampersands
  // ───────────────────────────────────────────────────────────────────────────
  const unescapedAmpXml = `<root><desc>Johnson & Johnson</desc></root>`;
  const unescapedAmpRes = validateXmlStructure(unescapedAmpXml);
  assert('4. Unescaped Ampersands', 'Bare ampersand detected', !unescapedAmpRes.isValid && unescapedAmpRes.errors.some(e => e.message.includes('&') || e.category === 'unescaped-character'));

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Comments, CDATA, Processing Instructions
  // ───────────────────────────────────────────────────────────────────────────
  const cdataXml = `<root><![CDATA[Some <raw> & unescaped & content]]></root>`;
  const cdataRes = validateXmlStructure(cdataXml);
  assert('5. CDATA Handling', 'Raw characters inside CDATA are valid', cdataRes.isValid);

  const doubleHyphenCommentXml = `<root><!-- Invalid -- comment --></root>`;
  const commentFix = autoFixXml(doubleHyphenCommentXml);
  assert('5. Double Hyphen Comment', 'Double hyphens inside comments repaired', !commentFix.fixedXml.includes('-- comment --'));

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Namespace Mismatches
  // ───────────────────────────────────────────────────────────────────────────
  const nsMismatchXml = `<Order xmlns="https://wrong-namespace.org">
    <ID>1001</ID>
  </Order>`;
  const nsMismatchXsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="https://correct-namespace.org" elementFormDefault="qualified">
    <xs:element name="Order">
      <xs:complexType>
        <xs:sequence>
          <xs:element name="ID" type="xs:integer" />
        </xs:sequence>
      </xs:complexType>
    </xs:element>
  </xs:schema>`;
  const nsRes = validateAgainstXsd(nsMismatchXml, nsMismatchXsd);
  assert('6. Namespace Mismatch', 'Namespace difference from targetNamespace flagged', !nsRes.isValid && nsRes.errors.some(e => e.code === 'ERR_XSD_NAMESPACE_MISMATCH'));

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Invalid XSD Syntax (Compilation Error)
  // ───────────────────────────────────────────────────────────────────────────
  const invalidXsdSyntax = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <xs:element name="Order"
  </xs:schema>`;
  const xsdSyntaxRes = validateAgainstXsd(validXml1, invalidXsdSyntax);
  assert('7. XSD Compilation Error', 'Malformed XSD schema produces compilation error', !xsdSyntaxRes.isValid && xsdSyntaxRes.errors.some(e => e.code === 'ERR_XSD_COMPILATION'));

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Undefined Types / Root Element Mismatch
  // ───────────────────────────────────────────────────────────────────────────
  const wrongRootXml = `<WrongRoot><ID>101</ID></WrongRoot>`;
  const wrongRootRes = validateAgainstXsd(wrongRootXml, validXsd1);
  assert('8. Root Element Mismatch', 'Root element not declared in schema caught', !wrongRootRes.isValid && wrongRootRes.errors.some(e => e.code === 'ERR_XSD_ROOT_MISMATCH'));

  // ───────────────────────────────────────────────────────────────────────────
  // 9. Primitive Data Type Mismatches
  // ───────────────────────────────────────────────────────────────────────────
  const badIntXml = `<Order xmlns="https://example.com/orders">
    <ID>NOT_AN_INTEGER</ID>
    <Customer>Acme Corp</Customer>
    <Amount>250.50</Amount>
  </Order>`;
  const badIntRes = validateAgainstXsd(badIntXml, validXsd1);
  assert('9. Primitive Type Mismatch', 'Non-integer ID caught as type mismatch', !badIntRes.isValid && badIntRes.errors.some(e => e.code === 'ERR_XSD_TYPE_MISMATCH'));

  // ───────────────────────────────────────────────────────────────────────────
  // 10. Numeric Range & Enumeration Facet Violations
  // ───────────────────────────────────────────────────────────────────────────
  const facetXsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <xs:element name="Product">
      <xs:complexType>
        <xs:sequence>
          <xs:element name="Rating">
            <xs:simpleType>
              <xs:restriction base="xs:integer">
                <xs:minInclusive value="1" />
                <xs:maxInclusive value="5" />
              </xs:restriction>
            </xs:simpleType>
          </xs:element>
          <xs:element name="Status">
            <xs:simpleType>
              <xs:restriction base="xs:string">
                <xs:enumeration value="ACTIVE" />
                <xs:enumeration value="INACTIVE" />
              </xs:restriction>
            </xs:simpleType>
          </xs:element>
        </xs:sequence>
      </xs:complexType>
    </xs:element>
  </xs:schema>`;
  const facetFailXml = `<Product><Rating>10</Rating><Status>PENDING</Status></Product>`;
  const facetRes = validateAgainstXsd(facetFailXml, facetXsd);
  assert('10. Facet Violations', 'Out-of-range number and invalid enumeration caught', !facetRes.isValid && facetRes.errors.some(e => e.code === 'ERR_XSD_FACET_VIOLATION'));

  // ───────────────────────────────────────────────────────────────────────────
  // 11. Missing Required Elements and Attributes
  // ───────────────────────────────────────────────────────────────────────────
  const attrXsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <xs:element name="Item">
      <xs:complexType>
        <xs:sequence>
          <xs:element name="Name" type="xs:string" />
          <xs:element name="Price" type="xs:decimal" />
        </xs:sequence>
        <xs:attribute name="sku" type="xs:string" use="required" />
      </xs:complexType>
    </xs:element>
  </xs:schema>`;
  const missingAttrXml = `<Item><Name>Pen</Name><Price>2.50</Price></Item>`;
  const attrRes = validateAgainstXsd(missingAttrXml, attrXsd);
  assert('11. Required Attributes', 'Missing use="required" attribute caught', !attrRes.isValid && attrRes.errors.some(e => e.code === 'ERR_XSD_ATTR_REQUIRED'));

  const missingElemXml = `<Item sku="SKU101"><Price>2.50</Price></Item>`;
  const elemRes = validateAgainstXsd(missingElemXml, attrXsd);
  assert('11. Required Elements', 'Missing required child element <Name> caught', !elemRes.isValid && elemRes.errors.some(e => e.code === 'ERR_XSD_ELEMENT_MISSING'));

  // ───────────────────────────────────────────────────────────────────────────
  // 12. Sequence Ordering Violation
  // ───────────────────────────────────────────────────────────────────────────
  const outOfOrderXml = `<Item sku="SKU101"><Price>2.50</Price><Name>Pen</Name></Item>`;
  const seqRes = validateAgainstXsd(outOfOrderXml, attrXsd);
  assert('12. Sequence Ordering', 'Out of sequence order child generates advisory warning', seqRes.warnings.some(w => w.includes('out of sequence order')));

  // ───────────────────────────────────────────────────────────────────────────
  // 13. Occurrence Restrictions (minOccurs / maxOccurs)
  // ───────────────────────────────────────────────────────────────────────────
  const occXsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <xs:element name="Basket">
      <xs:complexType>
        <xs:sequence>
          <xs:element name="Item" type="xs:string" minOccurs="2" maxOccurs="3" />
        </xs:sequence>
      </xs:complexType>
    </xs:element>
  </xs:schema>`;
  const underOccXml = `<Basket><Item>Apple</Item></Basket>`;
  const underRes = validateAgainstXsd(underOccXml, occXsd);
  assert('13. minOccurs Restriction', 'Fewer occurrences than minOccurs="2" caught', !underRes.isValid && underRes.errors.some(e => e.code === 'ERR_XSD_MIN_OCCURS'));

  const overOccXml = `<Basket><Item>A</Item><Item>B</Item><Item>C</Item><Item>D</Item></Basket>`;
  const overRes = validateAgainstXsd(overOccXml, occXsd);
  assert('13. maxOccurs Restriction', 'More occurrences than maxOccurs="3" caught', !overRes.isValid && overRes.errors.some(e => e.code === 'ERR_XSD_MAX_OCCURS'));

  // ───────────────────────────────────────────────────────────────────────────
  // 14. xs:choice Mutex Violation
  // ───────────────────────────────────────────────────────────────────────────
  const choiceXsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <xs:element name="Payment">
      <xs:complexType>
        <xs:choice>
          <xs:element name="CreditCard" type="xs:string" />
          <xs:element name="BankTransfer" type="xs:string" />
        </xs:choice>
      </xs:complexType>
    </xs:element>
  </xs:schema>`;
  const invalidChoiceXml = `<Payment><CreditCard>1234</CreditCard><BankTransfer>DE89</BankTransfer></Payment>`;
  const choiceRes = validateAgainstXsd(invalidChoiceXml, choiceXsd);
  assert('14. xs:choice Validation', 'Mutually exclusive choice violation caught', !choiceRes.isValid && choiceRes.errors.some(e => e.code === 'ERR_XSD_CHOICE_MUTEX'));

  // ───────────────────────────────────────────────────────────────────────────
  // 15. Identity Constraints (xs:unique, xs:key, xs:keyref)
  // ───────────────────────────────────────────────────────────────────────────
  const identityXsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <xs:element name="Company">
      <xs:complexType>
        <xs:sequence>
          <xs:element name="Employee" maxOccurs="unbounded">
            <xs:complexType>
              <xs:sequence>
                <xs:element name="Name" type="xs:string" />
              </xs:sequence>
              <xs:attribute name="id" type="xs:string" use="required" />
            </xs:complexType>
          </xs:element>
        </xs:sequence>
      </xs:complexType>
      <xs:unique name="UniqueEmpID">
        <xs:selector xpath="./Employee" />
        <xs:field xpath="@id" />
      </xs:unique>
    </xs:element>
  </xs:schema>`;
  const dupIdXml = `<Company>
    <Employee id="E101"><Name>Alice</Name></Employee>
    <Employee id="E101"><Name>Bob</Name></Employee>
  </Company>`;
  const identityRes = validateAgainstXsd(dupIdXml, identityXsd);
  assert('15. Identity Constraints', 'Duplicate identity constraint key caught', !identityRes.isValid && identityRes.errors.some(e => e.code === 'ERR_XSD_UNIQUE_DUPLICATE'));

  // ───────────────────────────────────────────────────────────────────────────
  // 16. Date, Decimal, Boolean Type Validation
  // ───────────────────────────────────────────────────────────────────────────
  const typesXsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <xs:element name="Record">
      <xs:complexType>
        <xs:sequence>
          <xs:element name="CreatedDate" type="xs:date" />
          <xs:element name="IsActive" type="xs:boolean" />
        </xs:sequence>
      </xs:complexType>
    </xs:element>
  </xs:schema>`;
  const invalidDateXml = `<Record><CreatedDate>10/12/2026</CreatedDate><IsActive>maybe</IsActive></Record>`;
  const typesRes = validateAgainstXsd(invalidDateXml, typesXsd);
  assert('16. Date & Boolean Formats', 'Invalid date format (non-ISO) and boolean caught', !typesRes.isValid && typesRes.errors.length >= 2);

  // ───────────────────────────────────────────────────────────────────────────
  // 17. Safe Auto-Repair Rules
  // ───────────────────────────────────────────────────────────────────────────
  const autoFixTestXml = `
  <inventory>
    <item id=I101 category="kitchen">
      <name>Tom & Jerry Mug</Name>
      <price currency="INR">199</price>
    </item>
  </inventory>`;
  const autoFixRes = autoFixXml(autoFixTestXml);
  assert('17. Auto-Repair', 'Auto-fix repaired unquoted attribute and unescaped ampersand', autoFixRes.fixes.length > 0 && autoFixRes.fixedXml.includes('id="I101"') && autoFixRes.fixedXml.includes('&amp;'));

  // Verify repaired XML is well-formed
  const revalidatedAutoFix = validateXmlStructure(autoFixRes.fixedXml);
  assert('17. Auto-Repair Verification', 'Repaired XML passes well-formedness verification', revalidatedAutoFix.isValid);

  // ───────────────────────────────────────────────────────────────────────────
  // 18. Refusal to Change Already-Valid Document (Preservation Rule)
  // ───────────────────────────────────────────────────────────────────────────
  const alreadyValidXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <data id="123">Clean Content</data>
</root>`;
  const noChangeRes = autoFixXml(alreadyValidXml);
  assert('18. Document Preservation', 'Auto-fix refuses to change already-valid document', noChangeRes.fixes.length === 0 && noChangeRes.report.originalValid);

  // ───────────────────────────────────────────────────────────────────────────
  // 19. Empty Input and Edge Cases
  // ───────────────────────────────────────────────────────────────────────────
  const emptyRes = validateXmlStructure('');
  assert('19. Empty Input', 'Empty string properly flagged as invalid with no-root', !emptyRes.isValid && emptyRes.errors.some(e => e.category === 'no-root'));

  const emptyXsdRes = validateAgainstXsd(validXml1, '');
  assert('19. Empty XSD', 'Empty schema properly flagged', !emptyXsdRes.isValid && emptyXsdRes.errors.some(e => e.message.includes('empty')));

  // ───────────────────────────────────────────────────────────────────────────
  // 20. Double Prolog / Text Before XML Declaration
  // ───────────────────────────────────────────────────────────────────────────
  const textBeforeDecl = `Some leading junk text
<?xml version="1.0" encoding="UTF-8"?>
<root><child/></root>`;
  const leadingFixRes = autoFixXml(textBeforeDecl);
  assert('20. Text Before Prolog', 'Leading text before XML declaration is stripped', leadingFixRes.fixedXml.trim().startsWith('<?xml'));

  // ───────────────────────────────────────────────────────────────────────────
  // 21. autoFixXmlWithXsd: Target Namespace Auto-Configuration
  // ───────────────────────────────────────────────────────────────────────────
  const missingNsXml = `<Order>
    <ID>1001</ID>
    <Customer>Acme Corp</Customer>
    <Amount>250.50</Amount>
  </Order>`;
  const autoFixNsRes = autoFixXmlWithXsd(missingNsXml, validXsd1);
  assert(
    '21. XSD Auto-Fix: Namespace',
    'Adds xmlns matching XSD targetNamespace to root element',
    autoFixNsRes.fixedXml.includes('xmlns="https://example.com/orders"') && autoFixNsRes.report.finalValid
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 22. autoFixXmlWithXsd: Sequence Element Reordering
  // ───────────────────────────────────────────────────────────────────────────
  const outOfOrderXmlForFix = `<Order xmlns="https://example.com/orders">
    <Amount>250.50</Amount>
    <Customer>Acme Corp</Customer>
    <ID>1001</ID>
  </Order>`;
  const autoFixSeqRes = autoFixXmlWithXsd(outOfOrderXmlForFix, validXsd1);
  assert(
    '22. XSD Auto-Fix: Sequence Reordering',
    'Reorders child elements into declared xs:sequence order',
    autoFixSeqRes.report.fixes.some((f) => f.code === 'FIX_XSD_SEQUENCE_ORDER') && autoFixSeqRes.report.finalValid
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 23. autoFixXmlWithXsd: Default Attribute Injection
  // ───────────────────────────────────────────────────────────────────────────
  const defaultAttrXsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <xs:element name="Order">
      <xs:complexType>
        <xs:sequence>
          <xs:element name="Item" type="xs:string" />
        </xs:sequence>
        <xs:attribute name="status" type="xs:string" use="required" default="pending" />
      </xs:complexType>
    </xs:element>
  </xs:schema>`;
  const noAttrXml = `<Order><Item>Widget</Item></Order>`;
  const autoFixAttrRes = autoFixXmlWithXsd(noAttrXml, defaultAttrXsd);
  assert(
    '23. XSD Auto-Fix: Default Attributes',
    'Injects missing attribute with schema default value',
    autoFixAttrRes.fixedXml.includes('status="pending"')
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 24. autoFixXmlWithXsd: Document Preservation for Already-Valid Document
  // ───────────────────────────────────────────────────────────────────────────
  const validXsdDoc = `<Order xmlns="https://example.com/orders">
    <ID>1001</ID>
    <Customer>Acme Corp</Customer>
    <Amount>250.50</Amount>
  </Order>`;
  const preserveRes = autoFixXmlWithXsd(validXsdDoc, validXsd1);
  assert(
    '24. XSD Auto-Fix: Preservation Rule',
    'Refuses to alter an already-valid document against XSD',
    preserveRes.fixes.length === 0 && preserveRes.report.originalValid && preserveRes.report.finalValid
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 25. autoFixXmlWithXsd: Confirmation-Required for Ambiguous Violations
  // ───────────────────────────────────────────────────────────────────────────
  const badFacetForFix = `<Product><Rating>99</Rating><Status>UNKNOWN_STATUS</Status></Product>`;
  const confirmRes = autoFixXmlWithXsd(badFacetForFix, facetXsd);
  assert(
    '25. XSD Auto-Fix: Confirmation Required',
    'Out-of-range value is not silently invented or guessed, flagged as confirmation-required',
    confirmRes.report.unresolvedIssues.some((i) => i.classification === 'confirmation-required') &&
      confirmRes.fixedXml.includes('99')
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 26. autoFixXmlWithXsd: Revalidation Against XSD
  // ───────────────────────────────────────────────────────────────────────────
  const revalRes = validateAgainstXsd(autoFixNsRes.fixedXml, validXsd1);
  assert(
    '26. XSD Auto-Fix: Revalidation',
    'Repaired XML genuinely passes revalidation against XSD',
    revalRes.isValid && revalRes.errors.length === 0
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

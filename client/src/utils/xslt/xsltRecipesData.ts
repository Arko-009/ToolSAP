/**
 * Pre-Built Enterprise XSLT Templates & Recipes for SAP Cloud Integration (CPI)
 * Tested, production-ready stylesheets solving common enterprise transformation challenges.
 */

export interface XsltRecipe {
  id: string;
  name: string;
  category: 'namespaces' | 'identity-filtering' | 'restructuring' | 'soap-standards' | 'conversion';
  description: string;
  xsltVersion: '1.0' | '2.0' | '3.0';
  cpiTip: string;
  sampleXml: string;
  defaultXslt: string;
}

export const XSLT_RECIPE_CATEGORIES = [
  { id: 'all', label: 'All Recipes' },
  { id: 'namespaces', label: 'Namespaces & Prefixes' },
  { id: 'identity-filtering', label: 'Identity & Filtering' },
  { id: 'restructuring', label: 'Restructuring & Grouping' },
  { id: 'soap-standards', label: 'SOAP & Standards' },
  { id: 'conversion', label: 'HTML, CSV & Conversions' },
] as const;

export const XSLT_RECIPES: XsltRecipe[] = [
  // ─── 1. Strip All Namespaces ────────────────────────────────────────────────
  {
    id: 'strip-namespaces',
    name: 'Strip / Remove All Namespaces',
    category: 'namespaces',
    description: 'Removes all XML namespaces, prefixes, and xmlns declarations, yielding clean, unprefixed XML.',
    xsltVersion: '1.0',
    cpiTip: 'The #1 most used XSLT in SAP CPI. Placed right after SOAP/Web Service calls so subsequent Content Modifiers and Routers can query paths without namespace prefixes.',
    sampleXml: `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ord="urn:sap:orders:v1">
  <soap:Header>
    <ord:TraceId>TR-908123</ord:TraceId>
  </soap:Header>
  <soap:Body>
    <ord:PurchaseOrder id="PO-2026-001">
      <ord:Supplier>Bosch Rexroth</ord:Supplier>
      <ord:Total currency="EUR">14200.00</ord:Total>
    </ord:PurchaseOrder>
  </soap:Body>
</soap:Envelope>`,
    defaultXslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes" encoding="UTF-8" omit-xml-declaration="no"/>

  <!-- Match any element and recreate it in no namespace -->
  <xsl:template match="*">
    <xsl:element name="{local-name()}">
      <xsl:apply-templates select="@*|node()"/>
    </xsl:element>
  </xsl:template>

  <!-- Copy attributes without namespaces -->
  <xsl:template match="@*">
    <xsl:attribute name="{local-name()}">
      <xsl:value-of select="."/>
    </xsl:attribute>
  </xsl:template>

  <!-- Ignore namespace nodes and copy text/comments -->
  <xsl:template match="text()|comment()|processing-instruction()">
    <xsl:copy/>
  </xsl:template>
</xsl:stylesheet>`,
  },

  // ─── 2. Identity Transform ──────────────────────────────────────────────────
  {
    id: 'identity-transform',
    name: 'Identity Transform (Base Copy)',
    category: 'identity-filtering',
    description: 'The foundation of XSLT: copies every element, attribute, text node, and comment unchanged.',
    xsltVersion: '1.0',
    cpiTip: 'Use as the starting template when you need to pass 95% of an XML message through unchanged while modifying just 1 or 2 specific elements.',
    sampleXml: `<Order id="4500098120">
  <Header>
    <Status>Pending</Status>
    <Date>2026-10-19</Date>
  </Header>
  <Items>
    <Item id="1" sku="SKU-100"><Price>25.00</Price></Item>
  </Items>
</Order>`,
    defaultXslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <!-- Identity Template: copy every node and attribute as-is -->
  <xsl:template match="@*|node()">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>

  <!-- Add your specific override templates below -->
</xsl:stylesheet>`,
  },

  // ─── 3. Rename Elements / Attributes ────────────────────────────────────────
  {
    id: 'rename-elements',
    name: 'Rename Specific Elements or Attributes',
    category: 'identity-filtering',
    description: 'Copies the document verbatim while renaming targeted elements or attributes.',
    xsltVersion: '1.0',
    cpiTip: 'Ideal when transforming between legacy ECC and modern S/4HANA naming conventions (e.g. BELNR -> OrderNumber).',
    sampleXml: `<PurchaseOrder>
  <BELNR>4500098120</BELNR>
  <WAERK>EUR</WAERK>
  <NETWR>1250.00</NETWR>
</PurchaseOrder>`,
    defaultXslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <!-- 1. Identity template copies everything -->
  <xsl:template match="@*|node()">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>

  <!-- 2. Override: Rename BELNR to OrderNumber -->
  <xsl:template match="BELNR">
    <OrderNumber>
      <xsl:apply-templates select="@*|node()"/>
    </OrderNumber>
  </xsl:template>

  <!-- 3. Override: Rename WAERK to CurrencyCode -->
  <xsl:template match="WAERK">
    <CurrencyCode>
      <xsl:apply-templates select="@*|node()"/>
    </CurrencyCode>
  </xsl:template>

  <!-- 4. Override: Rename NETWR to TotalAmount -->
  <xsl:template match="NETWR">
    <TotalAmount>
      <xsl:apply-templates select="@*|node()"/>
    </TotalAmount>
  </xsl:template>
</xsl:stylesheet>`,
  },

  // ─── 4. Filter / Delete Nodes by Condition ──────────────────────────────────
  {
    id: 'filter-delete-nodes',
    name: 'Filter / Remove Nodes by Condition',
    category: 'identity-filtering',
    description: 'Eliminates unwanted elements, sensitive data, or cancelled records matching an XPath condition.',
    xsltVersion: '1.0',
    cpiTip: 'Used in SAP CPI Data Masking / GDPR compliance to remove CreditCard, PII, or internal technical routing headers before forwarding to external partners.',
    sampleXml: `<Order>
  <Id>ORD-991</Id>
  <SensitiveData>
    <CreditCard>4111-XXXX-XXXX-1111</CreditCard>
    <CVV>123</CVV>
  </SensitiveData>
  <LineItems>
    <Item status="active"><Name>Laptop</Name><Qty>1</Qty></Item>
    <Item status="cancelled"><Name>Mouse</Name><Qty>2</Qty></Item>
    <Item status="active"><Name>Monitor</Name><Qty>2</Qty></Item>
  </LineItems>
</Order>`,
    defaultXslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <!-- Identity copy for all nodes -->
  <xsl:template match="@*|node()">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>

  <!-- Empty templates delete matched nodes from output -->
  <!-- 1. Remove entire SensitiveData block -->
  <xsl:template match="SensitiveData"/>

  <!-- 2. Remove cancelled line items -->
  <xsl:template match="Item[@status='cancelled']"/>
</xsl:stylesheet>`,
  },

  // ─── 5. Flatten Hierarchical XML ────────────────────────────────────────────
  {
    id: 'flatten-hierarchy',
    name: 'Flatten Hierarchical XML to Repeating Rows',
    category: 'restructuring',
    description: 'De-normalizes nested header-to-detail structures into flat, row-based records.',
    xsltVersion: '1.0',
    cpiTip: 'Essential when preparing nested SAP IDocs or Purchase Orders for database insertion (JDBC adapter), flat CSV export, or SFTP transmission.',
    sampleXml: `<Order id="ORD-1001" date="2026-10-19">
  <Customer>
    <CustId>C-882</CustId>
    <CustName>Siemens AG</CustName>
  </Customer>
  <Items>
    <Item pos="10"><Material>M-01</Material><Qty>5</Qty><Price>100</Price></Item>
    <Item pos="20"><Material>M-02</Material><Qty>2</Qty><Price>250</Price></Item>
  </Items>
</Order>`,
    defaultXslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <xsl:template match="/">
    <FlatRecords>
      <!-- Loop through detail items and repeat parent header data -->
      <xsl:for-each select="//Items/Item">
        <Record>
          <OrderId><xsl:value-of select="/Order/@id"/></OrderId>
          <OrderDate><xsl:value-of select="/Order/@date"/></OrderDate>
          <CustomerId><xsl:value-of select="/Order/Customer/CustId"/></CustomerId>
          <CustomerName><xsl:value-of select="/Order/Customer/CustName"/></CustomerName>
          <ItemPosition><xsl:value-of select="@pos"/></ItemPosition>
          <MaterialNumber><xsl:value-of select="Material"/></MaterialNumber>
          <Quantity><xsl:value-of select="Qty"/></Quantity>
          <UnitPrice><xsl:value-of select="Price"/></UnitPrice>
          <LineTotal><xsl:value-of select="number(Qty) * number(Price)"/></LineTotal>
        </Record>
      </xsl:for-each>
    </FlatRecords>
  </xsl:template>
</xsl:stylesheet>`,
  },

  // ─── 6. Wrap in SOAP Envelope ───────────────────────────────────────────────
  {
    id: 'wrap-soap-envelope',
    name: 'Wrap Payload in SOAP 1.1 / 1.2 Envelope',
    category: 'soap-standards',
    description: 'Wraps raw business XML into a standard W3C SOAP Envelope with optional WS-Addressing and Security headers.',
    xsltVersion: '1.0',
    cpiTip: 'Used in outbound integrations to legacy SAP ERP Web Services, SAP PI/PO SOAP receivers, or banking gateways.',
    sampleXml: `<OrderRequest>
  <OrderId>ORD-99120</OrderId>
  <Action>Submit</Action>
</OrderRequest>`,
    defaultXslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:wsa="http://www.w3.org/2005/08/addressing">
  
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <xsl:template match="/">
    <soapenv:Envelope>
      <soapenv:Header>
        <wsa:Action>http://sap.com/xi/WebService/SubmitOrder</wsa:Action>
        <wsa:MessageID>urn:uuid:generated-msg-id</wsa:MessageID>
      </soapenv:Header>
      <soapenv:Body>
        <xsl:copy-of select="*"/>
      </soapenv:Body>
    </soapenv:Envelope>
  </xsl:template>
</xsl:stylesheet>`,
  },

  // ─── 7. Unwrap SOAP Body ────────────────────────────────────────────────────
  {
    id: 'unwrap-soap-body',
    name: 'Unwrap / Extract SOAP Body Payload',
    category: 'soap-standards',
    description: 'Extracts the inner business document from a SOAP Envelope, discarding Envelope and Header wrappers.',
    xsltVersion: '1.0',
    cpiTip: 'Applied in SAP CPI inbound flows to strip SOAP transport envelope and pass purely the business payload to mapping and scripting steps.',
    sampleXml: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Header>
    <AuthenticationToken>SECRET_ABC_123</AuthenticationToken>
  </soapenv:Header>
  <soapenv:Body>
    <CustomerResponse id="CUST-4500">
      <Status>Active</Status>
      <CreditLimit>50000</CreditLimit>
    </CustomerResponse>
  </soapenv:Body>
</soapenv:Envelope>`,
    defaultXslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  
  <xsl:output method="xml" indent="yes" encoding="UTF-8" omit-xml-declaration="no"/>

  <!-- Select the immediate child element of soapenv:Body -->
  <xsl:template match="/">
    <xsl:copy-of select="//*[local-name()='Body']/*[1]"/>
  </xsl:template>
</xsl:stylesheet>`,
  },

  // ─── 8. Muenchian Grouping (XSLT 1.0) ───────────────────────────────────────
  {
    id: 'muenchian-grouping',
    name: 'Group Elements by Key (Muenchian Method)',
    category: 'restructuring',
    description: 'Standard high-performance grouping pattern in XSLT 1.0 using xsl:key and generate-id().',
    xsltVersion: '1.0',
    cpiTip: 'Used in SAP CPI to group flat ERP sales orders by Country or Vendor without needing XSLT 2.0 processor support.',
    sampleXml: `<Catalog>
  <Product category="Electronics"><Name>TV</Name><Price>800</Price></Product>
  <Product category="Furniture"><Name>Chair</Name><Price>120</Price></Product>
  <Product category="Electronics"><Name>Radio</Name><Price>60</Price></Product>
  <Product category="Furniture"><Name>Desk</Name><Price>300</Price></Product>
</Catalog>`,
    defaultXslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <!-- 1. Define key on Product by @category -->
  <xsl:key name="products-by-category" match="Product" use="@category"/>

  <xsl:template match="/Catalog">
    <GroupedCatalog>
      <!-- 2. Loop distinct categories using generate-id() idiom -->
      <xsl:for-each select="Product[generate-id() = generate-id(key('products-by-category', @category)[1])]">
        <Category name="{@category}">
          <!-- 3. Loop all products belonging to this category -->
          <xsl:for-each select="key('products-by-category', @category)">
            <Item>
              <Name><xsl:value-of select="Name"/></Name>
              <Price><xsl:value-of select="Price"/></Price>
            </Item>
          </xsl:for-each>
        </Category>
      </xsl:for-each>
    </GroupedCatalog>
  </xsl:template>
</xsl:stylesheet>`,
  },

  // ─── 9. Convert Attributes to Elements ──────────────────────────────────────
  {
    id: 'attrs-to-elements',
    name: 'Convert XML Attributes to Child Elements',
    category: 'conversion',
    description: 'Transforms inline XML attributes into structured child tags.',
    xsltVersion: '1.0',
    cpiTip: 'Required when integrating legacy partner payloads using heavy attribute syntax into modern REST/JSON microservices.',
    sampleXml: `<Order id="PO-991" status="confirmed" currency="USD">
  <Item sku="SKU-1" qty="2" unitPrice="49.99"/>
</Order>`,
    defaultXslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <xsl:template match="*">
    <xsl:element name="{name()}">
      <!-- Convert each attribute into a child element -->
      <xsl:for-each select="@*">
        <xsl:element name="{name()}">
          <xsl:value-of select="."/>
        </xsl:element>
      </xsl:for-each>
      <xsl:apply-templates select="*|text()"/>
    </xsl:element>
  </xsl:template>
</xsl:stylesheet>`,
  },

  // ─── 10. Convert Elements to Attributes ─────────────────────────────────────
  {
    id: 'elements-to-attrs',
    name: 'Convert Child Elements to Attributes',
    category: 'conversion',
    description: 'Compresses simple child tags into XML attributes on their parent element.',
    xsltVersion: '1.0',
    cpiTip: 'Used when building compact XML schemas or legacy SAP IDoc structures that require attributes.',
    sampleXml: `<Catalog>
  <Product>
    <Id>P-101</Id>
    <Status>InStock</Status>
    <Price>29.99</Price>
    <Description>Heavy duty steel bolt</Description>
  </Product>
</Catalog>`,
    defaultXslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <xsl:template match="/Catalog">
    <Catalog>
      <xsl:for-each select="Product">
        <!-- Convert simple tags to attributes -->
        <Product id="{Id}" status="{Status}" price="{Price}">
          <Description><xsl:value-of select="Description"/></Description>
        </Product>
      </xsl:for-each>
    </Catalog>
  </xsl:template>
</xsl:stylesheet>`,
  },

  // ─── 11. Sort Repeating Elements ────────────────────────────────────────────
  {
    id: 'sort-elements',
    name: 'Sort Repeating Elements by Value / Price',
    category: 'restructuring',
    description: 'Sorts repeated elements alphabetically or numerically using <xsl:sort>.',
    xsltVersion: '1.0',
    cpiTip: 'Useful before generating EDIFACT or SAP IDoc segments where line items must be strictly ordered by position or delivery date.',
    sampleXml: `<Inventory>
  <Item><Name>Screws</Name><Qty>500</Qty><Price>2.50</Price></Item>
  <Item><Name>Drill</Name><Qty>12</Qty><Price>120.00</Price></Item>
  <Item><Name>Hammer</Name><Qty>45</Qty><Price>18.99</Price></Item>
</Inventory>`,
    defaultXslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <xsl:template match="/Inventory">
    <SortedInventory>
      <!-- Sort numerically by price descending -->
      <xsl:for-each select="Item">
        <xsl:sort select="Price" data-type="number" order="descending"/>
        <xsl:copy-of select="."/>
      </xsl:for-each>
    </SortedInventory>
  </xsl:template>
</xsl:stylesheet>`,
  },

  // ─── 12. XML to Flat CSV / Delimited Text ────────────────────────────────────
  {
    id: 'xml-to-csv',
    name: 'XML to CSV / Delimited Text Export',
    category: 'conversion',
    description: 'Transforms XML into a clean CSV file with column headers and comma-separated rows.',
    xsltVersion: '1.0',
    cpiTip: 'A lightweight native alternative to Groovy scripting when generating CSV reports for SFTP or Email receivers.',
    sampleXml: `<Employees>
  <Employee id="E101"><Name>Alice Smith</Name><Dept>Engineering</Dept><Salary>95000</Salary></Employee>
  <Employee id="E102"><Name>Bob Jones</Name><Dept>Sales</Dept><Salary>78000</Salary></Employee>
  <Employee id="E103"><Name>Carol Danvers</Name><Dept>Management</Dept><Salary>115000</Salary></Employee>
</Employees>`,
    defaultXslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <!-- Set method to text for CSV generation -->
  <xsl:output method="text" encoding="UTF-8"/>

  <xsl:template match="/Employees">
    <!-- CSV Header Line -->
    <xsl:text>ID,Name,Department,Salary&#10;</xsl:text>
    
    <!-- CSV Data Rows -->
    <xsl:for-each select="Employee">
      <xsl:value-of select="@id"/><xsl:text>,</xsl:text>
      <xsl:text>"</xsl:text><xsl:value-of select="Name"/><xsl:text>",</xsl:text>
      <xsl:text>"</xsl:text><xsl:value-of select="Dept"/><xsl:text>",</xsl:text>
      <xsl:value-of select="Salary"/><xsl:text>&#10;</xsl:text>
    </xsl:for-each>
  </xsl:template>
</xsl:stylesheet>`,
  },
];

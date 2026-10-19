/**
 * Realistic Enterprise Integration XML Samples for XSLT Smart Mapping
 * Includes Source XML and matching Target XML pairs representing SAP CPI, S/4HANA, and B2B scenarios.
 */

export interface XsltMappingSample {
  id: string;
  name: string;
  badge: string;
  description: string;
  sourceXml: string;
  targetXml: string;
}

export const XSLT_MAPPING_SAMPLES: XsltMappingSample[] = [
  // ─── 1. SAP IDoc ORDERS05 to Canonical Purchase Order ───────────────────────
  {
    id: 'sap-idoc-to-order',
    name: 'SAP IDoc (ORDERS05) → Canonical Purchase Order',
    badge: 'SAP CPI',
    description: 'Transforms a raw SAP ERP/S4 IDoc ORDERS05 payload into an e-commerce canonical purchase order with line items.',
    sourceXml: `<?xml version="1.0" encoding="UTF-8"?>
<ORDERS05>
  <IDOC BEGIN="1">
    <EDI_DC40 SEGMENT="1">
      <TABNAM>EDI_DC40</TABNAM>
      <DOCNUM>0000000000459812</DOCNUM>
      <MESTYP>ORDERS</MESTYP>
      <SNDPRN>S4HANA_PRD</SNDPRN>
      <RCVPRN>CPI_TENANT_EU10</RCVPRN>
      <CREDAT>20261019</CREDAT>
    </EDI_DC40>
    <E1EDK01 SEGMENT="1">
      <BELNR>4500098120</BELNR>
      <CURCY>EUR</CURCY>
      <ZTERM>NT30</ZTERM>
    </E1EDK01>
    <E1EDKA1 SEGMENT="1">
      <PARVW>AG</PARVW>
      <PARTN>0000100234</PARTN>
      <NAME1>ACME Global Manufacturing AG</NAME1>
      <ORT01>Walldorf</ORT01>
      <LAND1>DE</LAND1>
    </E1EDKA1>
    <E1EDP01 SEGMENT="1">
      <POSEX>00010</POSEX>
      <MENGE>10.000</MENGE>
      <MENEE>PCE</MENEE>
      <BMNG2>10.000</BMNG2>
      <NETWR>150.00</NETWR>
      <E1EDP19 SEGMENT="1">
        <QUALF>001</QUALF>
        <KTEXT>Ball Bearing 6205-2RS</KTEXT>
      </E1EDP19>
    </E1EDP01>
    <E1EDP01 SEGMENT="1">
      <POSEX>00020</POSEX>
      <MENGE>2.000</MENGE>
      <MENEE>PCE</MENEE>
      <BMNG2>2.000</BMNG2>
      <NETWR>890.00</NETWR>
      <E1EDP19 SEGMENT="1">
        <QUALF>001</QUALF>
        <KTEXT>Pressure Sensor Valve 1/2"</KTEXT>
      </E1EDP19>
    </E1EDP01>
  </IDOC>
</ORDERS05>`,
    targetXml: `<?xml version="1.0" encoding="UTF-8"?>
<PurchaseOrder orderNumber="4500098120" currency="EUR">
  <Customer>
    <PartnerNumber>0000100234</PartnerNumber>
    <CustomerName>ACME Global Manufacturing AG</CustomerName>
    <City>Walldorf</City>
    <Country>DE</Country>
  </Customer>
  <LineItems>
    <Item position="00010">
      <Description>Ball Bearing 6205-2RS</Description>
      <Quantity>10.000</Quantity>
      <UnitOfMeasure>PCE</UnitOfMeasure>
      <NetValue>150.00</NetValue>
    </Item>
    <Item position="00020">
      <Description>Pressure Sensor Valve 1/2"</Description>
      <Quantity>2.000</Quantity>
      <UnitOfMeasure>PCE</UnitOfMeasure>
      <NetValue>890.00</NetValue>
    </Item>
  </LineItems>
</PurchaseOrder>`,
  },

  // ─── 2. SOAP Customer Query to REST Canonical ──────────────────────────────
  {
    id: 'soap-to-canonical',
    name: 'SOAP Web Service → Canonical REST Profile',
    badge: 'B2B / API',
    description: 'Converts legacy SOAP web service customer response into modern, clean customer profile XML.',
    sourceXml: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cust="http://services.toolsap.com/customer">
  <soap:Header>
    <cust:TransactionToken>TX-98712345</cust:TransactionToken>
  </soap:Header>
  <soap:Body>
    <cust:GetCustomerResponse>
      <cust:CustomerId>C-77889</cust:CustomerId>
      <cust:CompanyName>Nordic Wind Energy A/S</cust:CompanyName>
      <cust:EmailAddress>contact@nordicwind.dk</cust:EmailAddress>
      <cust:PhoneNumber>+45 88 12 34 56</cust:PhoneNumber>
      <cust:AccountStatus>ACTIVE</cust:AccountStatus>
      <cust:CreditLimit currency="DKK">250000</cust:CreditLimit>
    </cust:GetCustomerResponse>
  </soap:Body>
</soap:Envelope>`,
    targetXml: `<?xml version="1.0" encoding="UTF-8"?>
<CustomerProfile id="C-77889" status="ACTIVE">
  <Name>Nordic Wind Energy A/S</Name>
  <Contact>
    <Email>contact@nordicwind.dk</Email>
    <Phone>+45 88 12 34 56</Phone>
  </Contact>
  <Financials>
    <CreditLimit currency="DKK">250000</CreditLimit>
  </Financials>
</CustomerProfile>`,
  },

  // ─── 3. Multi-Namespace Catalog to Flat Inventory Feed ──────────────────────
  {
    id: 'catalog-to-feed',
    name: 'Multi-Namespace Catalog → Inventory Feed',
    badge: 'Namespaces',
    description: 'Maps complex XML with default and prefixed namespaces into a flat inventory update format.',
    sourceXml: `<?xml version="1.0" encoding="UTF-8"?>
<store xmlns="https://toolsap.com/schema/store" xmlns:meta="https://toolsap.com/schema/meta" xmlns:inv="https://toolsap.com/schema/inventory">
  <meta:GeneratedAt>2026-10-19T10:00:00Z</meta:GeneratedAt>
  <products>
    <product sku="SKU-AUDIO-01" meta:source="warehouse">
      <name>Noise Cancelling Wireless Headphones</name>
      <inv:StockStatus>InStock</inv:StockStatus>
      <inv:QuantityAvailable>45</inv:QuantityAvailable>
      <price currency="USD">299.99</price>
    </product>
    <product sku="SKU-AUDIO-02" meta:source="store">
      <name>Studio Monitor Speakers</name>
      <inv:StockStatus>LowStock</inv:StockStatus>
      <inv:QuantityAvailable>4</inv:QuantityAvailable>
      <price currency="USD">149.50</price>
    </product>
  </products>
</store>`,
    targetXml: `<?xml version="1.0" encoding="UTF-8"?>
<InventoryFeed>
  <Products>
    <Item sku="SKU-AUDIO-01" inStock="true">
      <Title>Noise Cancelling Wireless Headphones</Title>
      <UnitsOnHand>45</UnitsOnHand>
      <Price currency="USD">299.99</Price>
    </Item>
    <Item sku="SKU-AUDIO-02" inStock="true">
      <Title>Studio Monitor Speakers</Title>
      <UnitsOnHand>4</UnitsOnHand>
      <Price currency="USD">149.50</Price>
    </Item>
  </Products>
</InventoryFeed>`,
  },

  // ─── 4. Healthcare Patient Record to Simple Profile ─────────────────────────
  {
    id: 'patient-to-profile',
    name: 'Patient Clinical Record → Simplified Profile',
    badge: 'Healthcare',
    description: 'Maps deep clinical patient XML into a simplified administrative profile.',
    sourceXml: `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalRecord recordId="REC-88712">
  <PatientInfo>
    <MRN>MRN-90210</MRN>
    <LegalName>
      <First>Eleanor</First>
      <Middle>Grace</Middle>
      <Last>Vance</Last>
    </LegalName>
    <DOB>1984-06-15</DOB>
    <Gender>Female</Gender>
  </PatientInfo>
  <EmergencyContacts>
    <Contact relation="Spouse">
      <Name>Thomas Vance</Name>
      <Phone>555-0192</Phone>
    </Contact>
  </EmergencyContacts>
</ClinicalRecord>`,
    targetXml: `<?xml version="1.0" encoding="UTF-8"?>
<PatientProfile id="MRN-90210" birthDate="1984-06-15">
  <FullName>Eleanor Vance</FullName>
  <Gender>Female</Gender>
  <EmergencyContact>
    <Relationship>Spouse</Relationship>
    <ContactName>Thomas Vance</ContactName>
    <Telephone>555-0192</Telephone>
  </EmergencyContact>
</PatientProfile>`,
  },
];

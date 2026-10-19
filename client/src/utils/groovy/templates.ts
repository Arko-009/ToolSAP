/**
 * Production-grade SAP Cloud Integration Groovy Script Templates
 */

import type { ScriptTemplate } from './types';

export const GROOVY_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'default',
    name: 'Standard CPI Message Handler',
    category: 'General',
    description: 'Read and update message body, headers, and exchange properties.',
    script: `import com.sap.gateway.ip.core.customdev.util.Message

def Message processData(Message message) {
    // 1. Read message body as String
    def body = message.getBody(String)
    
    // 2. Read existing headers & properties
    def headers = message.getHeaders()
    def sender = message.getHeader("SenderSystem") ?: "UNKNOWN_SENDER"
    
    // 3. Mutate headers & properties
    message.setHeader("X-Processed-By", "ToolSAP-Groovy-Simulator")
    message.setProperty("originalPayloadLength", body.length())
    message.setProperty("processedTimestamp", new Date().format("yyyy-MM-dd'T'HH:mm:ss"))
    
    // 4. Log to console
    println("Processing message from sender: \${sender}")
    println("Payload size: \${body.length()} characters")
    
    // 5. Update message body
    message.setBody(body + "\\n<!-- Enriched by SAP CPI Groovy Script -->")
    
    return message
}`,
    sampleBody: `<Order id="PO-99201">
  <Customer>Acme Global Corp</Customer>
  <Amount currency="USD">14500.00</Amount>
  <Status>PENDING</Status>
</Order>`,
    sampleHeaders: {
      SenderSystem: 'SAP_S4HANA_PRD',
      'Content-Type': 'application/xml',
      SAP_MessageType: 'Orders',
    },
    sampleProperties: {
      retryCount: '0',
      regionCode: 'EMEA',
    },
  },

  {
    id: 'xml-transform',
    name: 'XML Transformation (XmlSlurper & MarkupBuilder)',
    category: 'XML',
    description: 'Parse incoming XML with XmlSlurper, calculate totals, and build target XML with MarkupBuilder.',
    script: `import com.sap.gateway.ip.core.customdev.util.Message
import groovy.xml.XmlSlurper
import groovy.xml.MarkupBuilder

def Message processData(Message message) {
    def body = message.getBody(String)
    
    // Parse incoming XML with XmlSlurper
    def root = new XmlSlurper().parseText(body)
    def orderId = root.@id.text() ?: root.@id
    
    println("Transforming Order ID: \${orderId}")
    
    // Calculate total price from line items
    def grandTotal = 0.0
    def itemCount = 0
    root.Items.Item.each { item ->
        def price = item.Price.text() as Float
        def qty = item.Quantity.text() as Integer
        grandTotal += (price * qty)
        itemCount++
        println("Item: \${item.Name.text()} | Total: \${price * qty}")
    }
    
    // Build canonical target XML with MarkupBuilder
    def writer = new StringWriter()
    def xml = new MarkupBuilder(writer)
    
    xml.CanonicalOrder(orderRef: orderId) {
        xml.Summary {
            xml.TotalItems(itemCount)
            xml.CalculatedTotal(grandTotal)
            xml.Currency(root.Items.@currency.text())
            xml.ProcessedAt(new Date().format("yyyy-MM-dd HH:mm:ss"))
        }
    }
    
    // Set headers and resulting body
    message.setHeader("ItemCount", String.valueOf(itemCount))
    message.setProperty("CalculatedGrandTotal", grandTotal)
    message.setBody(writer.toString())
    
    return message
}`,
    sampleBody: `<?xml version="1.0" encoding="UTF-8"?>
<PurchaseOrder id="PO-2026-8812">
  <Items currency="EUR">
    <Item>
      <Name>High-Torque Industrial Drill</Name>
      <Price>250.00</Price>
      <Quantity>2</Quantity>
    </Item>
    <Item>
      <Name>Precision Safety Glasses</Name>
      <Price>15.50</Price>
      <Quantity>10</Quantity>
    </Item>
  </Items>
</PurchaseOrder>`,
    sampleHeaders: {
      'Content-Type': 'application/xml',
      SourceSystem: 'MES_FACTORY_01',
    },
    sampleProperties: {
      TargetQueue: 'ERP_ORDERS_INBOUND',
    },
  },

  {
    id: 'json-processing',
    name: 'JSON Manipulation (JsonSlurper & JsonOutput)',
    category: 'JSON',
    description: 'Parse JSON payload, filter or enrich records, and return formatted JSON output.',
    script: `import com.sap.gateway.ip.core.customdev.util.Message
import groovy.json.JsonSlurper
import groovy.json.JsonOutput

def Message processData(Message message) {
    def body = message.getBody(String)
    
    // Parse JSON into map
    def json = new JsonSlurper().parseText(body)
    
    println("Original customer: \${json.customer.name}")
    println("Active items count: \${json.items.size()}")
    
    // Filter active items and compute total
    def totalAmount = 0.0
    json.items.each { item ->
        totalAmount += (item.unitPrice * item.quantity)
        println(" - \${item.sku}: \${item.quantity} x $\${item.unitPrice}")
    }
    
    // Enrich JSON object
    json.status = "VERIFIED"
    json.audit = [
        processedBy: "ToolSAP-CPI-Simulator",
        processedTimestamp: new Date().format("yyyy-MM-dd'T'HH:mm:ss"),
        computedTotal: totalAmount
    ]
    
    // Update headers and exchange properties
    message.setHeader("Content-Type", "application/json")
    message.setHeader("X-Audit-Status", "VERIFIED")
    message.setProperty("OrderTotal", totalAmount)
    
    // Output formatted JSON
    def updatedJsonStr = JsonOutput.prettyPrint(JsonOutput.toJson(json))
    message.setBody(updatedJsonStr)
    
    return message
}`,
    sampleBody: `{
  "orderId": "ORD-55421",
  "customer": {
    "id": "CUST-901",
    "name": "Wayne Enterprises",
    "tier": "PLATINUM"
  },
  "items": [
    { "sku": "BAT-01", "name": "Grappling Hook", "quantity": 3, "unitPrice": 450.00 },
    { "sku": "BAT-02", "name": "Reinforced Armor Plate", "quantity": 1, "unitPrice": 2200.00 }
  ]
}`,
    sampleHeaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer mock_token_cpi_12345',
    },
    sampleProperties: {
      TenantEnvironment: 'PRD-EU10',
    },
  },

  {
    id: 'dynamic-routing',
    name: 'Dynamic Routing & Header Inspection',
    category: 'Routing',
    description: 'Inspect message headers and attributes to set dynamic Camel HTTP routing headers.',
    script: `import com.sap.gateway.ip.core.customdev.util.Message

def Message processData(Message message) {
    def headers = message.getHeaders()
    def properties = message.getProperties()
    
    def region = message.getHeader("Region") ?: "GLOBAL"
    def isUrgent = message.getHeader("Urgent") == "true"
    
    // Determine dynamic target endpoint based on routing criteria
    def destinationUrl = ""
    if (region == "EU") {
        destinationUrl = "https://eu-gateway.api.enterprise.com/v1/orders"
    } else if (region == "US") {
        destinationUrl = "https://us-gateway.api.enterprise.com/v1/orders"
    } else {
        destinationUrl = "https://global-gateway.api.enterprise.com/v1/orders"
    }
    
    // Set standard Camel HTTP dynamic routing headers
    message.setHeader("CamelHttpUri", destinationUrl)
    message.setHeader("CamelHttpMethod", "POST")
    message.setHeader("SAP_RoutingDestination", destinationUrl)
    
    if (isUrgent) {
        message.setHeader("SAP_MessagePriority", "HIGH")
        message.setProperty("ProcessingQueue", "PRIORITY_DISPATCH_QUEUE")
    } else {
        message.setHeader("SAP_MessagePriority", "NORMAL")
        message.setProperty("ProcessingQueue", "STANDARD_QUEUE")
    }
    
    println("Routed message to: \${destinationUrl}")
    println("Assigned priority: \${message.getHeader('SAP_MessagePriority')}")
    
    return message
}`,
    sampleBody: `<ShipmentNotification>
  <TrackingId>TRK-8839210</TrackingId>
  <Carrier>DHL_EXPRESS</Carrier>
  <DestinationWarehouse>WH-FRANKFURT-04</DestinationWarehouse>
</ShipmentNotification>`,
    sampleHeaders: {
      Region: 'EU',
      Urgent: 'true',
      'Content-Type': 'application/xml',
    },
    sampleProperties: {
      SourceAdapter: 'SFTP_POLLER',
    },
  },

  {
    id: 'base64-codec',
    name: 'Base64 Payload Converter',
    category: 'Security',
    description: 'Convert raw payload to Base64 or decode encoded incoming payloads.',
    script: `import com.sap.gateway.ip.core.customdev.util.Message

def Message processData(Message message) {
    // Retrieve body as byte array
    def byte[] bodyBytes = message.getBody(byte[])
    
    // Groovy Base64 encode
    def base64String = bodyBytes.encodeBase64().toString()
    
    println("Original byte length: \${bodyBytes.length}")
    println("Base64 encoded length: \${base64String.length()}")
    
    // Set response headers and encoded body
    message.setHeader("Content-Type", "text/plain")
    message.setHeader("Content-Transfer-Encoding", "base64")
    message.setProperty("OriginalBodySize", bodyBytes.length)
    message.setBody(base64String)
    
    return message
}`,
    sampleBody: `CONFIDENTIAL: ToolSAP Integration Suite Payload for Project Falcon.
Authorized Personnel Only.`,
    sampleHeaders: {
      'Content-Type': 'text/plain',
      'X-Security-Level': 'RESTRICTED',
    },
    sampleProperties: {
      EncryptionTarget: 'BLOB_STORAGE',
    },
  },

  {
    id: 'mpl-logging',
    name: 'MessageLog & MPL Attachment Recorder',
    category: 'Logging',
    description: 'Simulate MessageLogFactory, set MPL custom status properties, and record message attachments.',
    script: `import com.sap.gateway.ip.core.customdev.util.Message

def Message processData(Message message) {
    def body = message.getBody(String)
    
    // Retrieve MessageLog from factory
    def messageLog = messageLogFactory.getMessageLog(message)
    
    if (messageLog != null) {
        // Set searchable custom header properties in SAP CPI MPL
        messageLog.setStringProperty("CustomHeader_OrderNumber", "ORD-998811")
        messageLog.setStringProperty("CustomHeader_Status", "PREPROCESSED")
        
        // Attach original payload to MPL for debugging/auditing
        messageLog.addAttachmentAsString("Preprocessed_Payload.xml", body, "text/xml")
        println("Attached original payload to MPL")
    }
    
    message.setHeader("X-Audit-Logged", "true")
    message.setProperty("MPL_Recorded", "true")
    
    return message
}`,
    sampleBody: `<Invoice id="INV-2026-998811">
  <Vendor>Siemens AG</Vendor>
  <Amount currency="EUR">84200.00</Amount>
  <DueDate>2026-11-30</DueDate>
</Invoice>`,
    sampleHeaders: {
      'Content-Type': 'application/xml',
      SAP_Sender: 'ACCOUNTING_PORTAL',
    },
    sampleProperties: {
      CorrelationId: 'CORR-8839-4412',
    },
  },
];

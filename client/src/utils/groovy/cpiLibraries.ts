/**
 * SAP CPI Standard Groovy Libraries Simulator
 * Accurately emulates XmlSlurper, XmlParser, MarkupBuilder, JsonSlurper, JsonOutput, Base64 & Date
 */

import { DOMParser as XmldomParser } from '@xmldom/xmldom';

/**
 * Helper to safely extract child element nodes across browser DOM & xmldom
 */
function getChildElements(el: Element): Element[] {
  if (el.children && typeof el.children.length === 'number') {
    return Array.from(el.children);
  }
  const result: Element[] = [];
  if (el.childNodes) {
    for (let i = 0; i < el.childNodes.length; i++) {
      const node = el.childNodes[i];
      if (node.nodeType === 1) {
        result.push(node as Element);
      }
    }
  }
  return result;
}

/**
 * GPath Attribute wrapper supporting both .text() and string conversion
 */
export class GPathAttribute {
  private _val: string;

  constructor(val: string) {
    this._val = val;
  }

  text(): string {
    return this._val;
  }

  toString(): string {
    return this._val;
  }

  valueOf(): string {
    return this._val;
  }
}

/**
 * GPath Node wrapper for XML traversal
 */
export class GPathNode {
  _element: Element;

  constructor(element: Element) {
    this._element = element;
    return createGPathProxy(this);
  }

  text(): string {
    if (this._element.textContent !== undefined && this._element.textContent !== null) {
      return this._element.textContent;
    }
    // Fallback for xmldom
    let txt = '';
    if (this._element.childNodes) {
      for (let i = 0; i < this._element.childNodes.length; i++) {
        const child = this._element.childNodes[i];
        if (child.nodeType === 3 || child.nodeType === 4) {
          txt += child.nodeValue || '';
        } else if (child.nodeType === 1) {
          txt += new GPathNode(child as Element).text();
        }
      }
    }
    return txt;
  }

  name(): string {
    return this._element.localName || this._element.nodeName;
  }

  attributes(): Record<string, string> {
    const attrs: Record<string, string> = {};
    if (this._element.attributes) {
      for (let i = 0; i < this._element.attributes.length; i++) {
        const a = this._element.attributes[i];
        attrs[a.name] = a.value;
      }
    }
    return attrs;
  }

  children(): GPathNodeList {
    const list = getChildElements(this._element).map((c) => new GPathNode(c));
    return new GPathNodeList(list);
  }

  size(): number {
    return 1;
  }

  toString(): string {
    return this.text();
  }
}

/**
 * GPath NodeList wrapper for multiple XML elements
 */
export class GPathNodeList extends Array<GPathNode> {
  constructor(items: GPathNode[] = []) {
    super(...items);
    Object.setPrototypeOf(this, GPathNodeList.prototype);
    return createGPathListProxy(this);
  }

  text(): string {
    return this.map((n) => n.text()).join('');
  }

  each(callback: (node: GPathNode, index?: number) => void): void {
    this.forEach((n, idx) => callback(n, idx));
  }

  collect<T>(callback: (node: GPathNode) => T): T[] {
    return this.map(callback);
  }

  findAll(predicate: (node: GPathNode) => boolean): GPathNodeList {
    return new GPathNodeList(this.filter(predicate));
  }

  find(
    predicate: (value: GPathNode, index: number, obj: GPathNode[]) => unknown,
    thisArg?: any
  ): GPathNode | undefined {
    return super.find(predicate as any, thisArg);
  }

  size(): number {
    return this.length;
  }
}

function createGPathListProxy(list: GPathNodeList): any {
  return new Proxy(list, {
    get(target, prop, receiver) {
      if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver);

      if (prop in target) {
        const val = (target as any)[prop];
        return typeof val === 'function' ? val.bind(target) : val;
      }

      // Check numeric index
      if (!isNaN(Number(prop))) {
        return target[Number(prop)];
      }

      // Check attribute access on list
      if (typeof prop === 'string' && prop.startsWith('@')) {
        const attrName = prop.slice(1);
        for (let i = 0; i < target.length; i++) {
          const val = target[i]._element.getAttribute(attrName);
          if (val) return new GPathAttribute(val);
        }
        return new GPathAttribute('');
      }

      // Property access across all children in the list
      const matched: GPathNode[] = [];
      target.forEach((node) => {
        const children = getChildElements(node._element);
        for (let i = 0; i < children.length; i++) {
          const c = children[i];
          if (c.localName === prop || c.nodeName === prop) {
            matched.push(new GPathNode(c));
          }
        }
      });

      if (matched.length === 0) return new GPathNodeList([]);
      if (matched.length === 1) return matched[0];
      return new GPathNodeList(matched);
    },
  });
}

function createGPathProxy(node: GPathNode): any {
  return new Proxy(node, {
    get(target, prop, receiver) {
      if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver);

      // Node methods
      if (prop === 'text') return () => target.text();
      if (prop === 'name') return () => target.name();
      if (prop === 'attributes') return () => target.attributes();
      if (prop === 'children') return () => target.children();
      if (prop === 'size') return () => target.size();
      if (prop === 'toString') return () => target.toString();
      if (prop === '_element') return target._element;

      // Attribute access: e.g. @id or ['@id']
      if (prop.startsWith('@')) {
        const attrName = prop.slice(1);
        const val = target._element.getAttribute(attrName) ?? '';
        return new GPathAttribute(val);
      }

      // Collection helpers directly on single node
      if (prop === 'each') {
        return (cb: (item: GPathNode) => void) => cb(target);
      }
      if (prop === 'collect') {
        return (cb: (item: GPathNode) => any) => [cb(target)];
      }

      // Child tag access
      const children = getChildElements(node._element);
      const matched: GPathNode[] = [];
      for (let i = 0; i < children.length; i++) {
        const c = children[i];
        if (c.localName === prop || c.nodeName === prop) {
          matched.push(new GPathNode(c));
        }
      }

      if (matched.length === 0) {
        return new GPathNodeList([]);
      }
      if (matched.length === 1) {
        return matched[0];
      }
      return new GPathNodeList(matched);
    },
  });
}

/**
 * Emulates groovy.xml.XmlSlurper / groovy.util.XmlSlurper
 */
export class XmlSlurper {
  parseText(xml: string): GPathNode {
    const ParserClass = typeof DOMParser !== 'undefined' ? DOMParser : XmldomParser;
    const parser = new ParserClass();
    const doc = parser.parseFromString(xml, 'application/xml') as any;

    // Check parsererror for browser DOM
    if (typeof doc.querySelector === 'function') {
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error(`XML Parsing Error: ${parserError.textContent?.slice(0, 200)}`);
      }
    }

    if (!doc.documentElement) {
      throw new Error('XML parsing failed: No document element found.');
    }

    return new GPathNode(doc.documentElement as Element);
  }
}

/**
 * Emulates groovy.xml.XmlParser / groovy.util.XmlParser
 */
export class XmlParser extends XmlSlurper {}

/**
 * Simulated StringWriter
 */
export class StringWriter {
  private buffer: string[] = [];

  write(str: string): void {
    this.buffer.push(str);
  }

  toString(): string {
    return this.buffer.join('');
  }
}

/**
 * Emulates groovy.xml.MarkupBuilder
 */
export class MarkupBuilder {
  private writer: StringWriter;
  private indentLevel: number = 0;

  constructor(writer?: StringWriter) {
    this.writer = writer || new StringWriter();
    return createMarkupBuilderProxy(this);
  }

  _writeTag(name: string, args: any[]): void {
    const indent = '  '.repeat(this.indentLevel);
    let attributes: Record<string, any> = {};
    let content: any = null;
    let closure: Function | null = null;

    for (const arg of args) {
      if (typeof arg === 'function') {
        closure = arg;
      } else if (typeof arg === 'object' && arg !== null && !Array.isArray(arg)) {
        attributes = { ...attributes, ...arg };
      } else {
        content = arg;
      }
    }

    const attrStr = Object.entries(attributes)
      .map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`)
      .join('');

    if (closure) {
      this.writer.write(`${indent}<${name}${attrStr}>\n`);
      this.indentLevel++;
      closure();
      this.indentLevel--;
      this.writer.write(`${indent}</${name}>\n`);
    } else if (content !== null && content !== undefined) {
      this.writer.write(`${indent}<${name}${attrStr}>${String(content)}</${name}>\n`);
    } else {
      this.writer.write(`${indent}<${name}${attrStr}/>\n`);
    }
  }

  toString(): string {
    return this.writer.toString();
  }
}

function createMarkupBuilderProxy(builder: MarkupBuilder): any {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver);
      if (prop in target) {
        const val = (target as any)[prop];
        return typeof val === 'function' ? val.bind(target) : val;
      }

      // Any method call like builder.Order(...) becomes an XML tag
      return (...args: any[]) => {
        target._writeTag(prop, args);
      };
    },
  });
}

/**
 * Emulates groovy.json.JsonSlurper
 */
export class JsonSlurper {
  parseText(json: string): any {
    try {
      const parsed = JSON.parse(json);
      return augmentJsonData(parsed);
    } catch (err: any) {
      throw new Error(`JsonSlurper Parse Error: ${err.message}`);
    }
  }
}

// Initialize standard Groovy collection extensions on Array.prototype
if (typeof Array !== 'undefined') {
  if (!('collect' in Array.prototype)) {
    Object.defineProperty(Array.prototype, 'collect', {
      value: function (cb: Function) {
        return this.map(cb);
      },
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
  if (!('sum' in Array.prototype)) {
    Object.defineProperty(Array.prototype, 'sum', {
      value: function () {
        return this.reduce((a: any, b: any) => a + b, 0);
      },
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
  if (!('each' in Array.prototype)) {
    Object.defineProperty(Array.prototype, 'each', {
      value: function (cb: Function) {
        this.forEach((item: any, i: number) => cb(item, i));
        return this;
      },
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
  if (!('findAll' in Array.prototype)) {
    Object.defineProperty(Array.prototype, 'findAll', {
      value: function (predicate: Function) {
        return this.filter(predicate);
      },
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
  if (!('size' in Array.prototype)) {
    Object.defineProperty(Array.prototype, 'size', {
      value: function () {
        return this.length;
      },
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
}

/**
 * Augment objects and arrays with Groovy-style collection methods
 */
export function augmentJsonData(data: any): any {
  if (data === null || data === undefined || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    // Add Groovy methods to array
    Object.defineProperty(data, 'each', {
      value: function (cb: Function) {
        this.forEach((item: any, i: number) => cb(item, i));
        return this;
      },
      enumerable: false,
    });
    Object.defineProperty(data, 'collect', {
      value: function (cb: Function) {
        return this.map(cb);
      },
      enumerable: false,
    });
    Object.defineProperty(data, 'findAll', {
      value: function (predicate: Function) {
        return this.filter(predicate);
      },
      enumerable: false,
    });
    Object.defineProperty(data, 'find', {
      value: function (predicate: Function) {
        return Array.prototype.find.call(this, predicate as any);
      },
      enumerable: false,
    });
    Object.defineProperty(data, 'sum', {
      value: function () {
        return this.reduce((a: any, b: any) => a + b, 0);
      },
      enumerable: false,
    });
    Object.defineProperty(data, 'size', {
      value: function () {
        return this.length;
      },
      enumerable: false,
    });

    data.forEach(augmentJsonData);
    return data;
  }

  // Object/Map methods
  Object.defineProperty(data, 'each', {
    value: function (cb: Function) {
      Object.entries(this).forEach(([k, v]) => cb(k, v));
      return this;
    },
    enumerable: false,
  });
  Object.defineProperty(data, 'size', {
    value: function () {
      return Object.keys(this).length;
    },
    enumerable: false,
  });

  Object.values(data).forEach(augmentJsonData);
  return data;
}

/**
 * Emulates groovy.json.JsonOutput
 */
export const JsonOutput = {
  toJson(obj: any): string {
    return JSON.stringify(obj);
  },
  prettyPrint(jsonString: string): string {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(jsonString);
    }
  },
};

/**
 * Emulates groovy.json.JsonBuilder
 */
export class JsonBuilder {
  private content: any = {};

  constructor(content?: any) {
    if (content !== undefined) {
      this.content = content;
    }
  }

  call(closureOrMap: any): void {
    if (typeof closureOrMap === 'function') {
      const target: Record<string, any> = {};
      closureOrMap.call(target);
      this.content = target;
    } else {
      this.content = closureOrMap;
    }
  }

  toPrettyString(): string {
    return JSON.stringify(this.content, null, 2);
  }

  toString(): string {
    return JSON.stringify(this.content);
  }
}

/**
 * Groovy Date extension
 */
export class GroovyDate extends Date {
  format(pattern: string = 'yyyy-MM-dd'): string {
    const year = this.getFullYear();
    const month = String(this.getMonth() + 1).padStart(2, '0');
    const day = String(this.getDate()).padStart(2, '0');
    const hours = String(this.getHours()).padStart(2, '0');
    const minutes = String(this.getMinutes()).padStart(2, '0');
    const seconds = String(this.getSeconds()).padStart(2, '0');

    return pattern
      .replace(/yyyy/g, String(year))
      .replace(/MM/g, month)
      .replace(/dd/g, day)
      .replace(/HH/g, hours)
      .replace(/mm/g, minutes)
      .replace(/ss/g, seconds);
  }
}

/**
 * SimpleDateFormat emulation
 */
export class SimpleDateFormat {
  private pattern: string;

  constructor(pattern: string = 'yyyy-MM-dd') {
    this.pattern = pattern;
  }

  format(date: Date): string {
    const gd = new GroovyDate(date.getTime());
    return gd.format(this.pattern);
  }

  parse(dateStr: string): Date {
    return new Date(dateStr);
  }
}

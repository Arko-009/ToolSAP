/**
 * SAP Cloud Integration Message & MessageLog Simulation
 * Accurately implements com.sap.gateway.ip.core.customdev.util.Message
 */

import type { Attachment } from './types';

/**
 * Byte array helper mimicking Groovy byte[] extensions
 */
export class GroovyByteArray extends Uint8Array {
  encodeBase64(): { toString: () => string } {
    let binary = '';
    const bytes = this;
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);
    return {
      toString: () => b64,
    };
  }

  toString(): string {
    return new TextDecoder().decode(this);
  }
}

/**
 * Simulated InputStream for message.getBody(java.io.InputStream)
 */
export class GroovyInputStream {
  private buffer: Uint8Array;
  private pointer: number = 0;

  constructor(content: string | Uint8Array) {
    if (typeof content === 'string') {
      this.buffer = new TextEncoder().encode(content);
    } else {
      this.buffer = content;
    }
  }

  read(): number {
    if (this.pointer >= this.buffer.length) {
      return -1;
    }
    return this.buffer[this.pointer++];
  }

  getText(encoding?: string): string {
    const enc = encoding ? encoding.toLowerCase() : 'utf-8';
    try {
      return new TextDecoder(enc).decode(this.buffer);
    } catch {
      return new TextDecoder().decode(this.buffer);
    }
  }

  get text(): string {
    return this.getText();
  }

  getBytes(): GroovyByteArray {
    const arr = new GroovyByteArray(this.buffer.length);
    arr.set(this.buffer);
    return arr;
  }

  close(): void {
    this.pointer = this.buffer.length;
  }
}

/**
 * Creates a live, mutable map proxy that supports both Map methods
 * (.put, .get, .remove, .containsKey, .size, etc.) and property access (obj['key'] = val)
 */
export function createMutableProxy(targetMap: Map<string, any>): Record<string, any> {
  const handler: ProxyHandler<Map<string, any>> = {
    get(target, prop, receiver) {
      if (typeof prop === 'symbol') {
        return Reflect.get(target, prop, receiver);
      }

      // Map standard methods
      if (prop === 'get') {
        return (key: string) => target.get(key);
      }
      if (prop === 'put') {
        return (key: string, value: any) => {
          target.set(key, value);
          return value;
        };
      }
      if (prop === 'remove') {
        return (key: string) => {
          const prev = target.get(key);
          target.delete(key);
          return prev;
        };
      }
      if (prop === 'containsKey' || prop === 'has') {
        return (key: string) => target.has(key);
      }
      if (prop === 'size') {
        return target.size;
      }
      if (prop === 'clear') {
        return () => target.clear();
      }
      if (prop === 'keySet') {
        return () => Array.from(target.keys());
      }
      if (prop === 'values') {
        return () => Array.from(target.values());
      }
      if (prop === 'entrySet') {
        return () => Array.from(target.entries());
      }
      if (prop === 'each' || prop === 'forEach') {
        return (callback: (keyOrEntry: any, val?: any) => void) => {
          target.forEach((val, key) => {
            callback(key, val);
          });
        };
      }

      // Fallback: check if the key exists directly in the target Map
      if (target.has(prop)) {
        return target.get(prop);
      }

      // Fallback to prototype methods
      if (prop in target) {
        const val = (target as any)[prop];
        return typeof val === 'function' ? val.bind(target) : val;
      }

      return undefined;
    },
    set(target, prop, value) {
      if (typeof prop === 'string') {
        target.set(prop, value);
        return true;
      }
      return false;
    },
    deleteProperty(target, prop) {
      if (typeof prop === 'string') {
        return target.delete(prop);
      }
      return false;
    },
    has(target, prop) {
      if (typeof prop === 'string') {
        return target.has(prop);
      }
      return false;
    },
    ownKeys(target) {
      return Array.from(target.keys());
    },
    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === 'string' && target.has(prop)) {
        return {
          enumerable: true,
          configurable: true,
          writable: true,
          value: target.get(prop),
        };
      }
      return undefined;
    },
  };

  return new Proxy(targetMap, handler);
}

/**
 * Implementation of com.sap.gateway.ip.core.customdev.util.Message
 */
export class CpiMessage {
  private _body: any;
  private _headers: Map<string, any>;
  private _properties: Map<string, any>;
  private _attachments: Map<string, Attachment>;
  private _headersProxy: Record<string, any>;
  private _propertiesProxy: Record<string, any>;

  constructor(
    initialBody: string = '',
    initialHeaders: Record<string, any> = {},
    initialProperties: Record<string, any> = {}
  ) {
    this._body = initialBody;
    this._headers = new Map(Object.entries(initialHeaders));
    this._properties = new Map(Object.entries(initialProperties));
    this._attachments = new Map();

    this._headersProxy = createMutableProxy(this._headers);
    this._propertiesProxy = createMutableProxy(this._properties);
  }

  // Body methods
  getBody(type?: any): any {
    if (!type) {
      return this._body;
    }

    const typeStr = typeof type === 'string' ? type : type?.name || type?.toString() || '';

    if (type === String || typeStr.includes('String')) {
      if (this._body === null || this._body === undefined) return '';
      if (typeof this._body === 'string') return this._body;
      if (this._body instanceof Uint8Array) return new TextDecoder().decode(this._body);
      if (typeof this._body === 'object') return JSON.stringify(this._body);
      return String(this._body);
    }

    if (typeStr.includes('byte[]') || typeStr.includes('ByteArray')) {
      if (this._body instanceof GroovyByteArray) return this._body;
      const encoded = new TextEncoder().encode(this.getBody(String));
      const arr = new GroovyByteArray(encoded.length);
      arr.set(encoded);
      return arr;
    }

    if (typeStr.includes('InputStream') || typeStr.includes('Stream')) {
      return new GroovyInputStream(this._body);
    }

    return this._body;
  }

  setBody(newBody: any): void {
    this._body = newBody;
  }

  getBodySize(): number {
    if (this._body === null || this._body === undefined) return 0;
    if (this._body instanceof Uint8Array) return this._body.byteLength;
    return new TextEncoder().encode(this.getBody(String)).length;
  }

  // Header methods
  getHeaders(): Record<string, any> {
    return this._headersProxy;
  }

  getHeader(name: string, type?: any): any {
    const val = this._headers.get(name);
    if (val === undefined || !type) return val;

    const typeStr = typeof type === 'string' ? type : type?.name || type?.toString() || '';
    if (type === String || typeStr.includes('String')) return String(val);
    if (type === Number || typeStr.includes('Integer') || typeStr.includes('int')) return parseInt(val, 10);
    if (typeStr.includes('Boolean') || typeStr.includes('boolean')) return Boolean(val);
    return val;
  }

  setHeader(name: string, value: any): void {
    this._headers.set(name, value);
  }

  // Exchange Property methods
  getProperties(): Record<string, any> {
    return this._propertiesProxy;
  }

  getProperty(name: string): any {
    return this._properties.get(name);
  }

  setProperty(name: string, value: any): void {
    this._properties.set(name, value);
  }

  // Attachment methods
  getAttachments(): Map<string, Attachment> {
    return this._attachments;
  }

  addAttachmentAsString(id: string, content: string, contentType: string = 'text/plain'): void {
    this._attachments.set(id, { id, content, contentType });
  }

  // Internal export helpers
  _getInternalHeadersMap(): Record<string, any> {
    const result: Record<string, any> = {};
    this._headers.forEach((v, k) => {
      result[k] = v;
    });
    return result;
  }

  _getInternalPropertiesMap(): Record<string, any> {
    const result: Record<string, any> = {};
    this._properties.forEach((v, k) => {
      result[k] = v;
    });
    return result;
  }

  _getInternalAttachmentsList(): Attachment[] {
    return Array.from(this._attachments.values());
  }
}

/**
 * Simulated MessageLog
 */
export class CpiMessageLog {
  private _customHeaders: Record<string, string> = {};
  private _message: CpiMessage;

  constructor(message: CpiMessage) {
    this._message = message;
  }

  setStringProperty(name: string, value: string): void {
    this._customHeaders[name] = String(value);
    this._message.setProperty(`MPL_${name}`, value);
  }

  setIntegerProperty(name: string, value: number): void {
    this.setStringProperty(name, String(value));
  }

  setLongProperty(name: string, value: number): void {
    this.setStringProperty(name, String(value));
  }

  setBooleanProperty(name: string, value: boolean): void {
    this.setStringProperty(name, String(value));
  }

  addAttachmentAsString(id: string, content: string, contentType: string = 'text/plain'): void {
    this._message.addAttachmentAsString(id, content, contentType);
  }

  getCustomProperties(): Record<string, string> {
    return { ...this._customHeaders };
  }
}

/**
 * Simulated MessageLogFactory
 */
export class CpiMessageLogFactory {
  private logs: Map<CpiMessage, CpiMessageLog> = new Map();

  getMessageLog(message: CpiMessage): CpiMessageLog {
    if (!this.logs.has(message)) {
      this.logs.set(message, new CpiMessageLog(message));
    }
    return this.logs.get(message)!;
  }
}

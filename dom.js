/*
  dom.js
  DOM implementation for dia
  copyright (c) sporeball 2025
  with thanks to Raynos
  MIT license
*/

import { matchAllWithCapturingGroups } from './util.js';
import domWalk from 'dom-walk';

const SELF_CLOSING_TAGS = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'];

function serializeAttributes(attributes) {
  return Object.entries(attributes)
    .map(a => `${a[0]}="${a[1]}"`)
    .join(' ');
}

function deserializeAttributes(attributes) {
  let r = {};
  const matches = matchAllWithCapturingGroups(attributes, /([^ ]+?)="(.+?)"/gm, 'key', 'value');
  matches.forEach(match => {
    r[match.key] = match.value;
  });
  return r;
}

function serializeClassList(classList) {
  return `class="${classList._list.join(' ')}"`;
}

function serializeNode(node) {
  if (node instanceof DOMText) {
    return node.data
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  return serializeElement(node);
}

function serializeElement(element) {
  let parts = [];
  let tagName = element.tagName;
  let classList = element.classList;
  let attributes = element.attributes;
  parts.push(`<${tagName}`);
  if (classList.length > 0) {
    parts.push(` ${serializeClassList(classList)}`);
  }
  if (Object.entries(attributes).length > 0) {
    parts.push(` ${serializeAttributes(attributes)}`);
  }
  if (SELF_CLOSING_TAGS.includes(tagName)) {
    parts.push(' />');
  } else {
    parts.push('>');
    // TODO: the other cases?
    if (element.childNodes.length > 0) {
      parts.push.apply(parts, element.childNodes.map(serializeNode));
    }
    parts.push(`</${tagName}>`);
  }
  return parts.join('');
}

function deserializeString(string, ownerDocument) {
  let nodes = [];
  const matches = matchAllWithCapturingGroups(
    string,
    /([^<]+)|(<\/([^>]+?)>)|(<([^>]+?)( ([^>]+?))?(>| \/>))/gm,
    'textNodeRaw',
    'closingTagRaw', '_',
    'tagRaw', 'tagName', '_', 'tagAttributes', 'openingTagEnding',
  );
  let queue = [];
  for (const match of matches) {
    let node;
    if (match.closingTagRaw) {
      queue.pop();
      continue;
    } else if (match.textNodeRaw) {
      node = ownerDocument.createTextNode(match.textNodeRaw);
    } else {
      node = ownerDocument.createElement(match.tagName);
      const attributes = deserializeAttributes(match.tagAttributes);
      for (const [a_key, a_value] of Object.entries(attributes)) {
        if (a_key === 'class') {
          node.classList.add(a_value);
        } else {
          node.setAttribute(a_key, a_value);
        }
      }
    }
    if (queue.length > 0) {
      queue.at(-1).appendChild(node);
    } else {
      nodes.push(node);
    }
    if (match.openingTagEnding === '>') {
      queue.push(node);
    }
  }
  return nodes;
}

class ClassList {
  constructor(list = []) {
    this._list = list;
  }
  add(className) {
    if (!this.contains(className)) {
      this._list.push(className);
    }
  }
  contains(className) {
    return this._list.includes(className);
  }
  remove(className) {
    let index = this._list.indexOf(className);
    if (index > -1) {
      this._list.splice(index, 1);
    }
  }
  get length() {
    return this._list.length;
  }
}

class DOMText {
  constructor(data, ownerDocument) {
    this.data = data || '';
    this.length = this.data.length;
    this.ownerDocument = ownerDocument || null;
  }
}

class DOMElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName;
    this.classList = new ClassList;
    this.childNodes = [];
    this.parentNode = null;
    this.ownerDocument = ownerDocument || null;
    this.attributes = {};
  }
  appendChild(child) {
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    this.childNodes.push(child);
    child.parentNode = this;
    return child;
  }
  getAttribute(key) {
    return this.attributes[key];
  }
  getElementsByClassName(className) {
    let elements = [];
    domWalk(this.childNodes, node => {
      // TODO: order insensitive
      if (node.classList?.contains(className)) {
        elements.push(node);
      }
    });
    return elements;
  }
  getElementsByTagName(tagName) {
    let elements = [];
    domWalk(this.childNodes, node => {
      if (node.tagName === tagName) {
        elements.push(node);
      }
    });
    return elements;
  }
  insertBefore(newNode, referenceNode) {
    if (newNode.parentNode) {
      newNode.parentNode.removeChild(newNode);
    }
    const index = this.childNodes.findIndex(c => c === referenceNode);
    this.childNodes.splice(index, 0, newNode);
    return this.childNodes[index];
  }
  setAttribute(key, value) {
    this.attributes[key] = value;
  }
  toString() {
    return serializeNode(this);
  }
  get id() {
    return this.getAttribute('id');
  }
  set id(value) {
    this.setAttribute('id', value);
  }
  set innerHTML(value) {
    this.childNodes = deserializeString(value, this.ownerDocument);
  }
  get className() {
    return this.classList._list.join(' ');
  }
  set className(name) {
    this.classList = new ClassList(name.split(/\s+/g));
  }
}

export default class Document {
  constructor() {
    this.head = this.createElement('head');
    this.body = this.createElement('body');
    this.documentElement = this.createElement('html');
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    this.childNodes = [this.documentElement];
  }
  appendChild(child) {
    return this.documentElement.appendChild(child);
  }
  createElement(tagName) {
    return new DOMElement(tagName, this);
  }
  createTextNode(value) {
    return new DOMText(value, this);
  }
  getElementById(id) {
    let result = domWalk(this.childNodes, node => {
      if (node.id === id) {
        return node;
      }
    });
    return result || null;
  }
  getElementsByClassName(className) {
    return this.documentElement.getElementsByClassName(className);
  }
  getElementsByTagName(tagName) {
    return this.documentElement.getElementsByTagName(tagName);
  }
  insertBefore(newNode, referenceNode) {
    return this.documentElement.insertBefore(newNode, referenceNode);
  }
  querySelector(selector) {
    let result;
    if (selector.startsWith('#')) {
      result = this.getElementById(selector.slice(1));
    } else {
      result = this.querySelectorAll(selector)?.[0];
    }
    return result || null;
  }
  querySelectorAll(selector) {
    let result;
    if (selector.startsWith('#')) {
      result = this.getElementById(selector.slice(1));
    } else if (selector.startsWith('.')) {
      result = this.getElementsByClassName(selector.slice(1));
    } else {
      result = this.getElementsByTagName(selector);
    }
    return result || null;
  }
  toString() {
    return serializeNode(this.documentElement);
  }
}
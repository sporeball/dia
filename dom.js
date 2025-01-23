/*
  dom.js
  DOM implementation for dia
  copyright (c) sporeball 2025
  with thanks to Raynos
  MIT license
*/

import domWalk from 'dom-walk';

const SELF_CLOSING_TAGS = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'];

function serializeAttributes(attributes) {
  return Object.entries(attributes)
    .map(a => `${a[0]}="${a[1]}"`)
    .join(' ');
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
    parts.push('>');
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
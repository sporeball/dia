/*
  index.js
  dia core
  copyright (c) 2025 sporeball
  MIT license
*/

import Document from './dom.js';
import { fileStem, timestamp_hms, writeFile } from './util.js';
import { prettyPrint } from 'html';
import colors from 'picocolors';
import TOML from 'smol-toml';

const DIA_SLIDE_ELEMENTS = {text: 'p', img: 'img'};
const DIA_SLIDE_ELEMENT_ORDER = {
  'title': ['text-1', 'text-2'],
  'title-and-body': ['text-1', 'img-1', 'text-2'],
  'image': ['img-1', 'text-1'],
  'image-2x': ['img-1', 'img-2', 'text-1', 'text-2'],
  'image-3x': ['img-1', 'img-2', 'img-3', 'text-1', 'text-2', 'text-3'],
};
const DIA_IS_SLIDE_ELEMENT = tableName => {
  return Object.keys(DIA_SLIDE_ELEMENTS)
    .some(key => tableName.match(new RegExp(`^${key}-\\d+$`, 'gm')));
};
const DIA_FIND_SLIDE_ELEMENT = tableName => {
  return Object.entries(DIA_SLIDE_ELEMENTS)
    .find(entry => tableName.match(new RegExp(`^${entry[0]}-\\d+$`, 'gm')))
    [1];
};
const DIA_RESERVED = ['innerHTML', 'layout'];
const DIA_IS_RESERVED = tableName => DIA_RESERVED.includes(tableName);

let preconditions = {};
let rules = {};

/**
 * add a rule to the rules list
 * @param {string} tagName
 * @param {function} cb
 */
function addRule(tagName, cb) {
  rules[tagName] = cb;
}

/**
 * add a precondition to the preconditions list
 * @param {string} tagName
 * @param {function} cb
 */
function addPrecondition(tagName, cb) {
  preconditions[tagName] = { cb, completed: false };
}

/**
 * manipulate dia's DOM according to the rules list
 * @param {object} toml
 * @param {Document} document
 * @returns {Document}
 */
function followRules(toml, document) {
  console.log('following rules...');
  for (const [tableName, data] of Object.entries(toml)) {
    let rule = tableName.match(/^slide-\d+$/gm) ? rules.slide : rules[tableName];
    if (rule === undefined) {
      console.log(`  ${colors.yellow('!')} no rule found for table ${colors.cyan(`'${tableName}'`)}`);
      continue;
    }
    let precondition = tableName.match(/^slide-\d+$/gm) ? preconditions.slide : preconditions[tableName];
    if (precondition !== undefined && precondition.completed === false) {
      document = precondition.cb(tableName, data, document);
      precondition.completed = true;
    }
    document = rule(tableName, data, document);
  }
  return document;
}

addRule('head', function(tableName, data, document) {
  let title = document.createElement('title');
  let tn_title = document.createTextNode(data.title);
  title.appendChild(tn_title);
  document.head.appendChild(title);
  let charset = document.createElement('meta');
  charset.setAttribute('charset', 'utf-8');
  document.head.appendChild(charset);
  let viewport = document.createElement('meta');
  viewport.setAttribute('name', 'viewport');
  viewport.setAttribute('content', 'width=device-width');
  document.head.appendChild(viewport);
  let stylesheet = document.createElement('link');
  stylesheet.setAttribute('rel', 'stylesheet');
  stylesheet.setAttribute('href', 'dia.css');
  document.head.appendChild(stylesheet);
  return document;
});
addRule('variables', function(tableName, data, document) {
  let variables = Object.entries(data)
    .map(entry => `--${entry[0]}:${entry[1]}`);
  let style = document.createElement('style');
  let tn_style = document.createTextNode(`:root { ${variables.join('; ')} }`);
  style.appendChild(tn_style);
  document.insertBefore(style, document.body);
  return document;
});
addPrecondition('slide', function(tableName, data, document) {
  let dia_slides = document.createElement('div');
  dia_slides.id = 'dia-slides';
  document.body.appendChild(dia_slides);
  let script = document.createElement('script');
  script.setAttribute('src', 'dia.js');
  document.body.appendChild(script);
  return document;
});
addRule('slide', function(tableName, data, document) {
  let slide_elements = [];
  let div = document.createElement('div');
  div.id = `dia-${tableName}`;
  for (const [key, value] of Object.entries(data)) {
    if (key === 'class') {
      div.className = value;
    } else if (DIA_IS_SLIDE_ELEMENT(key)) {
      let slide_element = document.createElement(DIA_FIND_SLIDE_ELEMENT(key));
      slide_element.classList.add(`dia-${key}`);
      slide_elements.push(slide_element);
    } else if (!DIA_IS_RESERVED(key)) {
      div.setAttribute(key, value);
    }
  }
  div.classList.add('dia-slide');
  div.classList.add(`dia-layout-${data.layout}`);
  appendSlideElementsToDiv(slide_elements, div, data, document);
  document.getElementById('dia-slides').appendChild(div);
  return document;
});

function appendSlideElementsToDiv(slide_elements, div, data, document) {
  // console.log(data);
  const order = DIA_SLIDE_ELEMENT_ORDER[data.layout];
  // console.log('order:', order);
  // console.log('slide elements:', slide_elements);
  for (const key of order) {
    const slide_element = slide_elements.find(e => e.classList.contains(`dia-${key}`));
    if (typeof data[key] === 'string') {
      let tn = document.createTextNode(data[key]);
      slide_element.appendChild(tn);
    } else {
      for (const [a_key, a_value] of Object.entries(data[key])) {
        if (a_key === 'class') {
          slide_element.classList.add(a_value);
        } else if (a_key === 'innerHTML') {
          slide_element.innerHTML = a_value;
        } else if (!DIA_IS_RESERVED(a_key)) {
          slide_element.setAttribute(a_key, a_value);
        }
      }
    }
    div.appendChild(slide_element);
  }
}

// TODO: make better
function runPostcondition(document) {
  let dia_slides = document.getElementById('dia-slides');
  let dia_repo_link = document.createElement('p');
  dia_repo_link.id = 'dia-repo-link';
  let dia_repo_link_a = document.createElement('a');
  dia_repo_link_a.setAttribute('href', 'https://github.com/sporeball/dia');
  dia_repo_link_a.setAttribute('target', '_blank');
  let tn_dia_repo_link_a = document.createTextNode('dia');
  dia_repo_link_a.appendChild(tn_dia_repo_link_a);
  dia_repo_link.appendChild(dia_repo_link_a);
  dia_slides.appendChild(dia_repo_link);
  let dia_progress_container = document.createElement('div');
  dia_progress_container.id = 'dia-progress-container';
  let dia_progress = document.createElement('div');
  dia_progress.id = 'dia-progress';
  dia_progress_container.appendChild(dia_progress);
  dia_slides.appendChild(dia_progress_container);
  return document;
}

/**
 * generate a slide deck from dia code
 * @param {string} filename
 * @param {string} code
 */
export default function generateSlides (filename, code) {
  let stem = fileStem(filename);
  const toml = TOML.parse(code);
  let document = new Document;
  document = followRules(toml, document);
  document = runPostcondition(document);
  // console.log('document: vvv');
  // console.log(document);
  const html = String(document);
  // console.log('to string: vvv');
  // console.log(html);
  const pretty = prettyPrint(html, { indent_size: 2 });
  writeFile(`${stem}.html`, pretty);
  console.log(`  ${colors.green('o')} wrote slide deck to ${stem}.html (${timestamp_hms()})`);
}
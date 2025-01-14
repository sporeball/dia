import { fileStem, writeFile } from './util.js';

let rules = {};

let DIA_RULE_SIMPLE = function(tag, code) {
  return code.replaceAll(tag, tag.slice(4));
}

/**
 * add a rule to the rules list
 * @param {string} tag
 * @param {function} cb
 */
function addRule(tag, cb) {
  rules[tag] = cb;
}

/**
 * process dia code according to the rules list
 * @param {string} code
 * @returns {string}
 */
function followRules(code) {
  for (const [tag, cb] of Object.entries(rules)) {
    code = cb(tag, code);
  }
  return code;
}

addRule('dia-head', DIA_RULE_SIMPLE);
addRule('dia-title', DIA_RULE_SIMPLE);
addRule('dia-style', DIA_RULE_SIMPLE);

/**
 * generate a slide deck from dia code
 * @param {string} filename
 * @param {string} code
 */
export default function generateSlides (filename, code) {
  let stem = fileStem(filename);
  code = followRules(code);
  writeFile(`${stem}.html`, code);
}
import { fileStem, writeFile } from './util.js';
import stripIndent from 'strip-indent';

let rules = {};

let DIA_RULE_SIMPLE = function(tagName, code) {
  return code.replaceAll(tagName, tagName.slice(4));
}

function getMatchingTags(tagName, code) {
  const ex = getGlobalMatchingTagsExpression(tagName);
  return Array.from(code.matchAll(ex), match => {
    return {
      tag: match[0],
      attributes: match[1],
      content: match[2],
    };
  });
}

function getMatchingTagsCount(tagName, code) {
  return getMatchingTags(tagName, code).length;
}

function getMatchingTagsExpression(tagName) {
  return new RegExp(`<${tagName}([^<>]*)>(.*)</${tagName}>`);
}

function getGlobalMatchingTagsExpression(tagName) {
  return new RegExp(`<${tagName}([^<>]*)>(.*)</${tagName}>`, 'g');
}

function getFirstMatchingTag(tagName, code) {
  const matchingTags = getMatchingTags(tagName, code);
  return matchingTags[0];
}

function getLastMatchingTag(tagName, code) {
  const matchingTags = getMatchingTags(tagName, code);
  return matchingTags.at(-1);
}

function removeDuplicateTags(tagName, code) {
  const matchingTagsExpression = getMatchingTagsExpression(tagName);
  const matchingTagsCount = getMatchingTagsCount(tagName, code);
  for (let i = 0; i < matchingTagsCount; i++) {
    if (i == matchingTagsCount - 1) {
    } else {
      code = code.replace(matchingTagsExpression, '');
    }
  }
}

/**
 * add a rule to the rules list
 * @param {string} tagName
 * @param {function} cb
 */
function addRule(tagName, cb) {
  rules[tagName] = cb;
}

/**
 * process dia code according to the rules list
 * @param {string} code
 * @returns {string}
 */
function followRules(code) {
  for (const [tagName, cb] of Object.entries(rules)) {
    code = cb(tagName, code);
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
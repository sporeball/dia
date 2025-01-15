import { fileStem, writeFile } from './util.js';
import stripIndent from 'strip-indent';

let rules = {};

let DIA_RULE_SIMPLE = function(tagName, code) {
  return code.replaceAll(tagName, tagName.slice(4));
}

/**
 * get an array containing information about all tags with a certain name
 * @param {string} tagName
 * @param {string} code
 * @returns {object[]}
 */
function getMatchingTags(tagName, code) {
  const ex = getGlobalMatchingTagsExpression(tagName);
  return Array.from(code.matchAll(ex), match => {
    return {
      tag: stripIndent(match[0] || '').trim(),
      attributes: stripIndent(match[1] || '').trim(),
      content: stripIndent(match[2] || '').trim(),
    };
  });
}

/**
 * get the number of tags with a certain name
 * @param {string} tagName
 * @param {string} code
 * @returns {number}
 */
function getMatchingTagsCount(tagName, code) {
  return getMatchingTags(tagName, code).length;
}

/**
 * return a RegExp which can be used to search for the first tag with a certain name
 * @param {string} tagName
 * @returns {RegExp}
 */
function getMatchingTagsExpression(tagName) {
  return new RegExp(` *<${tagName}( [^<>]*)?>(.*?)</${tagName}>`, 's');
}

/**
 * return a RegExp which can be used to search for all tags with a certain name
 * @param {string} tagName
 * @returns {RegExp}
 */
function getGlobalMatchingTagsExpression(tagName) {
  return new RegExp(` *<${tagName}( [^<>]*)?>(.*?)</${tagName}>`, 'gs');
}

/**
 * keep only the last tag with a certain name
 * @param {string} tagName
 * @param {string} code
 * @returns {string}
 */
function removeDuplicateTags(tagName, code) {
  const matchingTagsExpression = getMatchingTagsExpression(tagName);
  const matchingTagsCount = getMatchingTagsCount(tagName, code);
  for (let i = 0; i < matchingTagsCount; i++) {
    if (i == matchingTagsCount - 1) {
    } else {
      code = code.replace(matchingTagsExpression, '');
    }
  }
  return code;
}

/**
 * adds all of the given attributes to the first matching tag without any
 * @param {string} tagName
 * @param {string[][]} entries
 * @param {string} code
 * @returns {string}
 */
function addAttributes(tagName, entries, code) {
  code = code.replace(`<${tagName}>`, `<${tagName} ${entries.map(entry => `${entry[0]}="${entry[1]}"`).join(' ')}>`);
  return code;
}

/**
 * remove all of the given attributes from the first tag
 * @param {object[]} attributes
 * @param {string} code
 * @returns {string}
 */
function removeAttributes(attributes, code) {
  for (const attribute of attributes) {
    code = code.replace(attribute.attribute, '');
  }
  code = code.replace(/ +>/, '>');
  return code;
}

/**
 * change the name of the first matching tag
 * @param {string} oldTagName
 * @param {string} newTagName
 * @param {string} code
 * @returns {string}
 */
function replaceTag(oldTagName, newTagName, code) {
  code = code.replace(`<${oldTagName}`, `<${newTagName}`);
  code = code.replace(`</${oldTagName}`, `</${newTagName}`);
  return code;
}

/**
 * takes an array of attribute objects and produces a class list
 * @param {object[]} attributeObjects
 * @returns {string}
 */
function createClassList(attributeObjects) {
  let classList = '';
  for (const attributeObject of attributeObjects) {
    if (attributeObject.key === 'class') {
      continue;
    }
    classList += ' ';
    classList += convertAttributeToClass(attributeObject);
  }
  const classAttributeObject = attributeObjects.find(a => a.key === 'class');
  if (classAttributeObject !== undefined) {
    classList += ' ';
    classList += classAttributeObject.value;
  }
  classList = classList.trim();
  return classList;
}

/**
 * takes an array of attribute objects and produces a class list, with the
 * given tag name as the first class
 * @param {string} tagName
 * @param {object[]} attributeObjects
 * @returns {string}
 */
function createClassListIncludingTagName(tagName, attributeObjects) {
  let classList = createClassList(attributeObjects);
  classList = `${tagName} ${classList}`;
  return classList;
}

/**
 * convert an attribute object into a class name
 * @param {object} attributeObject
 * @returns {SVGAnimatedString}
 */
function convertAttributeToClass(attributeObject) {
  if (attributeObject === undefined) {
    return '';
  }
  if (!attributeObject.key.startsWith('dia-')) {
    return '';
  }
  return `${attributeObject.key}-${attributeObject.value}`;
}

/**
 * create an array of entries
 * @param  {...any} args
 * @returns {any[][]}
 */
function createEntries(...args) {
  let entries = [];
  let entry = [];
  for (const arg of args) {
    entry.push(arg);
    if (entry.length === 2) {
      entries.push(entry);
      entry = [];
    }
  }
  return entries;
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
addRule('dia-slides', function(tagName, code) {
  code = removeDuplicateTags(tagName, code);
  code = replaceTag(tagName, 'div', code);
  code = addAttributes('div', createEntries('id', 'dia-slides'), code);
  return code;
});
addRule('dia-slide', function(tagName, code) {
  const matchingTags = getMatchingTags(tagName, code);
  const matchingTagsCount = getMatchingTagsCount(tagName, code);
  for (let i = 0; i < matchingTagsCount; i++) {
    let {tag, attributes, content} = matchingTags[i];
    let attributeObjects = Array.from(attributes.matchAll(/(.*?)="(.*?)"/g), match => {
      return {
        attribute: stripIndent(match[0] || '').trim(),
        key: stripIndent(match[1] || '').trim(),
        value: stripIndent(match[2] || '').trim(),
      };
    });
    const entries = createEntries(
      'id', `dia-slide-${i + 1}`,
      'class', createClassListIncludingTagName(tagName, attributeObjects),
    );
    code = replaceTag('dia-slide', 'div', code);
    code = removeAttributes(attributeObjects, code);
    code = addAttributes('div', entries, code);
  }
  return code;
});

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
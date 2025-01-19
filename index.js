import { fileStem, timestamp_hms, writeFile } from './util.js';
import { prettyPrint } from 'html';
import indentString from 'indent-string';
import colors from 'picocolors';
import stripIndent from 'strip-indent';

let rules = {};

const DIA_RULE_SIMPLE = function(tagName, code) {
  return code.replaceAll(tagName, tagName.slice(4));
}

const AO_IS_VANILLA = ao => !ao.key.startsWith('dia-');

function matchWithCapturingGroups(value, ex, ...groups) {
  return matchAllWithCapturingGroups(value, ex, ...groups)[0];
}

function matchAllWithCapturingGroups(value, ex, ...groups) {
  return Array.from(value.matchAll(ex), match => {
    let object = {};
    let i = 0;
    object.raw = (match[0] || '').trim();
    for (const group of groups) {
      if (group === '_') {
        i++;
        continue;
      }
      object[group] = (match[i + 1] || '').trim();
      i++;
    }
    return object;
  });
}

/**
 * get an array containing information about all tags with a certain name
 * @param {string} tagName
 * @param {string} code
 * @returns {object[]}
 */
function getMatchingTags(tagName, code) {
  const ex = getGlobalMatchingTagsExpression(tagName);
  return matchAllWithCapturingGroups(code, ex, 'attributes', '_', 'self_closing', 'content');
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
  return new RegExp(` *<${tagName}( [^<>]*)?((/>)|>(.*?)</${tagName}>)`, 's');
}

/**
 * return a RegExp which can be used to search for all tags with a certain name
 * @param {string} tagName
 * @returns {RegExp}
 */
function getGlobalMatchingTagsExpression(tagName) {
  return new RegExp(` *<${tagName}( [^<>]*)?((/>)|>(.*?)</${tagName}>)`, 'gs');
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
 * @param {string} code
 * @param {...string} args
 * @returns {string}
 */
function addAttributes(tagName, code, ...args) {
  let unique = [];
  const exTag = new RegExp(`<${tagName}( />|>)`, 'gs');
  for (const arg of args) {
    const capturingGroups = matchWithCapturingGroups(arg, /(.*?)="(.*?)"/g, 'key', 'value');
    if (unique.find(o => o.key === capturingGroups.key) === undefined) {
      unique.push(capturingGroups);
    }
  }
  code = code.replace(exTag, `<${tagName} ${unique.map(o => o.raw).join(' ')}>`);
  return code;
}

/**
 * convert an attribute object into a class name
 * @param {object} attributeObject
 * @returns {string}
 */
function convertAttributeObjectToClass(attributeObject) {
  if (attributeObject === undefined) {
    return '';
  }
  if (!attributeObject.key.startsWith('dia-')) {
    return '';
  }
  return `${attributeObject.key}-${attributeObject.value}`;
}

/**
 * change the name of the first matching tag, and remove all of its attributes
 * @param {string} oldTagName
 * @param {string} newTagName
 * @param {string} code
 * @returns {string}
 */
function replaceTag(oldTagName, newTagName, code) {
  const matchingTag = getMatchingTags(oldTagName, code)[0];
  let openingTag;
  if (matchingTag.self_closing === '/>') {
    openingTag = matchingTag.attributes === '' ? `<${oldTagName} />` : `<${oldTagName} ${matchingTag.attributes} />`;
  } else {
    openingTag = matchingTag.attributes === '' ? `<${oldTagName}>` : `<${oldTagName} ${matchingTag.attributes}>`;
  }
  code = code.replace(openingTag, `<${newTagName}>`);
  code = code.replace(`</${oldTagName}>`, `</${newTagName}>`);
  return code;
}

function addChildTag(tagName, childTag, code) {
  const matchingTag = getMatchingTags(tagName, code)[0];
  const newContent = `${matchingTag.content}\n${childTag}`;
  const openingParentTag = matchingTag.attributes === '' ? `<${tagName}>` : `<${tagName} ${matchingTag.attributes}>`;
  code = code.replace(matchingTag.raw, `${openingParentTag}\n${newContent}\n</${tagName}>`)
  return code;
}

function surroundTag(tagName, surroundingTagName, code) {
  const matchingTag = getMatchingTags(tagName, code)[0];
  code = code.replace(matchingTag.raw, `<${surroundingTagName}>\n${matchingTag.raw}\n</${surroundingTagName}>`);
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
    classList += convertAttributeObjectToClass(attributeObject);
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
  classList = classList.trim();
  return classList;
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
 * add three rules for a certain type of element to the rules list at once
 * @param {string} tagName
 * @param {string} code
 * @returns {string}
 */
function addTripleRule(tagName, cb) {
  addRule(`${tagName}-first`, cb);
  addRule(`${tagName}-second`, cb);
  addRule(`${tagName}-third`, cb);
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

addRule('dia-head', function(tagName, code) {
  code = removeDuplicateTags(tagName, code);
  code = replaceTag(tagName, 'head', code);
  code = addChildTag('head', '<meta charset="utf-8">', code);
  code = addChildTag('head', '<meta name="viewport" content="width=device-width">', code);
  code = addChildTag('head', '<link rel="stylesheet" href="dia.css">', code);
  return code;
});
addRule('dia-slides', function(tagName, code) {
  code = removeDuplicateTags(tagName, code);
  code = surroundTag(tagName, 'body', code);
  code = replaceTag(tagName, 'div', code);
  code = addAttributes('div', code, 'id="dia-slides"');
  return code;
});
addRule('dia-slide', function(tagName, code) {
  const matchingTags = getMatchingTags(tagName, code);
  for (let i = 0; i < matchingTags.length; i++) {
    let {raw, attributes, content} = matchingTags[i];
    let attributeObjects = matchAllWithCapturingGroups(attributes, /(.*?)="(.*?)"/g, 'key', 'value');
    code = replaceTag(tagName, 'div', code);
    code = addAttributes(
      'div',
      code,
      `id="dia-slide-${i + 1}"`,
      `class="${createClassListIncludingTagName(tagName, attributeObjects)}"`,
      ...attributeObjects.filter(AO_IS_VANILLA).map(a => a.raw),
    );
  }
  return code;
});
addTripleRule('dia-text', function(tagName, code) {
  const matchingTags = getMatchingTags(tagName, code);
  for (let i = 0; i < matchingTags.length; i++) {
    let {tag, attributes, content} = matchingTags[i];
    let attributeObjects = matchAllWithCapturingGroups(attributes, /(.*?)="(.*?)"/g, 'key', 'value');
    code = replaceTag(tagName, 'p', code);
    code = addAttributes(
      'p',
      code,
      `class="${createClassListIncludingTagName(tagName, attributeObjects)}"`,
      ...attributeObjects.filter(AO_IS_VANILLA).map(a => a.raw),
    );
  }
  return code;
});
addTripleRule('dia-img', function(tagName, code) {
  const matchingTags = getMatchingTags(tagName, code);
  for (let i = 0; i < matchingTags.length; i++) {
    let {tag, attributes, content} = matchingTags[i];
    let attributeObjects = matchAllWithCapturingGroups(attributes, /(.*?)="(.*?)"/g, 'key', 'value');
    code = replaceTag(tagName, 'img', code);
    code = addAttributes(
      'img',
      code,
      `class="${createClassListIncludingTagName(tagName, attributeObjects)}"`,
      ...attributeObjects.filter(AO_IS_VANILLA).map(a => a.raw),
    );
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
  code = `<html>\n${code}\n</html>`;
  code = addChildTag('dia-slides', '<p id="dia-repo-link"><a href="https://github.com/sporeball/dia" target="_blank">dia</a></p>', code);
  code = addChildTag('dia-slides', '<div id="dia-progress-container"><div id="dia-progress"></div></div>', code);
  code = followRules(code);
  code = addChildTag('html', '<script src="dia.js"></script>', code);
  code = prettyPrint(code, { indent_size: 2 });
  writeFile(`${stem}.html`, code);
  console.log(`  ${colors.green('o')} wrote slide deck to ${stem}.html (${timestamp_hms()})`);
}
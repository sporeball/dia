import { fileStem, writeFile } from './util.js';

/**
 * generate a slide deck from dia code
 * @param {string} filename
 * @param {string} code
 */
export default function generateSlides (filename, code) {
  let stem = fileStem(filename);
  writeFile(`${stem}.html`, code);
}
#!/usr/bin/env node

import generateSlides from './index.js';
import { fileStem, readDiaFile } from './util.js';
import process from 'node:process';
import colors from 'picocolors';

function cli () {
  let filename = process.argv[2];
  let stem = fileStem(filename);
  console.log(`dia ${colors.cyan('(https://github.com/sporeball/dia)')}`);
  generateSlides(filename, readDiaFile(filename));
  console.log(`  ${colors.green('o')} wrote slide deck to ${stem}.html`);
}

try {
  cli();
} catch (e) {
  console.log(`  ${colors.red('X')} error: ${e.message}`);
}
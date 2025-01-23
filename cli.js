#!/usr/bin/env node

/*
  cli.js
  dia CLI
  copyright (c) 2025 sporeball
  MIT license
*/

import generateSlides from './index.js';
import { fileStem, readDiaFile, watchFile } from './util.js';
import process from 'node:process';
import colors from 'picocolors';

function cli () {
  let filename = process.argv[2];
  let watch = process.argv.includes('--watch');
  let stem = fileStem(filename);
  console.log(`dia ${colors.cyan('(https://github.com/sporeball/dia)')}`);
  if (watch) {
    watchFile(filename, generateSlides, filename, readDiaFile(filename));
  } else {
    generateSlides(filename, readDiaFile(filename));
  }
}

try {
  cli();
} catch (e) {
  console.log(`  ${colors.red('X')} error: ${e.stack}`);
}
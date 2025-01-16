#!/usr/bin/env node

import generateSlides from './index.js';
import { fileStem, readDiaFile } from './util.js';
import fs from 'node:fs';
import process from 'node:process';
import colors from 'picocolors';

function cli () {
  let filename = process.argv[2];
  let watch = process.argv.includes('--watch');
  let stem = fileStem(filename);
  console.log(`dia ${colors.cyan('(https://github.com/sporeball/dia)')}`);
  if (watch) {
    fs.watch(filename, (eventType, filename) => {
      if (eventType === 'change') {
        generateSlides(filename, readDiaFile(filename));
        const time = (new Date).toLocaleTimeString(
          [],
          {hour: 'numeric', minute: 'numeric', second: 'numeric'}
        )
          .replace(' AM', '')
          .replace(' PM', '');
        console.log(`  ${colors.green('o')} wrote slide deck to ${stem}.html (${time})`);
      }
    });
  } else {
    generateSlides(filename, readDiaFile(filename));
    console.log(`  ${colors.green('o')} wrote slide deck to ${stem}.html`);
  }
}

try {
  cli();
} catch (e) {
  console.log(`  ${colors.red('X')} error: ${e.message}`);
}
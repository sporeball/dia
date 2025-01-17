import fs from 'node:fs';

export function fileStem (filename) {
  return filename.slice(0, filename.lastIndexOf('.'));
}

export function readDiaFile (filename) {
  let contents;
  if (filename === undefined) {
    throw new Error('no file given');
  }
  if (!filename.endsWith('.dia')) {
    throw new Error('not a .dia file');
  }
  try {
    contents = fs.readFileSync(filename, { encoding: 'utf-8' });
  } catch (e) {
    throw new Error('file not found');
  }
  return contents;
}

export function timestamp_hms() {
  return (new Date).toLocaleTimeString(
    [],
    {hour: 'numeric', minute: 'numeric', second: 'numeric'}
  )
    .replace(' AM', '')
    .replace(' PM', '');
}

export function watchFile(filename, cb, ...args) {
  fs.watch(filename, (e, f) => {
    if (e === 'change') {
      cb(...args);
    }
  });
}

export function writeFile (filename, contents) {
  fs.writeFileSync(filename, contents);
}
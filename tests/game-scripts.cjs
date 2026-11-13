const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const scripts = Array.from(html.matchAll(/<script defer src="([^"]+)"><\/script>/g),
  ([, source]) => {
    const file = source.split('?')[0];
    return new vm.Script(read(file), { filename: file });
  });

function runGameScripts(context) {
  for (const script of scripts) script.runInContext(context);
}

module.exports = { read, scripts, runGameScripts };

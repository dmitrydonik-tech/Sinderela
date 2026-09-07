// tools/bump-iconver.mjs — поднять ICONVER в index.html и пересобрать манифест иконок.
// Запускать ПОСЛЕ любой замены PNG в assets/icons/. node tools/bump-iconver.mjs
import { readFileSync, writeFileSync, readdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ROOT = new URL('../', import.meta.url);
const HTML = new URL('index.html', ROOT);
const ICONS = new URL('assets/icons/', ROOT);

let s = readFileSync(HTML, 'utf8');
const m = s.match(/var ICONVER="(\d+)"/);
if (!m) throw new Error('ICONVER не найден в index.html');
const cur = +m[1], next = cur + 1;

copyFileSync(HTML, new URL(`index-BACKUP-iconver-${Date.now()}.html`, ROOT));
s = s.replace(/var ICONVER="\d+"/, `var ICONVER="${next}"`);
writeFileSync(HTML, s);

const files = readdirSync(ICONS).filter(f => f.toLowerCase().endsWith('.png')).sort();
const hashes = {};
for (const f of files) hashes[f] = createHash('md5').update(readFileSync(new URL(f, ICONS))).digest('hex').slice(0, 12);
writeFileSync(new URL('.iconver.json', ICONS), JSON.stringify({ ver: next, hashes }, null, 0));

console.log(`ICONVER ${cur} -> ${next}; манифест обновлён (${files.length} иконок). Бэкап index.html сделан.`);

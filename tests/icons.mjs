// tests/icons.mjs — страж ICONVER. Падает, если иконки менялись, а ICONVER не подняли.
// Чистый node, браузер не нужен. Запуск: node tests/icons.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const HTML = new URL('../index.html', import.meta.url);
const ICONS = new URL('../assets/icons/', import.meta.url);
const MAN = new URL('.iconver.json', ICONS);

const html = readFileSync(HTML, 'utf8');
const m = html.match(/var ICONVER="(\d+)"/);
if (!m) { console.log('❌ icons: не найден var ICONVER в index.html'); process.exit(1); }
const ver = +m[1];

const files = readdirSync(ICONS).filter(f => f.toLowerCase().endsWith('.png')).sort();
const hashes = {};
for (const f of files) hashes[f] = createHash('md5').update(readFileSync(new URL(f, ICONS))).digest('hex').slice(0, 12);

function save(v) { writeFileSync(MAN, JSON.stringify({ ver: v, hashes }, null, 0)); }

if (!existsSync(MAN)) {
  save(ver);
  console.log(`✅ icons: baseline создан (ICONVER=${ver}, ${files.length} иконок). Закоммить assets/icons/.iconver.json`);
  process.exit(0);
}

const man = JSON.parse(readFileSync(MAN, 'utf8'));
const changed = [];
const all = new Set([...Object.keys(man.hashes || {}), ...Object.keys(hashes)]);
for (const f of all) if ((man.hashes || {})[f] !== hashes[f]) changed.push(f);
const iconsChanged = changed.length > 0;
const verChanged = man.ver !== ver;

if (iconsChanged && !verChanged) {
  console.log('❌ icons: иконки менялись, а ICONVER НЕ подняли — у клиента будет старая из кэша.');
  console.log('   изменены:', changed.slice(0, 12).join(', ') + (changed.length > 12 ? ` …(+${changed.length - 12})` : ''));
  console.log('   → запусти: node tools/bump-iconver.mjs  (поднимет ICONVER и обновит манифест)');
  process.exit(1);
}

// иконки+вер поменялись согласованно, либо ничего не менялось → принять текущее состояние
if (iconsChanged || verChanged) save(ver);
console.log(`✅ icons: ок (ICONVER=${ver}, ${files.length} иконок${iconsChanged ? ', изменения приняты' : ''})`);
process.exit(0);

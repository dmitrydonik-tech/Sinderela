// tests/langs.mjs — три языковые версии не разъехались.
//
// Файлы ro/index.html и en/index.html — ПРОИЗВОДНЫЕ от index.html, их собирает
// tools/build-langs.mjs. Тест прогоняет ту же трансформацию заново и сверяет результат
// с тем, что лежит на диске, побайтно. Это ловит сразу два промаха:
//   1) правили index.html и забыли пересобрать версии;
//   2) правили ro/ или en/ руками (они перезапишутся при следующей сборке).
//
// Запуск: node tests/langs.mjs   (браузер не нужен, это чистое сравнение текста)

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildLang, LANGS, ROOT, expectedHreflang } from '../tools/build-langs.mjs';

const results = [];
const eq = (name, got, exp) => results.push({ name, ok: JSON.stringify(got) === JSON.stringify(exp), got, exp });
const ok = (name, cond, detail) => results.push({ name, ok: !!cond, got: detail, exp: 'ok' });

const src = readFileSync(join(ROOT, 'index.html'), 'utf8');

// ---------- 1) версии собраны из текущего index.html ----------
for (const lang of Object.keys(LANGS)) {
  if (lang === 'ru') continue;
  const file = join(ROOT, LANGS[lang].path);
  if (!existsSync(file)) { ok(`${LANGS[lang].path} существует`, false, 'файла нет — запусти node tools/build-langs.mjs'); continue; }
  const want = buildLang(src, lang);
  const have = readFileSync(file, 'utf8');
  ok(`${LANGS[lang].path} собран из текущего index.html`, want === have,
     want === have ? 'совпадает' : `РАСХОДИТСЯ (${have.length} симв. на диске против ${want.length} ожидаемых) — запусти node tools/build-langs.mjs`);
}

// ---------- 2) hreflang: одинаковый набор во всех версиях, все три + x-default ----------
const wantHref = expectedHreflang();
for (const lang of Object.keys(LANGS)) {
  const file = join(ROOT, LANGS[lang].path);
  if (!existsSync(file)) continue;
  const h = readFileSync(file, 'utf8');
  const got = (h.match(/<link rel="alternate" hreflang="[^"]*" href="[^"]*">/g) || []).join('\n');
  eq(`${LANGS[lang].path}: набор hreflang полный и одинаковый`, got, wantHref);
}

// ---------- 3) canonical каждой версии указывает на СЕБЯ ----------
for (const lang of Object.keys(LANGS)) {
  const file = join(ROOT, LANGS[lang].path);
  if (!existsSync(file)) continue;
  const h = readFileSync(file, 'utf8');
  const can = (h.match(/<link rel="canonical" href="([^"]*)">/) || [])[1];
  const ogu = (h.match(/<meta property="og:url" content="([^"]*)">/) || [])[1];
  eq(`${LANGS[lang].path}: canonical = ${LANGS[lang].url}`, can, LANGS[lang].url);
  eq(`${LANGS[lang].path}: og:url = ${LANGS[lang].url}`, ogu, LANGS[lang].url);
}

// ---------- 4) язык страницы и заголовки ----------
for (const lang of Object.keys(LANGS)) {
  const file = join(ROOT, LANGS[lang].path);
  if (!existsSync(file)) continue;
  const h = readFileSync(file, 'utf8');
  eq(`${LANGS[lang].path}: <html lang>`, (h.match(/<html lang="([^"]*)">/) || [])[1], LANGS[lang].htmlLang);
  eq(`${LANGS[lang].path}: PAGE_LANG`, (h.match(/var PAGE_LANG="([^"]*)";/) || [])[1], lang);
  const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const desc = (h.match(/<meta name="description" content="([^"]*)">/) || [])[1] || '';
  ok(`${LANGS[lang].path}: title 25–70 символов`, title.length >= 25 && title.length <= 70, title.length);
  ok(`${LANGS[lang].path}: description 100–170 символов`, desc.length >= 100 && desc.length <= 170, desc.length);
}

// ---------- 5) у версий в подпапках нет ссылок «наверх мимо корня» ----------
for (const lang of ['ro', 'en']) {
  const file = join(ROOT, LANGS[lang].path);
  if (!existsSync(file)) continue;
  const h = readFileSync(file, 'utf8');
  ok(`${LANGS[lang].path}: относительных "assets/ не осталось`, !/"assets\//.test(h) && !/url\(assets\//.test(h), 'нет');
  ok(`${LANGS[lang].path}: ссылки ведут на ../assets/`, /"\.\.\/assets\//.test(h) && /url\(\.\.\/assets\//.test(h), 'есть');
  ok(`${LANGS[lang].path}: privacy.html на уровень выше`, /href="\.\.\/privacy\.html/.test(h) && !/href="privacy\.html/.test(h), 'есть');
  // абсолютные ссылки на свой домен трогать было нельзя
  ok(`${LANGS[lang].path}: абсолютные https://sinderela.md/assets/ целы`, (h.match(/https:\/\/sinderela\.md\/assets\//g) || []).length === (src.match(/https:\/\/sinderela\.md\/assets\//g) || []).length, 'целы');
}

// ---------- 5-бис) переключатель считает адрес от текущего пути ----------
// Жёсткое LANG_URL={ru:"/",…} работало бы только на sinderela.md: на staging
// github.io/Sinderela/ оно уводило на github.io/ro/ (404). Проверено живьём 23.09.2026.
for (const lang of Object.keys(LANGS)) {
  const file = join(ROOT, LANGS[lang].path);
  if (!existsSync(file)) continue;
  const h = readFileSync(file, 'utf8');
  ok(`${LANGS[lang].path}: адрес версии считается от location.pathname`, /function langHref\(l\)/.test(h) && /location\.pathname/.test(h), 'есть');
  ok(`${LANGS[lang].path}: нет жёсткой карты LANG_URL`, !/LANG_URL/.test(h), 'нет');
}

// ---------- 6) sitemap перечисляет все три версии ----------
const sm = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
for (const lang of Object.keys(LANGS)) {
  ok(`sitemap.xml содержит ${LANGS[lang].url}`, sm.includes(`<loc>${LANGS[lang].url}</loc>`), 'есть');
}
eq('sitemap.xml: по 4 альтернативы у каждой из 3 записей', (sm.match(/xhtml:link/g) || []).length, 12);

// ---------- итог ----------
const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);
for (const f of failed) console.log('❌', f.name, '\n   получено:', JSON.stringify(f.got), '\n   ожидалось:', JSON.stringify(f.exp));
console.log(`\n${failed.length ? '❌' : '✅'} langs: пройдено ${passed}/${results.length}`);
process.exit(failed.length ? 1 : 0);

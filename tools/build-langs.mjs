// tools/build-langs.mjs — генерирует /ro/index.html и /en/index.html из index.html.
//
// ЗАЧЕМ. До сентября 2026 все три языка жили на одном адресе и переключались скриптом.
// Для поиска это одна русская страница: румынской и английской версии не существовало,
// хотя на старом сайте они были (17 страниц с корректным hreflang). Теперь у каждой
// версии свой URL, а источник правды остаётся один — этот файл собирает остальные два.
//
// ПРИНЦИП. Правится ТОЛЬКО index.html. Файлы ro/index.html и en/index.html — производные,
// руками их не трогать: следующая сборка перезапишет. Что версии не разъехались,
// стережёт tests/langs.mjs — он прогоняет ту же трансформацию и сверяет побайтно.
//
// Запуск: node tools/build-langs.mjs        (из корня проекта)
//         node tools/build-langs.mjs --check  — не писать, только сказать, совпадает ли

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SITE = 'https://sinderela.md';

// Пути версий. Ключ = код языка, path = куда пишем, url = канонический адрес.
export const LANGS = {
  ru: { path: 'index.html',    url: SITE + '/',    htmlLang: 'ru', ogLocale: 'ru_RU' },
  ro: { path: 'ro/index.html', url: SITE + '/ro/', htmlLang: 'ro', ogLocale: 'ro_RO' },
  en: { path: 'en/index.html', url: SITE + '/en/', htmlLang: 'en', ogLocale: 'en_US' },
};

// Мета-тексты головы страницы. Единственное место, где они живут для ro/en.
// Терминология взята из словарей i18n в index.html, чтобы совпадала с текстом на странице
// («Curățătorie chimică», «curier», «Chișinău»). Длины выдержаны под требования check-site:
// title 25–70 символов, description 100–170.
export const META = {
  ru: null, // русская версия — как в index.html, ничего не подменяем
  ro: {
    title: 'Sinderela — curățătorie chimică premium în Chișinău. Curier gratuit',
    description: 'Curățătoria chimică Sinderela în Chișinău din 1997. Echipamente din Italia și Germania. Calculați prețul online și chemați curierul — livrare gratuită.',
    ogTitle: 'Sinderela — curățătorie chimică premium în Chișinău. Curier gratuit',
    ogDescription: 'Curățătorie chimică premium din 1997. Calculați prețul online și chemați curierul — livrare gratuită cu curierul.',
    twTitle: 'Sinderela — curățătorie chimică premium în Chișinău',
    twDescription: 'Curățătorie chimică premium din 1997. Calculați prețul online și chemați curierul.',
    ogImageAlt: 'Sinderela — curățătorie chimică premium în Chișinău din 1997',
    twImageAlt: 'Sinderela — curățătorie chimică premium în Chișinău',
  },
  en: {
    title: 'Sinderela — premium dry cleaning in Chișinău. The courier comes to you',
    description: 'Sinderela dry cleaning in Chișinău since 1997. Equipment from Italy and Germany. Calculate the price online and call a courier — free courier delivery.',
    ogTitle: 'Sinderela — premium dry cleaning in Chișinău. The courier comes to you',
    ogDescription: 'Premium dry cleaning since 1997. Calculate the price online and call a courier — free courier delivery.',
    twTitle: 'Sinderela — premium dry cleaning in Chișinău',
    twDescription: 'Premium dry cleaning since 1997. Calculate the price online and call a courier.',
    ogImageAlt: 'Sinderela — premium dry cleaning in Chișinău since 1997',
    twImageAlt: 'Sinderela — premium dry cleaning in Chișinău',
  },
};

// Заменяет ровно одно вхождение. Если шаблон не найден или найден дважды — падаем:
// значит index.html изменился так, что сборка больше не понимает его структуру,
// и молча выдать половинчатый результат хуже, чем остановиться.
const one = (s, re, to, what) => {
  const m = s.match(re);
  if (!m) throw new Error(`build-langs: не найдено «${what}» — index.html изменился, проверь шаблон`);
  const all = s.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'));
  if (all.length !== 1) throw new Error(`build-langs: «${what}» встречается ${all.length} раз, ожидался 1`);
  return s.replace(re, to);
};

const esc = (v) => String(v).replace(/\$/g, '$$$$'); // $ в замене — служебный символ

/** Собирает версию языка `lang` из исходного html (русского index.html). */
export function buildLang(src, lang) {
  const L = LANGS[lang];
  if (!L) throw new Error('build-langs: неизвестный язык ' + lang);
  if (lang === 'ru') return src; // русская версия и есть источник
  const M = META[lang];
  let s = src;

  s = one(s, /<html lang="ru">/, `<html lang="${L.htmlLang}">`, '<html lang>');
  s = one(s, /var PAGE_LANG="ru";\/\*BUILD:PAGE_LANG\*\//, `var PAGE_LANG="${lang}";/*BUILD:PAGE_LANG*/`, 'PAGE_LANG');
  s = one(s, /<link rel="canonical" href="https:\/\/sinderela\.md\/">/, `<link rel="canonical" href="${L.url}">`, 'canonical');
  s = one(s, /<meta property="og:url" content="https:\/\/sinderela\.md\/">/, `<meta property="og:url" content="${L.url}">`, 'og:url');
  s = one(s, /<meta property="og:locale" content="ru_RU">/, `<meta property="og:locale" content="${L.ogLocale}">`, 'og:locale');

  // og:locale:alternate — две другие версии, не своя
  const alts = Object.keys(LANGS).filter((k) => k !== lang).map((k) => `<meta property="og:locale:alternate" content="${LANGS[k].ogLocale}">`).join('\n');
  s = one(s, /<meta property="og:locale:alternate" content="ro_RO">\n<meta property="og:locale:alternate" content="en_US">/, esc(alts), 'og:locale:alternate');

  s = one(s, /<title>[^<]*<\/title>/, `<title>${esc(M.title)}</title>`, '<title>');
  s = one(s, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(M.description)}">`, 'description');
  s = one(s, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(M.ogTitle)}">`, 'og:title');
  s = one(s, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(M.ogDescription)}">`, 'og:description');
  s = one(s, /<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${esc(M.twTitle)}">`, 'twitter:title');
  s = one(s, /<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${esc(M.twDescription)}">`, 'twitter:description');
  s = one(s, /<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${esc(M.ogImageAlt)}">`, 'og:image:alt');
  s = one(s, /<meta name="twitter:image:alt" content="[^"]*">/, `<meta name="twitter:image:alt" content="${esc(M.twImageAlt)}">`, 'twitter:image:alt');

  // Версии ro/en лежат в подпапке, поэтому относительные ссылки надо поднять на уровень выше.
  // Абсолютные (https://sinderela.md/assets/… в og:image и JSON-LD) при этом не трогаются:
  // они не начинаются с кавычки, и шаблон "assets/ в них не попадает.
  const before = { q: (s.match(/"assets\//g) || []).length, u: (s.match(/url\(assets\//g) || []).length, p: (s.match(/href="privacy\.html/g) || []).length };
  if (!before.q || !before.u || !before.p) throw new Error('build-langs: не нашёл относительные ссылки на assets/privacy — проверь шаблон');
  s = s.replace(/"assets\//g, '"../assets/').replace(/url\(assets\//g, 'url(../assets/').replace(/href="privacy\.html/g, 'href="../privacy.html');
  const after = { q: (s.match(/"\.\.\/assets\//g) || []).length, u: (s.match(/url\(\.\.\/assets\//g) || []).length, p: (s.match(/href="\.\.\/privacy\.html/g) || []).length };
  if (after.q !== before.q || after.u !== before.u || after.p !== before.p) throw new Error('build-langs: часть ссылок не переписалась');
  if (/"assets\//.test(s) || /url\(assets\//.test(s)) throw new Error('build-langs: остались относительные ссылки на assets/');

  // Пометка в начале файла: чтобы никто не правил производный файл руками.
  s = s.replace(/^<!DOCTYPE html>\n/, `<!DOCTYPE html>\n<!-- СГЕНЕРИРОВАНО tools/build-langs.mjs из index.html. Руками не править: перезапишется. -->\n`);
  return s;
}

/** Ссылки hreflang должны быть одинаковыми во всех версиях и перечислять все три + x-default. */
export function expectedHreflang() {
  return Object.keys(LANGS).map((k) => `<link rel="alternate" hreflang="${k}" href="${LANGS[k].url}">`)
    .concat(`<link rel="alternate" hreflang="x-default" href="${LANGS.ru.url}">`).join('\n');
}

// ---------- запуск как скрипта ----------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const src = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const check = process.argv.includes('--check');
  let diff = 0;
  for (const lang of Object.keys(LANGS)) {
    if (lang === 'ru') continue;
    const out = buildLang(src, lang);
    const file = join(ROOT, LANGS[lang].path);
    const same = existsSync(file) && readFileSync(file, 'utf8') === out;
    if (check) {
      console.log(same ? `✅ ${LANGS[lang].path} — совпадает` : `❌ ${LANGS[lang].path} — РАСХОДИТСЯ, нужен пересбор`);
      if (!same) diff++;
    } else {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, out);
      console.log(`${same ? '=' : '+'} ${LANGS[lang].path} (${(Buffer.byteLength(out) / 1024).toFixed(0)} КБ)`);
    }
  }
  if (check && diff) process.exit(1);
}

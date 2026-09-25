// tests/i18n.mjs — полнота переводов. Все data-i18n(-html/-aria/-ph/-alt) ключи должны быть заполнены в RU/RO/EN.
// Запуск: PW=<...> CHROME_PATH=<...> LD_LIBRARY_PATH=<...> node tests/i18n.mjs   (в CI — просто node tests/i18n.mjs)
import { existsSync } from 'node:fs';
const _pw = await import(process.env.PW || 'playwright-core');
const chromium = _pw.chromium || (_pw.default && _pw.default.chromium);
// Путь к браузеру: явный CHROME_PATH → старая песочница (Linux) → системный Chrome на Mac.
// Раньше был только линуксовый путь, и на Mac тест падал без ручной настройки.
const CHROME = process.env.CHROME_PATH || [
  "/sessions/awesome-ecstatic-tesla/.cache/ms-playwright/chromium-1228/chrome-linux/chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find(p => { try { return existsSync(p); } catch { return false; } }) || "";

const launchOpts = { args: ['--no-sandbox', '--disable-dev-shm-usage'] };
try { if (existsSync(CHROME)) launchOpts.executablePath = CHROME; } catch {}
const b = await chromium.launch(launchOpts);
const p = await b.newPage();
await p.goto(new URL('../index.html', import.meta.url).href);
await p.waitForTimeout(300);

const r = await p.evaluate(() => {
  // Полный список переводимых атрибутов — должен совпадать с applyLang() в index.html.
  // Добавляешь туда новый data-i18n-* — добавь и сюда, иначе его ключи не проверяются на полноту
  // и попадают в «неиспользуемые» (так было с data-i18n-alt до 23.09.2026).
  const attrs = ['data-i18n', 'data-i18n-html', 'data-i18n-aria', 'data-i18n-ph', 'data-i18n-alt'];
  const used = new Set();
  attrs.forEach(a => document.querySelectorAll('[' + a + ']').forEach(el => { const k = el.getAttribute(a); if (k) used.add(k); }));
  const langs = Object.keys(I18N);
  const report = {};
  langs.forEach(l => {
    const miss = [];
    used.forEach(k => { const v = I18N[l] ? I18N[l][k] : undefined; if (v == null || v === '') miss.push(k); });
    report[l] = miss;
  });
  const base = I18N.ru ? Object.keys(I18N.ru) : [];
  const orphans = base.filter(k => !used.has(k));
  return { langs, usedCount: used.size, report, orphans };
});
// Формы множественного числа в корзине («5 вещей», «20 de articole»).
// Румынский раньше работал по английскому правилу и давал «20 articole».
const pl = await p.evaluate(() => {
  const out = {}, save = lang;
  for (const L of ['ru', 'ro', 'en']) { lang = L; out[L] = [0, 1, 2, 5, 11, 19, 20, 21, 101, 120].map(n => n + ' ' + plural(n)); }
  lang = save; return out;
});
const wantPl = {
  ru: ['0 вещей','1 вещь','2 вещи','5 вещей','11 вещей','19 вещей','20 вещей','21 вещь','101 вещь','120 вещей'],
  ro: ['0 articole','1 articol','2 articole','5 articole','11 articole','19 articole','20 de articole','21 de articole','101 articole','120 de articole'],
  en: ['0 items','1 item','2 items','5 items','11 items','19 items','20 items','21 items','101 items','120 items'],
};
let plFail = false;
for (const L of ['ru', 'ro', 'en']) {
  const bad = pl[L].filter((s, i) => s !== wantPl[L][i]);
  if (bad.length) { plFail = true; console.log(`❌ plural ${L}: получено ${JSON.stringify(pl[L])}`); }
  else console.log(`✅ plural ${L}: формы верны`);
}
await b.close();

console.log(`i18n: языки [${r.langs.join(', ')}], используется ключей: ${r.usedCount}`);
let failed = false;
for (const l of r.langs) {
  if (r.report[l].length) { failed = true; console.log(`❌ ${l}: не хватает ${r.report[l].length}:`, r.report[l].join(', ')); }
  else console.log(`✅ ${l}: все ключи заполнены`);
}
if (r.orphans.length) console.log(`ℹ️  неиспользуемые ключи в I18N (${r.orphans.length}, не ошибка):`, r.orphans.slice(0, 20).join(', ') + (r.orphans.length > 20 ? ' …' : ''));
console.log(failed || plFail ? '\n❌ i18n: есть ошибки' : '\n✅ i18n: полнота ок');
process.exit(failed || plFail ? 1 : 0);

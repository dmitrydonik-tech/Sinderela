// tests/i18n.mjs — полнота переводов. Все data-i18n(-html/-aria) ключи должны быть заполнены в RU/RO/EN.
// Запуск: PW=<...> CHROME_PATH=<...> LD_LIBRARY_PATH=<...> node tests/i18n.mjs   (в CI — просто node tests/i18n.mjs)
import { existsSync } from 'node:fs';
const _pw = await import(process.env.PW || 'playwright-core');
const chromium = _pw.chromium || (_pw.default && _pw.default.chromium);
const CHROME = process.env.CHROME_PATH || "/sessions/awesome-ecstatic-tesla/.cache/ms-playwright/chromium-1228/chrome-linux/chrome";

const launchOpts = { args: ['--no-sandbox'] };
try { if (existsSync(CHROME)) launchOpts.executablePath = CHROME; } catch {}
const b = await chromium.launch(launchOpts);
const p = await b.newPage();
await p.goto(new URL('../index.html', import.meta.url).href);
await p.waitForTimeout(300);

const r = await p.evaluate(() => {
  const attrs = ['data-i18n', 'data-i18n-html', 'data-i18n-aria'];
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
await b.close();

console.log(`i18n: языки [${r.langs.join(', ')}], используется ключей: ${r.usedCount}`);
let failed = false;
for (const l of r.langs) {
  if (r.report[l].length) { failed = true; console.log(`❌ ${l}: не хватает ${r.report[l].length}:`, r.report[l].join(', ')); }
  else console.log(`✅ ${l}: все ключи заполнены`);
}
if (r.orphans.length) console.log(`ℹ️  неиспользуемые ключи в I18N (${r.orphans.length}, не ошибка):`, r.orphans.slice(0, 20).join(', ') + (r.orphans.length > 20 ? ' …' : ''));
console.log(failed ? '\n❌ i18n: есть пропуски' : '\n✅ i18n: полнота ок');
process.exit(failed ? 1 : 0);

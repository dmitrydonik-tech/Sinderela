// tests/check-site.mjs — release gate. Run: node tests/check-site.mjs
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const errors = [];
const warns  = [];
const ok = [];

const check = (cond, msg) => cond ? ok.push(msg) : errors.push(msg);
const warn  = (cond, msg) => cond ? ok.push(msg) : warns.push(msg);

// ---------- ТЕЛЕФОН ----------
const PHONE = '+37369438080';

const tels = [...html.matchAll(/href="tel:([^"]+)"/g)].map(m => m[1].replace(/\s/g, ''));
check(tels.length > 0, 'Есть хотя бы одна tel: ссылка');
check(tels.every(t => t === PHONE), `Все tel: = ${PHONE}. Чужие: ${[...new Set(tels.filter(t=>t!==PHONE))].join(', ') || 'нет'}`);

const schemaTels = [...html.matchAll(/"telephone":\s*"([^"]+)"/g)].map(m => m[1].replace(/\s/g, ''));
check(schemaTels.length > 0, 'В JSON-LD есть telephone');
check(schemaTels.every(t => t === PHONE), `Все telephone в JSON-LD = ${PHONE}`);

const was = [...html.matchAll(/wa\.me\/(\d+)/g)].map(m => m[1]);
check(was.every(n => n === '37369438080'), 'Все wa.me ведут на 37369438080');

// заглушки телефона вне placeholder
const stripped = html.replace(/placeholder="[^"]*"/g, '');
const fakes = [/0\d{2}[\s-]?000[\s-]?000/, /0\d{2}[\s-]?123[\s-]?45/, /\+373[\s-]?0{6,}/, /XXX[\s-]?XXX/i, /1234567/];
fakes.forEach(re => check(!re.test(stripped), `Нет заглушки ${re}`));

// номера филиалов не должны попасть на сайт
const branchPhones = ['069088110','069411266','069019401','069494958','069450551','069383895','060093100','060522107','022438080','022445097'];
const leaked = branchPhones.filter(p => html.replace(/[\s\-()]/g, '').includes(p));
check(leaked.length === 0, `Телефоны филиалов не на сайте. Утечка: ${leaked.join(', ') || 'нет'}`);

// ---------- SEO ----------
check(/<title>[^<]{25,70}<\/title>/.test(html), 'title есть и длиной 25–70 символов');
check(/<meta\s+name="description"\s+content="[^"]{100,170}"/.test(html), 'meta description есть и длиной 100–170 символов');
check(/<link\s+rel="canonical"\s+href="https:\/\/sinderela\.md\/"/.test(html), 'canonical = https://sinderela.md/');
check((html.match(/<h1[\s>]/g) || []).length === 1, 'Ровно один H1');
check(/property="og:title"/.test(html) && /property="og:image"/.test(html), 'Open Graph заполнен');
check(/hreflang="x-default"/.test(html), 'Есть hreflang x-default');
check(/"@type":\s*"Organization"/.test(html), 'JSON-LD Organization есть');

const points = (html.match(/"@type":\s*"DryCleaningOrLaundry"/g) || []).length;
check(points === 9, `9 точек в JSON-LD (найдено ${points})`);

// Russo 28 (Filiala 5) — ремонт завершён, филиал снова работает и добавлен на сайт (подтверждено клиентом 2026-09).
check(/Alecu\s*Russo/i.test(html) && /Алеку\s*Руссо/i.test(html), 'Филиал Russo 28 присутствует (ремонт завершён)');

// ---------- СОГЛАСОВАННОСТЬ СПИСКОВ ФИЛИАЛОВ ----------
// Филиал приходится добавлять в ЧЕТЫРЁХ местах: список модалки, список подвала,
// JSON-LD и ключи i18n addrN. В сентябре 2026 Алеку Руссо 28 попал в модалку и JSON-LD,
// но НЕ в подвал — разошлось на месяц и заметил клиент. Эта проверка ловит такой разъезд.
const mapmBlock  = (html.match(/<ul class="mapm-list"[\s\S]*?<\/ul>/) || [''])[0];
const mapmCount  = (mapmBlock.match(/<li\b/g) || []).length;
const footerCount = (html.match(/class="ft-addr[^"]*"/g) || []).length;  // у главного офиса класс "ft-addr main"
check(mapmCount > 0 && mapmCount === footerCount,
      `Списки филиалов совпадают: модалка ${mapmCount} = подвал ${footerCount}`);

// те же адреса, не только количество: сверяем набор ключей addrN
const keysIn = (block) => new Set((block.match(/data-i18n="(addr\d+)"/g) || []).map(s => s.slice(11, -1)));
const footerBlock = (html.match(/<h3 data-i18n="ft_addr_h"[\s\S]*?<\/div>\s*<div>/) || [''])[0];
const mk = keysIn(mapmBlock), fk = keysIn(footerBlock);
const missing = [...mk].filter(k => !fk.has(k)).concat([...fk].filter(k => !mk.has(k)));
check(mk.size > 0 && missing.length === 0,
      `Адреса модалки и подвала — один набор${missing.length ? ' (разошлись: ' + missing.join(', ') + ')' : ''}`);

// ---------- FAQ: HTML и JSON-LD FAQPage — один набор вопросов ----------
// Вопрос живёт в ДВУХ местах: <details class="faq-i"><summary> и "Question" в FAQPage.
// Google требует, чтобы размеченные вопросы были видны на странице — при правке текста
// в одном месте и забытом втором разметка становится невалидной. Сверяем посимвольно (RU).
const unesc = s => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
const faqPairs = [...html.matchAll(/<details class="faq-i"><summary[^>]*>([^<]*)<\/summary><p[^>]*>([^<]*)<\/p>/g)]
  .map(m => ({ q: unesc(m[1]).trim(), a: unesc(m[2]).trim() }));
const faqHtml = faqPairs.map(x => x.q);
const faqLd   = (() => { try {
  const ld = JSON.parse((html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1]);
  const f = (ld['@graph'] || []).find(n => n['@type'] === 'FAQPage');
  return f ? f.mainEntity.map(q => ({ q: q.name.trim(), a: (q.acceptedAnswer?.text || '').trim() })) : [];
} catch { return null; } })();
check(faqLd !== null && faqLd.length > 0 && faqHtml.length > 0, `FAQPage в JSON-LD есть и парсится (${faqLd ? faqLd.length : 'JSON битый'} вопросов, в HTML ${faqHtml.length})`);
const faqLdQ = (faqLd || []).map(x => x.q);
const faqDiff = faqLdQ.filter(q => !faqHtml.includes(q)).concat(faqHtml.filter(q => !faqLdQ.includes(q)));
check(faqLd !== null && faqLd.length === faqHtml.length && faqDiff.length === 0,
      `FAQ: вопросы в HTML и FAQPage совпадают${faqDiff.length ? ' (разошлись: ' + faqDiff.map(q => '«' + q + '»').join(', ') + ')' : ''}`);
// ответ живёт в ТРЁХ местах (HTML <p>, JSON-LD, словарь ru) — сентябрь 2026: правка формулировки нашла третье место только по assert.
const faqBadA = faqPairs.filter(h => { const l = (faqLd || []).find(x => x.q === h.q); return l && l.a !== h.a; }).map(h => h.q);
check(faqLd !== null && faqBadA.length === 0,
      `FAQ: ответы в HTML и FAQPage совпадают${faqBadA.length ? ' (разошлись у: ' + faqBadA.map(q => '«' + q + '»').join(', ') + ')' : ''}`);

// третье место — словарь I18N.ru: applyLang() перезаписывает <p> из него, так что рассинхрон
// HTML ↔ словарь на глаз не виден (на экране всегда словарь). Словарь — JS, не JSON; значения
// там простые строки в двойных кавычках без экранирования, поэтому достаточно regex по блоку ru.
const ruDict = (html.match(/var I18N=\{\s*ru:\{([\s\S]*?)\n\s*ro:\{/) || ['', ''])[1];
const ruFaq  = Object.fromEntries([...ruDict.matchAll(/\b(faq\d+_[qa]):"([^"]*)"/g)].map(m => [m[1], m[2].trim()]));
const ruBad  = faqPairs.flatMap((h, i) => {
  const n = i + 1, out = [];
  if (ruFaq[`faq${n}_q`] !== h.q) out.push(`faq${n}_q`);
  if (ruFaq[`faq${n}_a`] !== h.a) out.push(`faq${n}_a`);
  return out;
});
check(ruDict.length > 0 && Object.keys(ruFaq).length === faqPairs.length * 2 && ruBad.length === 0,
      `FAQ: словарь I18N.ru совпадает с HTML${!ruDict.length ? ' (блок ru не найден)' : ruBad.length ? ' (разошлись: ' + ruBad.join(', ') + ')' : ''}`);

// ---------- СЧЁТЧИКИ ----------
check(html.includes('GTM-N4VK9XP4'), 'Контейнер GTM вставлен');
check(html.includes('googletagmanager.com/ns.html'), 'GTM noscript вставлен');
check(/gtag\('consent'\s*,\s*'default'/.test(html), 'Consent Mode default задан');
warn(!/G-5LNVHLJTQ9|G-JYEFTD4T3C|AW-16935450608|mc\.yandex|fbevents/.test(html),
     'Счётчики не вшиты хардкодом (только через GTM)');

// ---------- ЗАГЛУШКИ КОНТЕНТА ----------
const body = html.replace(/placeholder="[^"]*"/g, '');
const contentStubs = [/Loc pentru o recenzie/i, /Space for a real customer/i, /Место для .{0,20}отзыв/i, /lorem ipsum/i, /\bTODO\b/];
contentStubs.forEach(re => warn(!re.test(body), `Нет контент-заглушки ${re}`));

// ---------- ВЫВОД ----------
console.log(`\n✅ Пройдено: ${ok.length}`);
if (warns.length)  { console.log('\n⚠️  ПРЕДУПРЕЖДЕНИЯ:'); warns.forEach(w => console.log('   ' + w)); }
if (errors.length) { console.log('\n❌ ОШИБКИ:');          errors.forEach(e => console.log('   ' + e)); }
console.log('');
process.exit(errors.length ? 1 : 0);

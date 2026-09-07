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
check(points === 8, `8 точек в JSON-LD (найдено ${points})`);

check(!/Alecu\s*Russo/i.test(html) && !/Алеку\s*Руссо/i.test(html) && !/А\.\s*Руссо/i.test(html), 'Точка на ремонте (Russo 28) отсутствует');

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

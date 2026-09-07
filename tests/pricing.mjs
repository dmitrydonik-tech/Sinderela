// tests/pricing.mjs — тесты логики цен, прайс-синка и снапшот цен каталога.
// Запуск (локально): NODE_PATH=<outputs>/node_modules CHROME_PATH=<chrome> LD_LIBRARY_PATH=<libs> node tests/pricing.mjs
// В CI: npx playwright install chromium; playwright сам найдёт браузер (CHROME_PATH не нужен).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
// playwright-core: в CI резолвится как обычный пакет; локально можно указать путь через env PW
const _pw = await import(process.env.PW || 'playwright-core');
const chromium = _pw.chromium || (_pw.default && _pw.default.chromium);

const HTML = new URL('../index.html', import.meta.url);
const SNAP = new URL('./prices.snapshot.json', import.meta.url);
const CHROME = process.env.CHROME_PATH || "/sessions/awesome-ecstatic-tesla/.cache/ms-playwright/chromium-1228/chrome-linux/chrome";

const results = [];
const eq = (name, got, exp) => results.push({ name, ok: JSON.stringify(got) === JSON.stringify(exp), got, exp });
const truthy = (name, got) => results.push({ name, ok: !!got, got, exp: 'truthy' });

const launchOpts = { args: ['--no-sandbox', '--disable-dev-shm-usage'] };
try { if (existsSync(CHROME)) launchOpts.executablePath = CHROME; } catch {}
const b = await chromium.launch(launchOpts);
const p = await b.newPage();
const pageErrors = [];
p.on('pageerror', e => pageErrors.push(e.message));
await p.goto(HTML.href);
await p.waitForTimeout(500);

// ---------- 1) синхронные кейсы: цены, скидки, надбавки, 2D, конфиг ----------
const sync = await p.evaluate(() => {
  const R = [];
  const push = (name, got, exp) => R.push({ name, got, exp });

  // доступность функций
  R.push({ name: 'функции доступны', got: [typeof totals, typeof lineTotal, typeof childF, typeof varLabel].join(','), exp: 'function,function,function,function' });

  // helpers в контексте страницы
  const findIdx = (catId, name) => catById(catId).items.findIndex(it => it[0] === name);
  const reset = () => { cart.length = 0; opts.urg = 'none'; opts.iron = false; opts.stain = 0; lang = 'ru'; };
  const L = (cat, name, vi = 0, qty = 1, child = 'none', impreg = false) =>
    ({ cat, idx: findIdx(cat, name), vi, qty, child, impreg });

  // --- проверка исходных цен из данных (data-guard) ---
  const uJemper = catById('knit').items[findIdx('knit', 'Джемпер')][2];
  push('данные: Джемпер = [190]', uJemper, [190]);
  const uSviter = catById('knit').items[findIdx('knit', 'Свитер')][2];
  push('данные: Свитер = [190,170]', uSviter, [190, 170]);
  const uPidzhak = catById('suede').items[findIdx('suede', 'Пиджак')][2];
  push('данные: замша Пиджак = [565,810,630,900]', uPidzhak, [565, 810, 630, 900]);
  const uTufli = catById('shoes').items[findIdx('shoes', 'Туфли')][2];
  push('данные: Туфли = [300]', uTufli, [300]);

  // 1. одна цена, qty1
  reset(); let l = L('knit', 'Джемпер'); cart.push(l);
  push('1. Джемпер qty1: lineTotal', lineTotal(l), 190);
  push('1. Джемпер qty1: grand', totals().grand, 190);
  push('1. Джемпер qty1: vol', totals().vol, 0);

  // 2. qty3
  reset(); l = L('knit', 'Джемпер', 0, 3); cart.push(l);
  push('2. Джемпер qty3: lineTotal', lineTotal(l), 570);

  // 3. вариант (vi=1) => 170
  reset(); l = L('knit', 'Свитер', 1); cart.push(l);
  push('3. Свитер vi1: unit', lineUnit(l), 170);
  push('3. Свитер vi1: lineTotal', lineTotal(l), 170);

  // 4. 2D замша: Пиджак vi=3 (si=1,di=1) => 900; varLabel содержит "покраск"
  reset(); l = L('suede', 'Пиджак', 3); cart.push(l);
  push('4. замша Пиджак vi3: lineTotal', lineTotal(l), 900);
  const it = catById('suede').items[findIdx('suede', 'Пиджак')];
  push('4. varLabel содержит "покраск"', /покраск/i.test(varLabel(it, catById('suede'), 3)), true);

  // 5. детская скидка u3/u12 на детском товаре (knit имеет child:1)
  reset(); l = L('knit', 'Джемпер', 0, 1, 'u3'); cart.push(l);
  push('5. Джемпер u3: 190*0.5=95', lineTotal(l), 95);
  reset(); l = L('knit', 'Джемпер', 0, 1, 'u12'); cart.push(l);
  push('5. Джемпер u12: 190*0.7=133', lineTotal(l), 133);

  // 6. пропитка (обувь) => *1.2
  reset(); l = L('shoes', 'Туфли', 0, 1, 'none', true); cart.push(l);
  push('6. Туфли impreg: 300*1.2=360', lineTotal(l), 360);

  // 7. объёмная скидка: 5 шт (qty5) => -5%
  reset(); l = L('knit', 'Джемпер', 0, 5); cart.push(l);
  { const t = totals(); push('7. Джемпер qty5: vol=round(950*.05)=48', t.vol, 48); push('7. grand=902', t.grand, 902); }

  // 8. объёмная скидка не считает детскую базу: 4 обычных + 1 детский, qty=5
  reset(); cart.push(L('knit', 'Джемпер', 0, 4)); cart.push(L('knit', 'Джемпер', 0, 1, 'u3'));
  { const t = totals(); push('8. volBase только недетские: vol=round(760*.05)=38', t.vol, 38); push('8. grand=817', t.grand, 817); }

  // 9. срочность
  reset(); cart.push(L('knit', 'Джемпер')); opts.urg = 'u24';
  push('9. u24: grand=190+95=285', totals().grand, 285);
  opts.urg = 'sameday';
  push('9. sameday: grand=190+190=380', totals().grand, 380);

  // 10. глажка +30%
  reset(); cart.push(L('knit', 'Джемпер')); opts.iron = true;
  push('10. iron: grand=190+57=247', totals().grand, 247);

  // 11. пятна *45
  reset(); cart.push(L('knit', 'Джемпер')); opts.stain = 2;
  push('11. stains2: grand=190+90=280', totals().grand, 280);

  // 12. композит: qty5 + u24 + iron + stain1
  reset(); cart.push(L('knit', 'Джемпер', 0, 5)); opts.urg = 'u24'; opts.iron = true; opts.stain = 1;
  { const t = totals(); // vol48, after902, urg451, iron271, stains45
    push('12. композит vol', t.vol, 48);
    push('12. композит urg=round(902*.5)=451', t.urgAmt, 451);
    push('12. композит iron=round(902*.3)=271', t.ironAmt, 271);
    push('12. композит stains=45', t.stains, 45);
    push('12. композит grand=1669', t.grand, 1669); }

  // 13. childF значения
  push('13. childF u3/u12/none', [childF('u3'), childF('u12'), childF('none')], [0.5, 0.7, 1]);

  // 14. CHILD_EX содержит исключения
  push('14. CHILD_EX', [!!CHILD_EX['Платье Вечернее'], !!CHILD_EX['Платье Свадебное'], !!CHILD_EX['Смокинг, фрак']], [true, true, true]);

  // 15. детские категории имеют флаг child, обувь/аксессуары — нет
  const hasChild = id => !!catById(id).child;
  push('15. child-флаг: knit/suits да, shoes/acc нет', [hasChild('knit'), hasChild('suits'), hasChild('shoes'), hasChild('acc')], [true, true, false, false]);

  reset();
  return R;
});
for (const r of sync) eq(r.name, r.got, r.exp);

// ---------- 2) снапшот цен каталога ----------
const catalog = await p.evaluate(() => {
  const out = {};
  CATS.forEach(c => c.items.forEach(it => { out[c.id + ' | ' + it[0]] = it[2]; }));
  return out;
});
if (!existsSync(SNAP)) {
  writeFileSync(SNAP, JSON.stringify(catalog, null, 1));
  results.push({ name: 'СНАПШОТ создан (baseline) — закоммить tests/prices.snapshot.json', ok: true, got: Object.keys(catalog).length + ' позиций', exp: 'baseline' });
} else {
  const saved = JSON.parse(readFileSync(SNAP, 'utf8'));
  const diffs = [];
  const keys = new Set([...Object.keys(saved), ...Object.keys(catalog)]);
  for (const k of keys) if (JSON.stringify(saved[k]) !== JSON.stringify(catalog[k])) diffs.push(`${k}: ${JSON.stringify(saved[k])} -> ${JSON.stringify(catalog[k])}`);
  results.push({ name: 'СНАПШОТ цен каталога совпал', ok: diffs.length === 0, got: diffs.slice(0, 8), exp: [] });
}

// ---------- 3) прайс-синк: parsePriceCSV ----------
const parse = await p.evaluate(() => {
  const csv = [
    '№,Наименование услуги,,Ед. изм.,Цена',
    '1. Цех Рышкановка,,,,',
    '4P7,"Смокинг, фрак *6",,шт.,275',
    '1D33,Простыня (кроме шелк) полуторная,,шт.,120',
    '1D33,Скатерть настольная 1м²,,м2,50',
    '2S10,Свитер с коротк. рукав. *1,,шт.,170',
    '2S10,Туника *1,,шт.,190',
    '2. Цех Боттаника,,,,',
    '1D33,Простыня (кроме шелк) полуторная,,шт.,120'
  ].join('\n');
  const by = parsePriceCSV(csv);
  return {
    smoking: !!by['4P7'] && by['4P7'][0].p,
    d33len: by['1D33'] ? by['1D33'].length : 0,
    s10len: by['2S10'] ? by['2S10'].length : 0
  };
});
eq('синк: "Смокинг, фрак" (запятая в кавычках) => 4P7=275', parse.smoking, 275);
eq('синк: дубль 1D33 => 2 кандидата (Простыня+Скатерть)', parse.d33len, 2);
eq('синк: дубль 2S10 => 2 кандидата (Свитер+Туника)', parse.s10len, 2);

// ---------- 4) applyPriceUpdates: разводка дублей по названию + fallback ----------
const applyRes = await p.evaluate(async () => {
  const idx = (catId, name) => catById(catId).items.findIndex(it => it[0] === name);
  const prostynya = () => catById('bedding').items[idx('bedding', 'Простыня')][2][0];
  const skatert = () => catById('hometex').items[idx('hometex', 'Скатерть настольная')][2][0];
  const sviter = () => catById('knit').items[idx('knit', 'Свитер')][2][1]; // vi1 = 2S10
  const before = { prostynya: prostynya(), skatert: skatert(), sviter: sviter() };
  const csv = [
    '№,Наименование,,Ед,Цена',
    '1D33,Простыня (кроме шелк) полуторная,,шт.,133',
    '1D33,Скатерть настольная 1м²,,м2,66',
    '2S10,Свитер с коротк. рукав. *1,,шт.,180',
    '2S10,Туника *1,,шт.,200'
  ].join('\n');
  window.PRICE_CSV_URL = 'http://local/test.csv';
  window.fetch = () => Promise.resolve({ ok: true, text: () => Promise.resolve(csv) });
  applyPriceUpdates();
  await new Promise(r => setTimeout(r, 300));
  return { before, after: { prostynya: prostynya(), skatert: skatert(), sviter: sviter() } };
});
eq('синк apply: Простыня 120->133 (дубль 1D33)', applyRes.after.prostynya, 133);
eq('синк apply: Скатерть 50->66 (дубль 1D33)', applyRes.after.skatert, 66);
eq('синк apply: Свитер 170->180 (2S10, не Туника 200)', applyRes.after.sviter, 180);

const fb = await p.evaluate(async () => {
  const idx = catById('knit').items.findIndex(it => it[0] === 'Джемпер');
  const before = catById('knit').items[idx][2][0];
  window.PRICE_CSV_URL = 'http://local/bad.csv';
  window.fetch = () => Promise.reject(new Error('net down'));
  let threw = false;
  try { applyPriceUpdates(); } catch (e) { threw = true; }
  await new Promise(r => setTimeout(r, 300));
  return { before, after: catById('knit').items[idx][2][0], threw };
});
eq('синк fallback: сбой сети не роняет и не меняет цены', [fb.after === fb.before, fb.threw], [true, false]);

// ---------- итог ----------
await b.close();
eq('нет JS-ошибок на странице', pageErrors.slice(0, 3), []);

const passed = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok);
for (const f of failed) console.log('❌', f.name, '\n   получено:', JSON.stringify(f.got), '\n   ожидалось:', JSON.stringify(f.exp));
console.log(`\n${failed.length ? '❌' : '✅'} pricing: пройдено ${passed}/${results.length}`);
process.exit(failed.length ? 1 : 0);

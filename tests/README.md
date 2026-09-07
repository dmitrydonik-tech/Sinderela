# Тесты Sinderela

Два набора. Держи оба зелёными перед деплоем.

## 1. `check-site.mjs` — релиз-гейт (SEO/мета, статический)
Чистый разбор `index.html` как текста, браузер НЕ нужен.
```bash
node tests/check-site.mjs      # ожидаем: ✅ Пройдено: 29
```

## 2. `pricing.mjs` — логика цен + прайс-синк + снапшот цен
Гоняет реальный JS сайта в headless-хроме: `totals/lineTotal/childF/varLabel`, разбор CSV синка (дубли кодов 1D33/2S10), fallback при сбое сети, и **снапшот всех цен каталога** (`prices.snapshot.json`).
```bash
# нужен playwright-core + chromium.
# В CI: npm i -D playwright-core && npx playwright install chromium && node tests/pricing.mjs
# Локально (в этой песочнице), если playwright-core лежит в outputs:
PW=<путь>/outputs/node_modules/playwright-core/index.js \
LD_LIBRARY_PATH=<путь>/outputs/.chromeenv/libs \
CHROME_PATH=<путь>/.cache/ms-playwright/chromium-1228/chrome-linux/chrome \
node tests/pricing.mjs               # ожидаем: ✅ pricing: пройдено 41/41
```
- `PW` — путь к `playwright-core` (в CI не нужен, резолвится сам).
- `CHROME_PATH` — путь к chrome (в CI не нужен, playwright найдёт установленный).

### Про снапшот цен
`prices.snapshot.json` — золотой слепок «позиция → цены» (146 позиций). Правки данных идут «слепыми» скриптами с `assert count`, а снапшот ловит опечатку в самой цифре цены.
- Тест краснеет при любом расхождении и печатает `было -> стало`.
- **Изменил цену намеренно?** Удали `tests/prices.snapshot.json` и прогони тест — он пересоздаст baseline; закоммить новый файл. Это осознанный аудит-след.

## Правило
После любой правки `index.html`: оба теста зелёные (29/0 и 41/41) + рендер в светлой и тёмной теме.
Автоматизацию (GitHub Action на push) см. `tech_debt/07-ci-test-gate.md`.

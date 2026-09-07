# tools/ — скрипты сборки и обслуживания

Инструменты для повторяемых операций над сайтом. **На сайт НЕ деплоятся** (GitHub Pages публикует только `index.html` + `assets/`), но лежат в репо для воспроизводимости.

> ⚠ **Пути.** Большинство python/mjs-скриптов писались в build-сессии и содержат абсолютные пути (`/sessions/.../SinderelaMD`, `/sessions/.../outputs`). Перед запуском **замени базовые пути вверху файла** под свой репозиторий и временную папку. Исключения (уже относительные): `bump-iconver.mjs`.

## Зависимости
- **Node** + `playwright-core` (+ chromium: `npx playwright install chromium`) — для скриптов, читающих реальный DOM.
- **Python 3** + `openpyxl` (xlsx) и `pillow` (иконки): `pip install openpyxl pillow --break-system-packages`.
- **ffmpeg** — для hero-видео.

---

## Иконки
Иконки — отдельные PNG в `assets/icons/`, подключаются `?v=<ICONVER>`. Пайплайн обработки эскиза см. `AGENT_HANDOFF.md` §4 (to_navy → trim → 150px в 176×176 → центр по массе). Толщину контура НЕ раздувать постобработкой — просить жирный эскиз.

- **`bump-iconver.mjs`** — после любой замены PNG: `node tools/bump-iconver.mjs`. Поднимает `ICONVER` в `index.html` (с бэкапом) и пересобирает манифест `assets/icons/.iconver.json`. Иначе тест `tests/icons.mjs` покраснеет (страж кэша).

## Прайс-синк: карта код→позиция
Слой самообновления цен в `index.html` использует `PRICEMAP` (см. `tech_debt/13`... т.е. секцию про синк в `AGENT_HANDOFF.md` §13). Пересборка карты:
1. `extract_cats.mjs` — вытаскивает `CATS` из `index.html` (headless) → `cats.json`.
2. `dump_price.py` / `dump_their.py` — парсят `price/Прейскурант.xlsx` → строки/коды (`price_rows.json`, `their_codes.json`).
3. **`build_pricemap.py`** — строит `pricemap_multi.json` (код → [ci,ii,idx,base(,hint)]), сверяет цены, ловит дубли кодов (1D33, 2S10 — разводятся по названию). Готовый актуальный результат лежит здесь: **`pricemap_multi.json`**.
4. `build_synclayer2.py` — встраивает слой синка + карту в `index.html` (если пересобираешь слой).

## Hero-видео (showreel)
- **`build_showreel.sh`** — склейка 6 клипов в showreel (ffmpeg xfade, 720×880 под слот).
- Итоговый hero — ОДИН файл `assets/hero-combined.mp4`: ателье → кросс-фейд → showreel, **старт и конец — чистые кадры (без наложений), петля встык** (клиент не любит призраки кросс-фейда). Рецепт сборки combined + сжатие crf33 — в истории; ключевое правило см. `AGENT_HANDOFF.md` §11. Промты генерации клипов (Veo/Google Flow) — `_Документы/Sinderela_Video_Prompt.md`.

## Разное
- **`extract_base64.py`** — выносит инлайн-base64 картинки из `index.html` в файлы `assets/` (уже применено: crest / crest-dark / footer-logo). Идемпотентно, с бэкапом.
- **`fix_suede5.py`** — пример точечной правки цен замши по прайсу (шаблон «правка данных скриптом с assert»).

## Правило правок данных
Любая правка каталога/цен — **скриптом с `assert count==N`** на каждую замену (не «слепой» replace), затем: бэкап → `node tests/check-site.mjs` (29/0) → `node tests/pricing.mjs` (снапшот!) → рендер в 2 темах.

# ⚠ Пути внутри — абсолютные к build-сессии. Перед запуском замени базовые пути вверху под свой репозиторий (index.html / assets / временная папка). См. tools/README.md
# -*- coding: utf-8 -*-
import json, re
cats=json.load(open("/sessions/awesome-ecstatic-tesla/mnt/outputs/cats.json"))["flat"]
their=json.load(open("/sessions/awesome-ecstatic-tesla/mnt/outputs/their_codes.json"))
theirById={x["code"]:x for x in their}

def norm(s):
    s=(s or "").lower().replace("ё","е").strip()
    return re.sub(r"\s+"," ",s)

catIdx={}
for it in cats:
    catIdx[(it["catId"], norm(it["name"]))]=it

# catId -> { itemName: [codes by flat price index] }  (None = no matching code)
MAP={
 "outer":{
  "Куртка без наполнителя":["1V2","1V3"],
  "Куртка с наполнителем":["1V8","1V9"],
  "Куртка джинсовая":["1V1"],
  "Пальто без наполнителя":["1V12","1V13"],
  "Пальто с наполнителем":["1V10","1V11"],
  "Пальто без рукавов":["1V14"],
  "Плащ":["1V4","1V5"],
  "Тренч":["1V6","1V7"],
  "Дублёнка (искусственный мех)":["1V16","1V17"],
  "Шуба (искусственный мех)":["1V18","1V19"],
  "Жилет с наполнителем":["1V15"],
 },
 "knit":{
  "Батник (в т.ч спорт)":["2S1"],
  "Гольф":["2S3","2S2"],
  "Джемпер":["2S4"],
  "Жилет (в т.ч спорт)":["2S5"],
  "Кардиган":["2S6"],
  "Кофта (в т.ч спорт)":["2S7"],
  "Свитер":["2S8","2S10"],
  "Свитшот (в т.ч спорт)":["2S9"],
  "Толстовка (в т.ч спорт)":["2S12"],
  "Худи (в т.ч спорт)":["2S11"],
 },
 "casual":{
  "Блузка":["2R4","2R3"],
  "Болеро":["2R5"],
  "Майка":["2R6"],
  "Поло":["2R8","2R7"],
  "Рубашка":["2R2","2R1"],
  "Топ":["2R9"],
  "Туника":["2R10"],
  "Футболка":["2R12","2R11"],
 },
 "suits":{
  "Жакет":["4P2"],
  "Жилет, жилет костюмный":["4P3"],
  "Пиджак":["4P1"],
  "Платье Вечернее":["4P5"],
  "Платье Свадебное":["4P6"],
  "Платье, Сарафан":["4P4"],
  "Смокинг, фрак":["4P7"],
 },
 "bottoms":{
  "Брюки джинсовые":["5B1"],
  "Брюки классические":["5B2"],
  "Брюки костюмные":["5B3"],
  "Брюки спортивные":["5B4"],
  "Колготки":["5B12"],
  "Комбинезон длинный":["5B10"],
  "Комбинезон короткий":["5B9"],
  "Лосины":["5B11"],
  "Шорты":["5B5","5B6"],
  "Юбка":["5B7","5B8"],
 },
 "acc":{
  "Берет (не кожа)":["6G1"],
  "Галстук (не кожа)":["6G2"],
  "Капюшон (не кожа)":["6G3"],
  "Кепка (не кожа)":["6G4"],
  "Палантин":["6G5","6G6"],
  "Пашмина":["6G7","6G8"],
  "Перчатки (не кожа)":["6G9"],
  "Платок (не мех)":["6G10"],
  "Подстёжка":["6G12","6G11"],
  "Шаль (не мех)":["6G15"],
  "Шапка (не кожа)":["6G16"],
  "Шарф (не кожа)":["6G17"],
 },
 "leather":{
  "Берет":["7KG24"],
  "Брюки":["7KG15"],
  "Галстук":["7KG27"],
  "Жилет (без рукавов)":["7KG3"],
  "Капюшон":["7KG25"],
  "Кепка":["7KG23"],
  "Куртка":["7KG4","7KG5"],
  "Куртка комб. с тканью":["7KG1","7KG2"],
  "Перчатки":["7KG26"],
  "Пиджак":["7KG6","7KG7"],
  "Платье, сарафан":["7KG20","7KG21"],
  "Плащ":["7KG9","7KG10"],
  "Рубашка":["7KG16"],
  "Шапка":["7KG22"],
  "Шорты до 50 см":["7KG11"],
  "Шорты, юбка (от 50 см)":["7KG13"],
  "Юбка":["7KG12","7KG14"],
 },
 "suede":{  # flat size-major, dye inner [без, с]
  "Берет":["8ZD24","9ZDK24"],
  "Галстук":["8ZD27","9ZDK27"],
  "Дублёнка":["8ZD17","9ZDK17","8ZD18","9ZDK18","8ZD19","9ZDK19"],
  "Жилет (без рукавов)":["8ZD8","9ZDK6"],
  "Капюшон":["8ZD25","9ZDK25"],
  "Кепка":["8ZD23","9ZDK23"],
  "Куртка":["8ZD3","9ZDK3","8ZD4","9ZDK4","8ZD5","9ZDK5"],
  "Куртка комб. с тканью":["8ZD1","9ZDK1","8ZD2","9ZDK2"],
  "Перчатки":["8ZD26","9ZDK26"],
  "Пиджак":["8ZD6","9ZDK7","8ZD7","9ZDK8"],
  "Платье, сарафан":["8ZD20","9ZDK20","8ZD21","9ZDK21"],
  "Плащ":["8ZD9","9ZDK9","8ZD10","9ZDK10"],
  "Рубашка":["8ZD16","9ZDK16"],
  "Шапка":["8ZD22","9ZDK22"],
  "Шорты":["8ZD11","9ZDK13","8ZD13","9ZDK14"],
  "Юбка":["8ZD12","9ZDK11","8ZD14","9ZDK12"],
 },
 "fur":{
  "Болеро из натурального меха":["10M5"],
  "Воротник из натурального меха":["10M2"],
  "Жилет из натурального меха":["10M4"],
  "Опушка из натурального меха":["10M3"],
  "Подстёжка из натурального меха":["10M8"],
  "Полушубок из натурального меха":["10M6"],
  "Шапка из натурального меха":["10M1"],
  "Шкура из натурального меха, 1m2":["10M9"],
  "Шуба из натурального меха":["10M7"],
 },
 "shoes":{
  "Балетки":["1O4"],
  "Босоножки":["1O1"],
  "Ботинки":["1O15","1O14"],
  "Ботфорты, сапоги выше колен":["1O18"],
  "Валенки, UGG, аналог":["1O19","1O20","1O21"],
  "Кеды":["1O13","1O12"],
  "Кроссовки":["1O11","1O10"],
  "Лоферы":["1O8"],
  "Мокасины":["1O6"],
  "Полусапоги":["1O16"],
  "Сандали":["1O2"],
  "Сапоги":["1O17"],
  "Слиперы, слипоны":["1O7"],
  "Туфли":["1O5"],
  "Шлепки":["1O3"],
  "Эспадрильи":["1O9"],
 },
 "bags":{
  "Пояс":["6G13","7KG29","8ZD29"],
  "Ремень":["6G14","7KG28","8ZD28"],
  "Клатч":["1J1"],
  "Портфель":["1J4"],
  "Рюкзак":["1J3"],
  "Сумка":["1J2"],
  "Чемодан":["1J5"],
 },
 "bedding":{
  "Плед двойной":["1D25","1D26"],
  "Плед искусственный мех":["1D23","1D24"],
  "Плед шерстяной":["1D21","1D22"],
  "Одеяло натуральное":["1D19","1D20"],
  "Одеяло синтетическое":["1D17","1D18"],
  "Пододеяльник":["1D10","1D11"],
  "Пододеяльник шёлковый":["1D12","1D13"],
  "Простыня":["1D33","1D4"],
  "Простыня махровая":["1D1","1D2"],
  "Простыня шёлковая":["1D5","1D6"],
  "Наволочка":["1D7","1D8","1D9"],
  "Подушка синтепоновая":["1D27","1D28","1D29","1D30","1D31"],
  "Подушка":["2D27","2D28","2D29","2D30","2D31","2D32"],
  "Наматрасник":["1D14","1D15","1D16"],
  "Пижама":["1D40","1D39"],
  "Полотенце (от 1 м²)":["1D32"],
  "Халат махровый":["1D41"],
 },
 "hometex":{
  "Игрушка 1кг (маркировка обязат.)":["1D38"],
  "Ткань без наполнителя 1м²":["1D42"],
  "Фартук":["1D44"],
  "Скатерть настольная":["1D33"],
  "Чехлы с наполнителем до 2см 1м²":["1D37"],
  "Шторы 1м²":["1D34","1D35","1D36"],
 },
}

# --- their candidates per code (distinct by price), с нормализованным RU-названием ---
rows_raw=json.load(open("/sessions/awesome-ecstatic-tesla/mnt/outputs/price_rows.json"))
code_re=re.compile(r'^\d+[A-Za-z]+\d+$')
def rus(nm):
    nm=(nm or "").split(" / ")[0]
    return re.sub(r"\s+"," ",nm.lower().replace("ё","е")).strip()
theirCands={}
for r in rows_raw:
    c=(r[0] or "").strip()
    if not code_re.match(c): continue
    try: pr=float(str(r[4]).replace(",","."))
    except: continue
    lst=theirCands.setdefault(c,[])
    if not any(abs(x[1]-pr)<0.001 for x in lst):
        lst.append((rus(r[1]), pr))

# коды-дубли (один код -> разные услуги/цены). Различаем по названию.
AMBIG={"1D33","2S10"}
HINTS={
 ("1D33","bedding","Простыня"):"простын",
 ("1D33","hometex","Скатерть настольная"):"скатерт",
 ("2S10","knit","Свитер"):"свитер",
}

pmm={}          # code -> [ [ci,ii,idx,base(,hint)], ... ]
mism=[]; unmapped=[]; missing=[]; covered=set()
for catId, items in MAP.items():
    for name, codes in items.items():
        it=catIdx.get((catId, norm(name)))
        assert it, "NO CATS ITEM: %s / %s"%(catId,name)
        prices=it["prices"]
        assert isinstance(prices,list), "prices not list: %s/%s"%(catId,name)
        assert len(codes)==len(prices), "LEN %s/%s: %d codes vs %d prices"%(catId,name,len(codes),len(prices))
        for idx,(code,our) in enumerate(zip(codes,prices)):
            covered.add((it["ci"],it["ii"],idx))
            if code is None:
                unmapped.append((catId,name,idx,our)); continue
            cands=theirCands.get(code)
            if not cands:
                missing.append((catId,name,idx,our,code)); continue
            hint=HINTS.get((code,catId,name))
            if len(cands)==1: tp=cands[0][1]
            elif hint:
                tp=next((pr for nm,pr in cands if hint in nm), None)
            else:
                tp=None  # ambiguous без подсказки — не должно случаться
            if tp is None or abs(tp-float(our))>0.001:
                mism.append((catId,name,idx,our,tp,code,hint))
            tgt=[it["ci"],it["ii"],idx,our]
            if code in AMBIG and hint: tgt.append(hint)
            pmm.setdefault(code,[]).append(tgt)

allpp=set()
for it in cats:
    for idx in range(len(it["prices"])): allpp.add((it["ci"],it["ii"],idx))
notcov=sorted(allpp-covered)
ntargets=sum(len(v) for v in pmm.values())

json.dump(pmm, open("/sessions/awesome-ecstatic-tesla/mnt/outputs/pricemap_multi.json","w"), ensure_ascii=False)

print("=== PRICE MAP AUDIT (multi) ===")
print("price-points:", len(allpp), "| covered:", len(covered), "| targets:", ntargets, "| codes:", len(pmm))
print("uncovered:", len(notcov), notcov[:10])
print("коды с несколькими целями (дубли):", {k:len(v) for k,v in pmm.items() if len(v)>1})
print("\n-- UNMAPPED:", len(unmapped))
for x in unmapped: print("   ", x)
print("\n-- MISSING CODE:", len(missing))
for x in missing: print("   ", x)
print("\n-- PRICE MISMATCH:", len(mism))
for catId,name,idx,our,tp,code,hint in mism:
    print("   %-8s %-26s idx%d  сайт=%s  прайс=%s  [%s hint=%s]"%(catId,name,idx,our,tp,code,hint))
print("\nOK matched:", ntargets-len(mism), "из", ntargets)

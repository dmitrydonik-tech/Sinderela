# ⚠ Пути внутри — абсолютные к build-сессии. Перед запуском замени базовые пути вверху под свой репозиторий (index.html / assets / временная папка). См. tools/README.md
# -*- coding: utf-8 -*-
import json, re
rows=json.load(open("/sessions/awesome-ecstatic-tesla/mnt/outputs/price_rows.json"))
code_re=re.compile(r'^\d+[A-Za-z]+\d+$')
sec_re=re.compile(r'^\d+\.')

seen={}
order=[]
cur_sec=""
for r in rows:
    c0=(r[0] or "").strip() if r[0] else ""
    if c0 and sec_re.match(c0) and not code_re.match(c0):
        cur_sec=c0
        continue
    if c0 and code_re.match(c0):
        code=c0
        nm=(r[1] or "").strip()
        price=r[4]
        if code not in seen:  # keep first occurrence (Рышкановка)
            seen[code]={"code":code,"name":nm,"price":price,"sec":cur_sec}
            order.append(code)

# split RU / RO
def split_ru(nm):
    if " / " in nm: return nm.split(" / ",1)[0].strip()
    return nm.strip()

recs=[seen[c] for c in order]
json.dump(recs, open("/sessions/awesome-ecstatic-tesla/mnt/outputs/their_codes.json","w"), ensure_ascii=False, indent=0)

# grouped print
from collections import defaultdict
bysec=defaultdict(list)
for x in recs: bysec[x["sec"]].append(x)
for sec in bysec:
    print(f"\n### {sec[:80]}")
    for x in bysec[sec]:
        print(f"  {x['code']:8} {x['price']!s:>5}  {split_ru(x['name'])}")
print("\nTOTAL unique (first цех):", len(recs))

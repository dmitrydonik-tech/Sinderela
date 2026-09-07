# ⚠ Пути внутри — абсолютные к build-сессии. Перед запуском замени базовые пути вверху под свой репозиторий (index.html / assets / временная папка). См. tools/README.md
# -*- coding: utf-8 -*-
import re, base64, hashlib, time, shutil, os
F="/sessions/awesome-ecstatic-tesla/mnt/SinderelaMD/index.html"
ASSETS="/sessions/awesome-ecstatic-tesla/mnt/SinderelaMD/assets"
shutil.copyfile(F, F.replace("index.html","index-BACKUP-before-base64-%d.html"%int(time.time())))
s=open(F,encoding='utf-8').read()
before=len(s)

# имя файла по длине base64 (уникальны: 18472 crest, 13088 crest-dark, 17332 footer-logo)
NAME_BY_LEN={18472:"crest.webp", 13088:"crest-dark.webp", 17332:"footer-logo.webp"}

uris=re.findall(r'data:image/webp;base64,[A-Za-z0-9+/=]+', s)
uniq={}
for u in uris:
    data=u.split(",",1)[1]
    uniq.setdefault(len(data), u)
print("всего вхождений data:webp:", len(uris), "| уникальных по длине:", len(uniq))

# проверка дубля 18472 (должен встретиться 2 раза)
from collections import Counter
cnt=Counter(len(u.split(",",1)[1]) for u in uris)
print("частоты по длине:", dict(cnt))

written=[]
for ln,u in uniq.items():
    name=NAME_BY_LEN.get(ln)
    assert name, "unexpected blob length %d"%ln
    data=u.split(",",1)[1]
    raw=base64.b64decode(data)
    path=os.path.join(ASSETS,name)
    open(path,"wb").write(raw)
    written.append((name, len(raw)))
    # заменить ВСЕ вхождения этого data-URI на путь к файлу
    c=s.count(u); s=s.replace(u, "assets/"+name)
    print(f"{name}: {len(raw)} байт, заменено вхождений: {c}")

assert "data:image/webp;base64" not in s, "остались инлайн-webp!"
open(F,"w",encoding='utf-8').write(s)
print("index.html: %d -> %d байт (−%d, −%.1f%%)"%(before,len(s),before-len(s),100*(before-len(s))/before))

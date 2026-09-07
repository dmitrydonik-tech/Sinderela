# ⚠ Пути внутри — абсолютные к build-сессии. Перед запуском замени базовые пути вверху под свой репозиторий (index.html / assets / временная папка). См. tools/README.md
# -*- coding: utf-8 -*-
import time, shutil
F="/sessions/awesome-ecstatic-tesla/mnt/SinderelaMD/index.html"
shutil.copyfile(F, F.replace("index.html","index-BACKUP-before-suede5-%d.html"%int(time.time())))
s=open(F,encoding='utf-8').read()
def rep(a,b):
    global s
    c=s.count(a); assert c==1, "MISS/DUP %d: %s"%(c,a)
    s=s.replace(a,b)

# suede с-покраской → по официальному прайсу
rep('[440,900],1,"Vest"', '[440,625],1,"Vest"')                    # Жилет без рукавов: 900->625
rep('[565,625,630,810],1,"Blazer"', '[565,810,630,900],1,"Blazer"')# Пиджак: 625->810, 810->900
rep('[320,460,410,460],1,"Shorts"', '[320,460,410,585],1,"Shorts"')# Шорты от50: 460->585
rep('[320,585,410,585],1,"Skirt"', '[320,460,410,585],1,"Skirt"')  # Юбка до50: 585->460

open(F,"w",encoding='utf-8').write(s)
print("suede 5 prices aligned to price list: жилет625, пиджак810/900, шорты585, юбка460")

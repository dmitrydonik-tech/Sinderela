# ⚠ Пути внутри — абсолютные к build-сессии. Перед запуском замени базовые пути вверху под свой репозиторий (index.html / assets / временная папка). См. tools/README.md
# -*- coding: utf-8 -*-
import time, shutil
F="/sessions/awesome-ecstatic-tesla/mnt/SinderelaMD/index.html"
BK="/sessions/awesome-ecstatic-tesla/mnt/SinderelaMD/index-BACKUP-before-sync-1786949883.html"
# восстановить чистую версию (правка замши есть, слой v1 отсутствует)
shutil.copyfile(F, F.replace("index.html","index-BACKUP-before-syncv2-%d.html"%int(time.time())))
shutil.copyfile(BK, F)
s=open(F,encoding='utf-8').read()
assert "applyPriceUpdates" not in s, "v1 layer still present after restore!"

pmm=open("/sessions/awesome-ecstatic-tesla/mnt/outputs/pricemap_multi.json",encoding='utf-8').read().strip()

BLOCK = r'''/*--- авто-обновление цен из опубликованной Google-таблицы (прайс клиента в CSV) ---*/
/* Клиент публикует свою таблицу-прайс как CSV и вставляет ссылку в PRICE_CSV_URL.
   Пусто = выключено (вшитые цены). Любая ошибка/недоступность = вшитые цены, сайт не ломается.
   PRICEMAP: код -> список целей [ci,ii,idx,base(,hint)]. hint нужен для кодов-дублей
   (в прайсе клиента 1D33 = Простыня И Скатерть, 2S10 = Свитер И Туника) — различаем по названию. */
var PRICE_CSV_URL="";
var PRICEMAP=__PMM__;
function csvRows(t){var rows=[],row=[],f="",q=false,i=0,n=t.length,ch;for(;i<n;i++){ch=t[i];if(q){if(ch==='"'){if(t[i+1]==='"'){f+='"';i++;}else{q=false;}}else{f+=ch;}}else{if(ch==='"'){q=true;}else if(ch===','){row.push(f);f="";}else if(ch==='\n'){row.push(f);rows.push(row);row=[];f="";}else if(ch==='\r'){}else{f+=ch;}}}if(f!==""||row.length){row.push(f);rows.push(row);}return rows;}
function _rusName(s){s=(s||"").split(" / ")[0];return s.toLowerCase().replace(/ё/g,"е").replace(/\s+/g," ").trim();}
function parsePriceCSV(txt){var rows=csvRows(txt),re=/^\d+[A-Za-z]+\d+$/,by={},i,j,k,r,code,price,c,sN,nm,lst,rn,dup,x;for(i=0;i<rows.length;i++){r=rows[i];code=null;price=null;nm="";for(j=0;j<r.length;j++){c=(r[j]||"").trim();if(!code&&re.test(c)){code=c;}}if(!code)continue;for(j=0;j<r.length;j++){c=(r[j]||"").trim();if(c&&!re.test(c)&&!isFinite(+c.replace(",","."))&&c.length>nm.length)nm=c;}for(k=r.length-1;k>=0;k--){sN=(r[k]||"").replace(/\s/g,"").replace(",",".");if(sN!==""&&isFinite(+sN)){price=+sN;break;}}if(price===null)continue;lst=by[code]||(by[code]=[]);rn=_rusName(nm);dup=false;for(x=0;x<lst.length;x++){if(lst[x].p===price){dup=true;break;}}if(!dup)lst.push({p:price,n:rn});}return by;}
function applyPriceUpdates(){if(!PRICE_CSV_URL)return;var ctrl=("AbortController" in window)?new AbortController():null;var to=setTimeout(function(){if(ctrl){try{ctrl.abort();}catch(e){}}},6000);fetch(PRICE_CSV_URL,{cache:"no-store",signal:ctrl?ctrl.signal:undefined}).then(function(r){if(!r.ok)throw 0;return r.text();}).then(function(txt){clearTimeout(to);var by=parsePriceCSV(txt),n=0,code,targets,cands,t,ti,z,np,hint,f,cat,it;for(code in PRICEMAP){if(!PRICEMAP.hasOwnProperty(code))continue;cands=by[code];if(!cands||!cands.length)continue;targets=PRICEMAP[code];for(ti=0;ti<targets.length;ti++){t=targets[ti];if(cands.length===1){np=cands[0].p;}else{hint=t[4];if(!hint)continue;f=null;for(z=0;z<cands.length;z++){if(cands[z].n.indexOf(hint)>=0){f=cands[z].p;break;}}if(f===null)continue;np=f;}if(!(np>0))continue;cat=CATS[t[0]];if(!cat)continue;it=cat.items&&cat.items[t[1]];if(!it||!Array.isArray(it[2]))continue;if(it[2][t[2]]===t[3]){it[2][t[2]]=np;if(np!==t[3])n++;}}}if(n>0){try{renderTabs();renderItems();if(typeof cart!=="undefined"&&cart&&cart.length){renderCart();}}catch(e){}}}).catch(function(){clearTimeout(to);});}

'''.replace("__PMM__", pmm)

anchor="/*--- init ---*/\nfunction init(){"
assert s.count(anchor)==1, "init anchor %d"%s.count(anchor)
s=s.replace(anchor, BLOCK+anchor)

call_anchor='}\nif(document.readyState!=="loading")init();else document.addEventListener("DOMContentLoaded",init);'
assert s.count(call_anchor)==1, "call anchor %d"%s.count(call_anchor)
s=s.replace(call_anchor, '  applyPriceUpdates();\n'+call_anchor)

open(F,"w",encoding='utf-8').write(s)
print("sync layer v2 injected. codes:", pmm.count("["), "(approx). PRICE_CSV_URL empty -> baked prices.")

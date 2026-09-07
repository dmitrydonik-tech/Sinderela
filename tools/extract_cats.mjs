// ⚠ Пути внутри — абсолютные к build-сессии. Перед запуском замени под свой репозиторий. См. tools/README.md
import { chromium } from "playwright-core";
import { writeFileSync } from "fs";
const b = await chromium.launch({executable:"/sessions/awesome-ecstatic-tesla/.cache/ms-playwright/chromium-1228/chrome-linux/chrome",args:["--no-sandbox"]});
const p = await b.newPage();
await p.goto("file:///sessions/awesome-ecstatic-tesla/mnt/SinderelaMD/index.html");
await p.waitForTimeout(500);
const data = await p.evaluate(()=>{
  const flat=[];
  CATS.forEach((c,ci)=>{
    const gvars = (c.variants||[]).map(v=>v[1]); // group-level variant RU labels (dye etc.)
    (c.items||[]).forEach((it,ii)=>{
      flat.push({
        ci, ii,
        catId: c.id,
        catName: Array.isArray(c.name)? c.name[0] : c.name,
        sur: c.sur||null,
        gvars,
        name: it[0],
        prices: it[2],
        it6: it[6]!==undefined? it[6] : null,  // per-item variants OR sizes (2D)
        d6: it[3]!==undefined? it[3] : null
      });
    });
  });
  return {nCats:CATS.length, flat};
});
writeFileSync("/sessions/awesome-ecstatic-tesla/mnt/outputs/cats.json", JSON.stringify(data,null,1));
console.log("cats:", data.nCats, "items:", data.flat.length);
await b.close();

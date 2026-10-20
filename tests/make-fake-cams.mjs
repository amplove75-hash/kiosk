// 인쇄 페이지에서 바코드를 크게 띄워 캡처한 뒤, 가짜 카메라 영상(.y4m)으로 만든다
import { chromium } from "playwright";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
const BASE = process.env.BASE ?? "http://localhost:4173/";
const OUT = "tests/fake-cams";
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME });
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
await p.goto(BASE + "#/print");
await p.waitForSelector(".pcard");
for (const code of ["KX-CARD-0001", "KX-CARD-9999", "KX-MEM-CAFE-0001"]) {
  await p.locator(".pcard", { hasText: code }).click();
  await p.waitForSelector(".big-code-box svg");
  await p.waitForTimeout(200);
  const png = `${OUT}/${code}.png`;
  await p.locator(".big-code-box").screenshot({ path: png });
  await p.locator(".modal .btn.primary").click();
  execFileSync("python3", ["tests/png2y4m.py", png, `${OUT}/${code}.y4m`]);
}
// 마트 상품 바코드 (EAN-13)
await p.locator(".pprod", { hasText: "흰 우유" }).click();
await p.waitForSelector(".big-code-box svg");
await p.waitForTimeout(200);
await p.locator(".big-code-box").screenshot({ path: `${OUT}/PRODUCT-MILK.png` });
await p.locator(".modal .btn.primary").click();
execFileSync("python3", ["tests/png2y4m.py", `${OUT}/PRODUCT-MILK.png`, `${OUT}/PRODUCT-MILK.y4m`]);
// 인쇄 크기 그대로의 상품 라벨(라면)
await p.goto(BASE + "#/print/products");
await p.waitForSelector(".pprod .bc rect");
await p.emulateMedia({ media: "print" });
await p.setViewportSize({ width: 794, height: 1123 });
await p.waitForTimeout(300);
await p.locator(".pprod", { hasText: "라면" }).first().screenshot({ path: `${OUT}/LABEL-RAMEN.png` });
execFileSync("python3", ["tests/png2y4m.py", `${OUT}/LABEL-RAMEN.png`, `${OUT}/LABEL-RAMEN.y4m`]);
await p.emulateMedia({ media: "screen" });
await p.setViewportSize({ width: 1200, height: 900 });
await p.screenshot({ path: "tests/shots/6-print.png", fullPage: true });
await b.close();
console.log("fake cams ready");

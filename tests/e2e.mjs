// E2E: 카페 키오스크 따라하기 완주 + 혼자 해보기(미션1: 아이스 아메리카노 1잔 샷추가) 완주
// 실행: npm run build && npx vite preview --port 4173 & node tests/e2e.mjs
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:4173/";
const SHOTS = process.env.SHOTS ?? "tests/shots";
fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (m) => { console.error("FAIL:", m); process.exitCode = 1; };

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? "/opt/pw-browsers/chromium",
});

async function guideRun() {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE);
  await page.screenshot({ path: `${SHOTS}/1-home.png`, fullPage: true });
  await page.click("a[href='#/kiosk/cafe']");
  await page.waitForSelector(".kdevice");

  // 잘못된 곳을 누르면 막혀야 한다
  await sleep(300);
  await page.click("[data-guide='order-takeout']", { force: true });
  const toast = await page.textContent(".toast").catch(() => "");
  if (!toast?.includes("다음")) fail("info 단계에서 터치가 막히지 않음: " + toast);

  for (let guard = 0; guard < 60; guard++) {
    if (await page.$(".panel.success")) break;
    const say = await page.textContent(".bubble .say").catch(() => null);
    if (!say) { await sleep(300); continue; }
    const next = await page.$(".bubble button:has-text('다음 ▶')");
    if (next) {
      await next.click();
    } else {
      const meta = await page.textContent(".bubble .step-no");
      const target = await page.evaluate(() => {
        const box = document.querySelector(".guide-box");
        return box ? true : false;
      });
      if (!target) fail("강조 상자가 없음: " + meta);
      if (say.includes("기다려")) { await sleep(800); continue; }
      // 현재 단계의 대상 찾기: 말풍선과 같은 순서로 data-guide를 누른다
      const t = await page.getAttribute('.device-wrap', 'data-guide-step');
      await page.click(`.device-wrap [data-guide='${t}']`);
      if (guard === 12) await page.screenshot({ path: `${SHOTS}/2-guide-mid.png` });
    }
    await sleep(550);
  }
  if (!(await page.$(".panel.success"))) fail("따라하기 완주 실패");
  await page.screenshot({ path: `${SHOTS}/3-guide-done.png` });
  if (errors.length) fail("페이지 오류: " + errors.join(" | "));
  await page.close();
}

async function practiceRun() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto(BASE + "#/kiosk/cafe");
  await page.waitForSelector(".kdevice");
  await page.click("button:has-text('혼자 해보기')");
  await sleep(400);
  const tap = async (sel) => { await page.click(sel); await sleep(550); };
  await tap("[data-guide='order-dine']");
  await tap("[data-guide='tab-coffee']");
  await tap("[data-guide='item-americano']");
  // 온도를 안 고르면 선택완료가 비활성
  if (!(await page.isDisabled("[data-guide='opt-done']"))) fail("온도 미선택인데 선택완료 활성");
  await tap("[data-guide='opt-temp-ICED']");
  await tap("[data-guide='opt-shot']");
  await page.screenshot({ path: `${SHOTS}/4-mobile-sheet.png` });
  await tap("[data-guide='opt-done']");
  await tap("[data-guide='btn-checkout']");
  await tap("[data-guide='btn-next']");
  // 카메라 없이 멤버십 적립 + 쿠폰 사용 (대체 버튼)
  await tap("[data-guide='member-open']");
  await tap("[data-guide='scan-fallback']");
  await tap("[data-guide='coupon-open']");
  await tap("[data-guide='scan-fallback']");
  await tap("[data-guide='member-next']");
  await tap("[data-guide='pay-cash']");
  const cash = await page.textContent(".kscreen");
  if (!cash.includes("현금을 받지 않아요")) fail("현금 안내 없음");
  await tap("[data-guide='btn-other-pay']");
  await tap("[data-guide='pay-card']");
  await tap("[data-guide='card-slot']");
  await sleep(2800);
  await tap("[data-guide='card-slot']");
  if (!(await page.isDisabled("[data-guide='btn-receipt-ok']"))) fail("영수증 안 챙겼는데 확인 활성");
  await tap("[data-guide='receipt-slot']");
  await page.screenshot({ path: `${SHOTS}/5-mobile-receipt.png`, fullPage: true });
  await tap("[data-guide='btn-receipt-ok']");
  const r = await page.textContent(".receipt-paper");
  if (!r.includes("(ICED) 아메리카노") || !r.includes("샷 추가") || !r.includes("쿠폰 할인") || !r.includes("3,000원") || !r.includes("스탬프 1개")) fail("영수증 내용 틀림: " + r);
  if (!(await page.$(".panel.success"))) fail("혼자 해보기 완주 실패");
  await page.close();
}

await guideRun();
await practiceRun();
await browser.close();
console.log(process.exitCode ? "E2E 실패" : "E2E 통과");

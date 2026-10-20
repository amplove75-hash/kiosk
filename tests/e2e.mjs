// E2E: 카페·마트 키오스크 따라하기 완주 + 혼자 해보기 완주
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

async function guideRun(id = "cafe") {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE);
  if (id === "cafe") await page.screenshot({ path: `${SHOTS}/1-home.png`, fullPage: true });
  await page.click(`a[href='#/kiosk/${id}']`);
  await page.waitForSelector(".kdevice, .ktablet");
  // 기본은 혼자 해보기 — 따라하기로 바꾼다
  if (await page.$(".bubble")) fail(`[${id}] 기본값이 따라하기임`);
  await page.click("button:has-text('따라하기')");

  // 잘못된 곳을 누르면 막혀야 한다
  await sleep(300);
  const wrong = { cafe: "[data-guide='order-takeout']", burger: "[data-guide='order-dine']", mart: "[data-guide='tray-apple']", restaurant: "[data-guide='start']" }[id];
  await page.click(wrong, { force: true });
  const toast = await page.textContent(".toast").catch(() => "");
  if (!toast?.includes("다음")) fail(`[${id}] info 단계에서 터치가 막히지 않음: ` + toast);

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
      if (guard === 12) await page.screenshot({ path: `${SHOTS}/2-guide-mid-${id}.png` });
    }
    await sleep(550);
  }
  if (!(await page.$(".panel.success"))) fail(`[${id}] 따라하기 완주 실패`);
  await page.screenshot({ path: `${SHOTS}/3-guide-done-${id}.png` });
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

async function martPractice() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE + "#/kiosk/mart");
  await page.waitForSelector(".kdevice");
  await page.click("button:has-text('혼자 해보기')");
  await sleep(400);
  const tap = async (sel) => { await page.click(sel); await sleep(550); };
  // 시작 전에 장바구니를 누르면 안내만 나온다
  await tap("[data-guide='tray-milk']");
  await tap("[data-guide='start-btn']");
  if (!(await page.isDisabled("[data-guide='btn-pay']"))) fail("상품이 없는데 결제하기 활성");
  await tap("[data-guide='tray-milk']");
  await tap("[data-guide='tray-ramen']");
  await tap("[data-guide='tray-apple']");
  await tap("[data-guide='tray-ramen']");          // 같은 상품을 한 번 더 찍으면 수량 +1
  await tap("[data-guide='qty-plus-milk']");       // 우유 2개
  await page.click(".mart-row:has-text('사과') .k-x"); await sleep(550);   // 사과 빼기
  await page.screenshot({ path: `${SHOTS}/10-mart-scan.png`, fullPage: true });
  const list = await page.textContent(".mart-list");
  if (list.includes("사과")) fail("사과가 빠지지 않음");
  const total = await page.textContent(".mart-total");
  if (!total.includes("4") || !total.includes("7,500원")) fail("합계 틀림: " + total);   // 우유 2×2,800 + 라면 2×950
  await tap("[data-guide='btn-pay']");
  if (!(await page.isDisabled("[data-guide='bag-next']"))) fail("봉투 미선택인데 다음 활성");
  await tap("[data-guide='bag-paper']");
  await tap("[data-guide='bag-next']");
  await tap("[data-guide='member-open']");
  await tap("[data-guide='scan-fallback']");
  const note = await page.textContent(".k-note.ok");
  if (!note.includes("1,250P") || !note.includes("1,325P")) fail("포인트 계산 틀림: " + note);  // 7,500 × 1% = 75P
  await tap("[data-guide='member-next']");
  await tap("[data-guide='pay-card']");
  await tap("[data-guide='card-slot']");
  await sleep(2800);
  await tap("[data-guide='card-slot']");
  await tap("[data-guide='receipt-slot']");
  await tap("[data-guide='btn-receipt-ok']");
  const r = await page.textContent(".receipt-paper");
  if (!r.includes("나인마트") || !r.includes("종이봉투") || !r.includes("7,600원") || !r.includes("75P")) fail("마트 영수증 틀림: " + r);
  if (!(await page.$(".panel.success"))) fail("마트 혼자 해보기 완주 실패");
  await page.screenshot({ path: `${SHOTS}/11-mart-done.png`, fullPage: true });
  if (errors.length) fail("페이지 오류: " + errors.join(" | "));
  await page.close();
}

await guideRun("cafe");
await practiceRun();
async function burgerPractice() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE + "#/kiosk/burger");
  await page.waitForSelector(".kdevice");
  await page.click("button:has-text('혼자 해보기')");
  await sleep(400);
  const tap = async (sel) => { await page.click(sel); await sleep(550); };
  await tap("[data-guide='order-dine']");
  await tap("[data-guide='tab-burger']");
  await tap("[data-guide='item-cheese']");
  await tap("[data-guide='set-large']");
  await tap("[data-guide='side-nugget']");
  await tap("[data-guide='sheet-next']");
  await tap("[data-guide='drink-orange']");
  await page.screenshot({ path: `${SHOTS}/13-burger-drink.png` });
  await tap("[data-guide='sheet-next']");
  await tap("[data-guide='sheet-plus']");
  await tap("[data-guide='sheet-add']");
  await tap("[data-guide='tab-dessert']");
  await tap("[data-guide='item-cone']");
  await tap("[data-guide='sheet-add']");
  const cart = await page.textContent(".k-cart");
  if (!cart.includes("21,400원") || !cart.includes("치즈버거 라지세트")) fail("버거 장바구니 틀림: " + cart);  // (5,900+2,800+700+800)×2 + 1,000
  await tap("[data-guide='btn-checkout']");
  await tap("[data-guide='btn-next']");
  await tap("[data-guide='pay-card']");
  await tap("[data-guide='card-slot']");
  await sleep(2800);
  await tap("[data-guide='card-slot']");
  await tap("[data-guide='receipt-slot']");
  await tap("[data-guide='btn-receipt-ok']");
  const r = await page.textContent(".receipt-paper");
  if (!r.includes("나인버거") || !r.includes("(L) 너겟 4조각") || !r.includes("(L) 오렌지주스") || !r.includes("21,400원")) fail("버거 영수증 틀림: " + r);
  if (!(await page.$(".panel.success"))) fail("버거 혼자 해보기 완주 실패");
  await page.screenshot({ path: `${SHOTS}/14-burger-done.png`, fullPage: true });
  if (errors.length) fail("페이지 오류: " + errors.join(" | "));
  await page.close();
}

async function restaurantPractice() {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE + "#/kiosk/restaurant");
  await page.waitForSelector(".ktablet");
  await page.click("button:has-text('혼자 해보기')");
  await sleep(400);
  const tap = async (sel) => { await page.click(sel); await sleep(550); };
  await tap("[data-guide='start']");
  await tap("[data-guide='item-jeyuk']");
  await tap("[data-guide='sheet-add']");
  await page.screenshot({ path: `${SHOTS}/15-resto-menu.png` });
  await tap("[data-guide='cart-btn']");
  await tap("[data-guide='order-btn']");
  await tap("[data-guide='order-confirm']");
  await tap("[data-guide='order-done-ok']");
  // 추가 주문
  await tap("[data-guide='cat-drink']");
  await tap("[data-guide='item-cola']");
  await tap("[data-guide='sheet-add']");
  await tap("[data-guide='cart-btn']");
  await tap("[data-guide='order-btn']");
  await tap("[data-guide='order-confirm']");
  await tap("[data-guide='order-done-ok']");
  // 직원 호출: 앞접시 + 수저
  await tap("[data-guide='call-btn']");
  if (!(await page.isDisabled("[data-guide='call-send']"))) fail("아무것도 안 골랐는데 호출하기 활성");
  await tap("[data-guide='call-plate']");
  await tap("[data-guide='call-spoon']");
  await tap("[data-guide='call-send']");
  const sent = await page.textContent(".k-dialog");
  if (!sent.includes("앞접시, 수저")) fail("호출 내용 틀림: " + sent);
  await tap("[data-guide='call-ok']");
  await tap("[data-guide='history-btn']");
  const hist = await page.textContent(".resto-history");
  if (!hist.includes("1차 주문") || !hist.includes("2차 주문") || !hist.includes("11,000원")) fail("주문내역 틀림: " + hist);
  await tap("[data-guide='pay-request']");
  await tap("[data-guide='bill-ok']");
  const r = await page.textContent(".receipt-paper");
  if (!r.includes("나인식당") || !r.includes("7번") || !r.includes("카운터에서 결제") || !r.includes("11,000원")) fail("식당 내역서 틀림: " + r);
  if (!(await page.$(".panel.success"))) fail("식당 혼자 해보기 완주 실패");
  await page.screenshot({ path: `${SHOTS}/16-resto-done.png`, fullPage: true });
  if (errors.length) fail("페이지 오류: " + errors.join(" | "));
  await page.close();
}

await guideRun("mart");
await martPractice();
await guideRun("burger");
await burgerPractice();
await guideRun("restaurant");
await restaurantPractice();
await browser.close();
console.log(process.exitCode ? "E2E 실패" : "E2E 통과");

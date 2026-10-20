// 가짜 카메라(인쇄 카드 영상)로 실제 바코드 인식을 시험한다
// 준비: node tests/make-fake-cams.mjs
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:4173/";
const CAMS = "tests/fake-cams";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (m) => { console.error("FAIL:", m); process.exitCode = 1; };

async function withCam(code, fn) {
  const b = await chromium.launch({
    executablePath: process.env.CHROME,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", `--use-file-for-fake-video-capture=${CAMS}/${code}.y4m`],
  });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.grantPermissions(["camera"], { origin: new URL(BASE).origin });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => fail("page error: " + e.message));
  try { await fn(page); } finally { await b.close(); }
}

async function orderToMember(page) {
  await page.goto(BASE + "#/kiosk/cafe");
  await page.click("button:has-text('혼자 해보기')");
  const tap = async (sel) => { await page.click(sel); await sleep(500); };
  await tap("[data-guide='order-dine']");
  await tap("[data-guide='tab-coffee']");
  await tap("[data-guide='item-americano']");
  await tap("[data-guide='opt-temp-ICED']");
  await tap("[data-guide='opt-done']");
  await tap("[data-guide='btn-checkout']");
  await tap("[data-guide='btn-next']");
  return tap;
}

// 1) 정상 카드: 멤버십 칸에 신용카드를 비추면 거절, 결제 칸에서는 자동 결제
await withCam("KX-CARD-0001", async (page) => {
  const tap = await orderToMember(page);
  await tap("[data-guide='member-open']");
  await page.waitForSelector(".sc-msg.bad", { timeout: 15000 }).catch(() => fail("멤버십 칸에서 신용카드를 거절하지 않음"));
  const m = await page.textContent(".sc-msg").catch(() => "");
  if (!m.includes("체험 신용카드")) fail("거절 문구 이상: " + m);
  await tap("[data-guide='member-next']");
  await tap("[data-guide='pay-card']");
  await page.waitForSelector(".k-spinner", { timeout: 15000 }).catch(() => fail("카메라 카드 인식으로 결제가 시작되지 않음"));
  await page.screenshot({ path: "tests/shots/7-cam-paying.png" });
  console.log("✓ 정상 카드 인식 → 결제 진행");
});

// 2) 잔액 부족 카드
await withCam("KX-CARD-9999", async (page) => {
  const tap = await orderToMember(page);
  await tap("[data-guide='member-next']");
  await tap("[data-guide='pay-card']");
  await page.waitForSelector("text=잔액이 부족합니다", { timeout: 15000 }).catch(() => fail("잔액 부족 안내가 나오지 않음"));
  await page.screenshot({ path: "tests/shots/8-cam-insufficient.png" });
  console.log("✓ 잔액 부족 카드 → 오류 안내");
});

// 3) 멤버십 카드 적립 (따라하기 중 잠깐 벗어나도 OK인지 겸사겸사: 혼자 해보기로)
await withCam("KX-MEM-CAFE-0001", async (page) => {
  const tap = await orderToMember(page);
  await tap("[data-guide='member-open']");
  await page.waitForSelector(".k-note.ok", { timeout: 15000 }).catch(() => fail("멤버십 적립 안 됨"));
  const t = await page.textContent(".k-note.ok");
  if (!t.includes("홍길동") || !t.includes("5개")) fail("스탬프 계산 이상: " + t);
  await page.screenshot({ path: "tests/shots/9-cam-member.png" });
  console.log("✓ 멤버십 카드 인식 → 스탬프 적립");
});

// 4) 마트: 상품 바코드를 카메라로 찍으면 목록에 담긴다 (같은 상품을 계속 비추면 1.5초마다 한 개씩)
await withCam("PRODUCT-MILK", async (page) => {
  await page.goto(BASE + "#/kiosk/mart");
  await page.click("button:has-text('혼자 해보기')");
  await sleep(400);
  await page.click("[data-guide='start-btn']");
  await page.waitForSelector(".mart-row:has-text('흰 우유')", { timeout: 15000 }).catch(() => fail("상품 바코드 인식 안 됨"));
  await page.screenshot({ path: "tests/shots/12-cam-mart.png" });
  console.log("✓ 마트 상품 바코드 인식 → 목록에 담김");
});

// 5) 마트 회원 적립 칸에 카페 멤버십을 비추면 거절
await withCam("KX-MEM-CAFE-0001", async (page) => {
  await page.goto(BASE + "#/kiosk/mart");
  await page.click("button:has-text('혼자 해보기')");
  await sleep(400);
  await page.click("[data-guide='start-btn']"); await sleep(500);
  await page.click("[data-guide='tray-milk']"); await sleep(500);
  await page.click("[data-guide='btn-pay']"); await sleep(500);
  await page.click("[data-guide='bag-none']"); await sleep(500);
  await page.click("[data-guide='bag-next']"); await sleep(500);
  await page.click("[data-guide='member-open']");
  await page.waitForSelector(".sc-msg.bad", { timeout: 15000 }).catch(() => fail("카페 카드를 거절하지 않음"));
  const m = await page.textContent(".sc-msg");
  if (!m.includes("나인마트 회원카드가 아니에요")) fail("거절 문구 이상: " + m);
  console.log("✓ 마트에서 카페 멤버십 카드 → 거절");
});

console.log(process.exitCode ? "카메라 테스트 실패" : "카메라 테스트 통과");

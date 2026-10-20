import type { GuideStep } from "../../engine/types";
import { cartQty, type RestaurantState } from "./RestaurantKiosk";

const ordered = (s: RestaurantState) => s.orders.length > 0;
const finished = (s: RestaurantState) => s.screen === "bill" || s.screen === "done";

/** 따라하기: 김치찌개 2개, 계란말이 1개 주문 → 물 요청 → 계산 요청 */
export const restaurantGuide: GuideStep<RestaurantState>[] = [
  {
    target: "table-no",
    info: true,
    text: "요즘 식당에는 자리마다 주문 태블릿이 있어요. 줄 서지 않고 앉은 자리에서 주문해요. 화면에 내 테이블 번호(7번)가 나와요.",
  },
  { target: "start", text: "화면을 눌러 주문을 시작해요.", until: (s) => s.screen !== "welcome" },
  { target: "cats", info: true, text: "왼쪽에 메뉴 종류가 있어요. 식사, 곁들임, 음료로 나뉘어 있어요." },
  {
    target: "item-kimchi",
    text: "[김치찌개]를 눌러주세요.",
    until: (s) => s.sheet?.itemId === "kimchi" || cartQty(s, "kimchi") > 0 || ordered(s),
  },
  {
    target: "sheet-plus",
    text: "두 사람이 먹을 거라 2개 주문해요. [+]를 눌러주세요.",
    until: (s) => (s.sheet?.itemId === "kimchi" && s.sheet.qty >= 2) || cartQty(s, "kimchi") >= 2 || ordered(s),
  },
  {
    target: "sheet-add",
    text: "[담기]를 눌러주세요.",
    until: (s) => (cartQty(s, "kimchi") >= 2 && !s.sheet) || ordered(s),
  },
  {
    target: "cat-side",
    text: "계란말이도 시켜요. 왼쪽에서 [곁들임]을 눌러주세요.",
    until: (s) => s.category === "side" || cartQty(s, "egg") > 0 || ordered(s),
  },
  {
    target: "item-egg",
    text: "[계란말이]를 눌러주세요.",
    until: (s) => s.sheet?.itemId === "egg" || cartQty(s, "egg") > 0 || ordered(s),
  },
  {
    target: "sheet-add",
    text: "1개면 되니까 바로 [담기]를 눌러주세요.",
    until: (s) => (cartQty(s, "egg") > 0 && !s.sheet) || ordered(s),
  },
  {
    target: "cart-btn",
    text: "담은 메뉴는 장바구니에 있어요. 오른쪽 아래 [장바구니]를 눌러주세요.",
    until: (s) => s.cartOpen || ordered(s),
  },
  {
    target: "cart-list",
    info: true,
    text: "담은 메뉴와 개수를 확인해요. 아직 주문된 게 아니에요! [주문하기]를 눌러야 주방에 전달돼요.",
  },
  { target: "order-btn", text: "[주문하기]를 눌러주세요.", until: (s) => s.confirmOrder || ordered(s) },
  { target: "order-confirm", text: "한 번 더 확인해요. 맞으면 [주문하기]를 눌러주세요.", until: (s) => ordered(s) },
  { target: "order-done-ok", text: "주방으로 주문이 전달됐어요. [확인]을 눌러주세요.", until: (s) => ordered(s) && !s.justOrdered },
  {
    target: "call-btn",
    text: "물이 필요해요. 직원을 부르러 가지 않아도 돼요. 위쪽 [직원 호출]을 눌러주세요.",
    until: (s) => s.callOpen || s.calls.length > 0 || finished(s),
  },
  {
    target: "call-water",
    text: "[물]을 눌러주세요.",
    until: (s) => s.callPick.includes("water") || s.calls.length > 0 || finished(s),
  },
  { target: "call-send", text: "[호출하기]를 눌러주세요.", until: (s) => s.calls.length > 0 || finished(s) },
  { target: "call-ok", text: "직원에게 알렸어요. [확인]을 눌러주세요.", until: (s) => (s.calls.length > 0 && !s.callSent) || finished(s) },
  {
    target: "history-btn",
    text: "식사를 다 마쳤다고 생각해 볼게요. 위쪽 [주문내역]을 눌러주세요.",
    until: (s) => s.historyOpen || finished(s),
  },
  { target: "history-list", info: true, text: "내가 주문한 메뉴와 금액이 맞는지 확인해요." },
  { target: "pay-request", text: "[계산하기]를 눌러주세요.", until: (s) => finished(s) },
  { target: "bill-info", info: true, text: "이 식당은 식사 후 카운터에서 계산해요. 카운터에서 테이블 번호를 말하면 돼요." },
  { target: "bill-ok", text: "[확인했어요]를 눌러 마쳐요.", until: (s) => s.screen === "done" },
];

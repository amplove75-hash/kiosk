import type { GuideStep } from "../../engine/types";
import { payDetour, payGuideSteps } from "../shared/payGuide";
import { qtyOf, type MartState } from "./MartKiosk";

const past = (s: MartState, ...screens: MartState["screen"][]) => screens.includes(s.screen);
const AFTER_SCAN: MartState["screen"][] = ["bag", "member", "payMethod", "cashNotice", "cardInsert", "cardError", "processing", "cardRemove", "receipt", "done"];

/** 따라하기: 흰 우유 1개, 라면 2개 계산하기 */
export const martGuide: GuideStep<MartState>[] = [
  {
    target: "attract-msg",
    info: true,
    text: "셀프계산대는 직원 대신 내가 직접 상품 바코드를 찍고 카드로 계산하는 키오스크예요.",
  },
  {
    target: "start-btn",
    text: "[계산 시작하기]를 눌러보세요.",
    until: (s) => s.screen !== "attract",
  },
  {
    target: "scan-area",
    info: true,
    text: "상품의 바코드를 스캐너(카메라)에 대면 '삑' 소리와 함께 목록에 담겨요. 카메라가 없으면 기계 아래 장바구니의 상품을 누르면 돼요.",
  },
  {
    target: "tray-milk",
    text: "장바구니에서 [흰 우유]를 눌러 바코드를 찍어보세요.",
    until: (s) => qtyOf(s, "milk") > 0 || past(s, ...AFTER_SCAN),
  },
  {
    target: "item-list",
    info: true,
    text: "찍은 상품이 목록에 나와요. 상품 이름과 가격이 맞는지 꼭 확인해요.",
  },
  {
    target: "tray-ramen",
    text: "이번엔 [라면]을 찍어요.",
    until: (s) => qtyOf(s, "ramen") > 0 || past(s, ...AFTER_SCAN),
  },
  {
    target: "qty-plus-ramen",
    text: "라면은 2개 살 거예요. 같은 상품은 한 번 더 찍어도 되고, [+]를 눌러도 돼요. [+]를 눌러보세요.",
    until: (s) => qtyOf(s, "ramen") >= 2 || past(s, ...AFTER_SCAN),
  },
  {
    target: "total",
    info: true,
    text: "아래에 모두 몇 개인지, 합계 금액이 얼마인지 나와요. 우유 1개와 라면 2개, 모두 3개예요.",
  },
  {
    target: "btn-pay",
    text: "다 찍었으면 [결제하기]를 눌러요.",
    until: (s) => past(s, ...AFTER_SCAN),
  },
  {
    target: "bag-none",
    text: "봉투가 필요한지 골라요. 오늘은 장바구니를 가져왔어요. [필요 없어요]를 눌러주세요.",
    until: (s) => s.bag !== null || past(s, "member", "payMethod", "cardInsert", "processing", "cardRemove", "receipt", "done"),
  },
  {
    target: "bag-next",
    text: "[다음]을 눌러주세요.",
    until: (s) => past(s, "member", "payMethod", "cashNotice", "cardInsert", "cardError", "processing", "cardRemove", "receipt", "done"),
  },
  {
    target: "member-options",
    info: true,
    text: "회원카드가 있으면 바코드를 찍어 포인트를 적립할 수 있어요.",
  },
  {
    target: "member-next",
    text: "오늘은 적립 없이 넘어가요. [적립 안 하고 다음]을 눌러주세요.",
    until: (s) => past(s, "payMethod", "cashNotice", "cardInsert", "cardError", "processing", "cardRemove", "receipt", "done"),
  },
  ...payGuideSteps<MartState>({ receiptWhy: "교환이나 환불할 때 영수증이 필요해요." }),
];

export const martDetour = payDetour;

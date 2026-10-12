import type { GuideStep } from "../../engine/types";
import type { CafeState } from "./CafeKiosk";

const past = (s: CafeState, ...screens: CafeState["screen"][]) => screens.includes(s.screen);

/** 따라하기: 교육자료 슬라이드 9~14 순서 그대로 "아이스 아메리카노 1잔" 주문 */
export const cafeGuide: GuideStep<CafeState>[] = [
  {
    target: "order-type",
    info: true,
    text: "키오스크 대기화면이에요. 매장마다 조금씩 다르지만, 보통 ① 먹고 가기 ② 포장하기 두 가지로 주문을 시작해요.",
  },
  {
    target: "order-dine",
    text: "오늘은 매장에서 마시고 갈 거예요. [매장에서 먹어요]를 눌러보세요.",
    until: (s) => s.screen !== "attract",
  },
  {
    target: "btn-home",
    info: true,
    text: "주문방법을 잘못 골랐다면? 오른쪽 위 [처음으로]를 누르면 처음으로 돌아가 다시 고를 수 있어요.",
  },
  {
    target: "tabs",
    info: true,
    text: "위쪽에 메뉴 종류가 나와 있어요. 고르려는 종류를 누르면 그 메뉴들이 나와요.",
  },
  {
    target: "tab-coffee",
    text: "아메리카노는 커피예요. [커피]를 눌러보세요.",
    until: (s) => s.category === "coffee" || !!s.sheet || s.cart.length > 0,
  },
  {
    target: "item-americano",
    text: "[아메리카노] 그림을 눌러주세요.",
    until: (s) => s.sheet?.itemId === "americano" || s.cart.length > 0,
  },
  {
    target: "opt-temp-ICED",
    text: "온도를 골라요. 따뜻한 음료는 HOT, 차가운 음료는 ICED예요. [ICED 차갑게]를 눌러주세요.",
    until: (s) => s.sheet?.temp === "ICED" || s.cart.length > 0,
  },
  {
    target: "opt-qty",
    info: true,
    text: "컵 종류와 수량도 여기서 고를 수 있어요. 수량은 − 와 + 로 바꿔요. 지금은 1잔 그대로 둘게요.",
  },
  {
    target: "opt-done",
    text: "다 골랐으면 [선택완료]를 눌러주세요.",
    until: (s) => !s.sheet && s.cart.length > 0,
  },
  {
    target: "cart",
    info: true,
    text: "화면 아래에 내가 고른 상품, 수량, 합계 금액이 나와요. 잘못 담았으면 × 를 눌러 뺄 수 있어요.",
  },
  {
    target: "btn-checkout",
    text: "주문할 메뉴를 다 담았어요. [결제하기]를 눌러주세요.",
    until: (s) => past(s, "confirm", "payMethod", "cardInsert", "processing", "cardRemove", "receipt", "done"),
  },
  {
    target: "btn-next",
    text: "주문 내역이 맞는지 확인하고 [다음]을 눌러주세요.",
    until: (s) => past(s, "member", "payMethod", "cardInsert", "processing", "cardRemove", "receipt", "done"),
  },
  {
    target: "member-options",
    info: true,
    text: "멤버십 카드가 있으면 여기서 적립하고, 쿠폰도 쓸 수 있어요. 카드의 바코드를 카메라에 비추면 돼요.",
  },
  {
    target: "member-next",
    text: "오늘은 적립 없이 넘어가요. [적립 안 하고 다음]을 눌러주세요.",
    until: (s) => past(s, "payMethod", "cardInsert", "processing", "cardRemove", "receipt", "done"),
  },
  {
    target: "pay-card",
    text: "결제 방법을 골라요. 키오스크는 현금을 받지 않는 곳이 많아요. [신용/체크카드]를 눌러주세요.",
    until: (s) => past(s, "cardInsert", "cardError", "processing", "cardRemove", "receipt", "done"),
  },
  {
    target: "card-slot",
    text: "화면 아래 카드 투입구에 카드를 꽂아요. [카드 투입구]를 눌러보세요. (인쇄한 체험카드가 있으면 바코드를 카메라에 비춰도 돼요.)",
    until: (s) => past(s, "processing", "cardRemove", "receipt", "done"),
  },
  {
    target: "screen-msg",
    text: "결제 중이에요. 이때 카드를 빼면 안 돼요. 잠시 기다려 주세요.",
    until: (s) => past(s, "cardRemove", "receipt", "done"),
  },
  {
    target: "card-slot",
    text: "결제가 끝났어요! 카드를 두고 가는 분이 많아요. [카드 투입구]를 눌러 카드를 뽑아 챙기세요.",
    until: (s) => past(s, "receipt", "done"),
  },
  {
    target: "receipt-slot",
    text: "영수증이 나왔어요. 영수증에 적힌 주문번호는 음료를 받을 때 필요해요. [영수증]을 눌러 챙기세요.",
    until: (s) => s.receiptTaken || s.screen === "done",
  },
  {
    target: "btn-receipt-ok",
    text: "카드와 영수증을 모두 챙겼어요. [확인]을 눌러 주문을 마쳐요.",
    until: (s) => s.screen === "done",
  },
];

/** 안내 순서를 벗어난 상황(예: 잔액 부족 카드를 비춤)에서는 막지 않고 이 말을 보여준다 */
export function cafeDetour(s: CafeState): string | null {
  if (s.screen === "cardError")
    return "잔액이 부족한 카드를 비췄어요. 실제로도 자주 있는 일이에요. [다른 카드로 결제]를 누르고 다른 카드를 쓰거나 카드 투입구를 누르세요.";
  return null;
}

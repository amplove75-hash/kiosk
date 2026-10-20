import type { GuideStep } from "../../engine/types";
import { payDetour, payGuideSteps } from "../shared/payGuide";
import type { BurgerState } from "./BurgerKiosk";

const past = (s: BurgerState, ...screens: BurgerState["screen"][]) => screens.includes(s.screen);
const PAYING: BurgerState["screen"][] = ["confirm", "payMethod", "cashNotice", "cardInsert", "cardError", "processing", "cardRemove", "receipt", "done"];
const added = (s: BurgerState) => s.cart.some((l) => l.itemId === "bulgogi") || past(s, ...PAYING);

/** 따라하기: 불고기버거 세트(음료는 사이다로 바꾸기) 포장 주문 */
export const burgerGuide: GuideStep<BurgerState>[] = [
  {
    target: "order-type",
    info: true,
    text: "패스트푸드점 키오스크예요. 카페처럼 먹고 갈지, 포장할지부터 골라요.",
  },
  {
    target: "order-takeout",
    text: "오늘은 포장해서 가져갈 거예요. [포장해서 갈게요]를 눌러주세요.",
    until: (s) => s.screen !== "attract",
  },
  {
    target: "tab-burger",
    text: "위쪽 메뉴 종류에서 [버거]를 눌러주세요.",
    until: (s) => s.category === "burger" || !!s.sheet || added(s),
  },
  {
    target: "item-bulgogi",
    text: "[불고기버거]를 눌러주세요.",
    until: (s) => s.sheet?.itemId === "bulgogi" || added(s),
  },
  {
    target: "set-options",
    info: true,
    text: "버거는 단품(버거만), 세트(버거+감자튀김+음료), 라지세트(사이드와 음료가 큰 것) 중에 골라요. 세트가 하나씩 사는 것보다 저렴해요.",
  },
  {
    target: "set-set",
    text: "[세트]를 눌러주세요.",
    until: (s) => (s.sheet?.setType === "set" && s.sheet.step !== "type") || added(s),
  },
  {
    target: "side-options",
    info: true,
    text: "세트에 들어갈 사이드를 골라요. 기본은 감자튀김이고, 다른 걸로 바꾸면 돈이 조금 더 붙기도 해요. 감자튀김 그대로 둘게요.",
  },
  {
    target: "sheet-next",
    text: "[다음]을 눌러주세요.",
    until: (s) => s.sheet?.step === "drink" || s.sheet?.step === "qty" || added(s),
  },
  {
    target: "drink-cider",
    text: "음료는 기본이 콜라예요. 사이다로 바꿔볼게요. [사이다]를 눌러주세요.",
    until: (s) => s.sheet?.drink === "cider" || added(s),
  },
  {
    target: "sheet-next",
    text: "[다음]을 눌러주세요.",
    until: (s) => s.sheet?.step === "qty" || added(s),
  },
  {
    target: "sheet-summary",
    info: true,
    text: "고른 내용이 맞는지 확인해요. 불고기버거, 감자튀김, 사이다. 수량은 1개예요.",
  },
  {
    target: "sheet-add",
    text: "[장바구니 담기]를 눌러주세요.",
    until: (s) => added(s) && !s.sheet,
  },
  {
    target: "cart",
    info: true,
    text: "화면 아래에 '불고기버거 세트'가 담겼어요. 아래 작은 글씨로 감자튀김·사이다가 보여요.",
  },
  {
    target: "btn-checkout",
    text: "[결제하기]를 눌러주세요.",
    until: (s) => past(s, ...PAYING),
  },
  {
    target: "btn-next",
    text: "주문 내역을 확인하고 [다음]을 눌러주세요.",
    until: (s) => past(s, "payMethod", "cashNotice", "cardInsert", "cardError", "processing", "cardRemove", "receipt", "done"),
  },
  ...payGuideSteps<BurgerState>({ receiptWhy: "영수증의 주문번호가 안내 화면에 뜨면 받으러 가요." }),
];

export const burgerDetour = payDetour;

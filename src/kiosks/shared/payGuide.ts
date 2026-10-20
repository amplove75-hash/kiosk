import type { GuideStep } from "../../engine/types";

type PayLike = { screen: string; receiptTaken: boolean };
const ORDER = ["payMethod", "cashNotice", "cardInsert", "cardError", "processing", "cardRemove", "receipt", "done"];
const pastAny = (s: PayLike, ...screens: string[]) => screens.includes(s.screen);

/** 결제방식 고르기부터 영수증까지, 모든 키오스크에 공통인 따라하기 단계 */
export function payGuideSteps<S extends PayLike>(opts: { receiptWhy: string }): GuideStep<S>[] {
  return [
    {
      target: "pay-card",
      text: "결제 방법을 골라요. 키오스크는 현금을 받지 않는 곳이 많아요. [신용/체크카드]를 눌러주세요.",
      until: (s) => pastAny(s, "cardInsert", "cardError", "processing", "cardRemove", "receipt", "done"),
    },
    {
      target: "card-slot",
      text: "화면 아래 카드 투입구에 카드를 꽂아요. [카드 투입구]를 눌러보세요. (인쇄한 체험카드가 있으면 바코드를 카메라에 비춰도 돼요.)",
      until: (s) => pastAny(s, "processing", "cardRemove", "receipt", "done"),
    },
    {
      target: "screen-msg",
      text: "결제 중이에요. 이때 카드를 빼면 안 돼요. 잠시 기다려 주세요.",
      until: (s) => pastAny(s, "cardRemove", "receipt", "done"),
    },
    {
      target: "card-slot",
      text: "결제가 끝났어요! 카드를 두고 가는 분이 많아요. [카드 투입구]를 눌러 카드를 뽑아 챙기세요.",
      until: (s) => pastAny(s, "receipt", "done"),
    },
    {
      target: "receipt-slot",
      text: `영수증이 나왔어요. ${opts.receiptWhy} [영수증]을 눌러 챙기세요.`,
      until: (s) => s.receiptTaken || s.screen === "done",
    },
    {
      target: "btn-receipt-ok",
      text: "카드와 영수증을 모두 챙겼어요. [확인]을 눌러 마쳐요.",
      until: (s) => s.screen === "done",
    },
  ];
}

export function payDetour(s: PayLike): string | null {
  if (s.screen === "cardError")
    return "잔액이 부족한 카드를 비췄어요. 실제로도 자주 있는 일이에요. [다른 카드로 결제]를 누르고 다른 카드를 쓰거나 카드 투입구를 누르세요.";
  return null;
}
export { ORDER as PAY_ORDER };

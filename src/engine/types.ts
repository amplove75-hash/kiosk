import type { ComponentType } from "react";

/** 따라하기 모드의 한 단계 */
export type GuideStep<S> = {
  /** 강조할 요소의 data-guide 값 */
  target: string;
  /** 화면 옆 말풍선 + 음성으로 읽어줄 설명 */
  text: string;
  /** 이 조건이 참이 되면 다음 단계로 넘어간다 */
  until?: (s: S) => boolean;
  /** 설명만 하는 단계: 키오스크 터치를 막고 [다음] 버튼으로 넘어간다 */
  info?: boolean;
};

export type ReceiptLine = { name: string; detail?: string; qty: number; amount: number };
export type OrderResult = {
  shop: string;
  orderNo: string;
  total: number;
  lines: ReceiptLine[];
  when: string;
  extra?: string;
  notes?: string[];
  /** 영수증의 번호 이름 (기본: 주문번호) */
  numberLabel?: string;
  /** 결제 방법 표시 (기본: 신용카드(연습용)) */
  payment?: string;
};

export type KioskProps<S> = {
  onState: (s: S) => void;
  onComplete: (r: OrderResult) => void;
  onReceipt: (r: OrderResult) => void;
};

export type Mode = "guide" | "practice";

export type KioskDef<S = any> = {
  id: string;
  place: string;          // "카페"
  brand: string;          // 가상 브랜드 "CAFE NINE"
  group: "food" | "ticket" | "life";
  icon: keyof typeof import("../components/Icons").Icon;
  summary: string;
  status: "ready" | "soon";
  Component?: ComponentType<KioskProps<S>>;
  guideTitle?: string;
  guide?: GuideStep<S>[];
  /** 따라하기 중 순서를 벗어났을 때 보여줄 안내 (null이면 정상 진행) */
  guideDetour?: (s: S) => string | null;
  /** wide: 가로형 태블릿처럼 넓은 기계 — 체험 페이지에서 기계를 위아래로 크게 놓는다 */
  layout?: "wide";
  /** 이 키오스크 연습에 쓰는 인쇄물 (체험 페이지 옆에 링크로 보여준다) */
  printables?: { to: string; label: string; note: string }[];
  /** 혼자 해보기에서 [직원 호출]을 누르면 보여줄 도움말 */
  hint?: (s: S) => string;
};

import { PRACTICE_CARDS, PRODUCTS, type CardKind, type PracticeCard, type Product } from "../data/practiceCards";

export type ScanKind = CardKind | "product";
export type Scanned =
  | { kind: CardKind; code: string; label: string; card: PracticeCard }
  | { kind: "product"; code: string; label: string; product: Product }
  | { kind: "invalid"; code: string; label: string };

export const KIND_LABEL: Record<ScanKind, string> = {
  card: "체험 신용카드",
  member: "멤버십 카드",
  coupon: "쿠폰",
  patient: "환자카드",
  id: "본인확인 연습카드",
  parking: "주차권",
  discount: "주차 할인권",
  rail: "예매번호",
  product: "상품 바코드",
};

/** 연습용 코드만 받아들인다. 그 밖의 코드는 모두 invalid. */
export function parseCode(raw: string): Scanned {
  const code = raw.trim().toUpperCase();
  const card = PRACTICE_CARDS.find((c) => c.code === code);
  if (card) return { kind: card.kind, code, label: card.title, card };
  if (/^2\d{12}$/.test(code)) {
    const product = PRODUCTS.find((p) => p.code === code);
    if (product) return { kind: "product", code, label: product.name, product };
  }
  return { kind: "invalid", code, label: "연습용이 아닌 바코드" };
}

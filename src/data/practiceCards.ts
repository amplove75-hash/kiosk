// 연습용 카드·회원권·티켓. 모든 코드는 "KX-"로 시작한다(실제 카드와 절대 겹치지 않게).
// 상품 바코드는 EAN-13 중 "2"로 시작하는 매장 내부용 번호대만 쓴다(실제 판매 상품 번호가 아님).

export type CardKind = "card" | "member" | "coupon" | "patient" | "id" | "parking" | "discount" | "rail";

export type PracticeCard = {
  code: string;
  kind: CardKind;
  title: string;      // 카드에 크게 적히는 이름
  sub: string;        // 설명
  band: string;       // 카드 색
  format: "CODE128" | "QR";
  // 종류별 추가 정보
  balance?: number;
  shop?: "cafe" | "mart";
  holder?: string;
  stamps?: number;
  points?: number;
  amount?: number;
  car?: string;
  hours?: number;
  inTime?: string;
  trip?: string;
};

export const PRACTICE_CARDS: PracticeCard[] = [
  { code: "KX-CARD-0001", kind: "card", title: "체험 신용카드", sub: "결제가 잘 되는 카드", band: "#3a69d4", format: "CODE128", balance: 1_000_000 },
  { code: "KX-CARD-9999", kind: "card", title: "잔액 부족 카드", sub: "결제가 안 되는 카드 (오류 연습)", band: "#6b7280", format: "CODE128", balance: 0 },
  { code: "KX-MEM-CAFE-0001", kind: "member", title: "CAFE NINE 멤버십", sub: "스탬프 10개 모으면 음료 1잔", band: "#d3261e", format: "CODE128", shop: "cafe", holder: "홍길동", stamps: 4 },
  { code: "KX-CPN-1000", kind: "coupon", title: "CAFE NINE 쿠폰", sub: "1,000원 할인", band: "#f08a00", format: "CODE128", amount: 1000 },
  { code: "KX-MEM-MART-0001", kind: "member", title: "나인마트 회원카드", sub: "구매 금액의 1% 포인트 적립", band: "#1b8754", format: "CODE128", shop: "mart", holder: "홍길동", points: 1250 },
  { code: "KX-PAT-0001", kind: "patient", title: "나인병원 환자카드", sub: "접수할 때 찍어요", band: "#0f8a8a", format: "CODE128", holder: "홍길동" },
  { code: "KX-ID-0001", kind: "id", title: "본인확인 연습카드", sub: "무인민원발급기 본인확인용", band: "#4b4f8f", format: "CODE128", holder: "홍길동" },
  { code: "KX-PARK-0001", kind: "parking", title: "나인파킹 주차권", sub: "입차 09:12 · 12가 3456", band: "#334155", format: "CODE128", car: "12가 3456", inTime: "09:12" },
  { code: "KX-DC-2H", kind: "discount", title: "주차 할인권", sub: "2시간 무료", band: "#7c3aed", format: "CODE128", hours: 2 },
  { code: "KX-RAIL-RSV-0001", kind: "rail", title: "나인레일 예매번호", sub: "서울 → 부산 · 예매 발권용", band: "#0b6bcb", format: "QR", trip: "서울 → 부산" },
];

export type Product = { code: string; name: string; price: number; color: string; unit: string };

/** EAN-13 체크숫자 계산 */
export function ean13(base12: string) {
  const sum = base12.split("").reduce((a, d, i) => a + Number(d) * (i % 2 ? 3 : 1), 0);
  return base12 + ((10 - (sum % 10)) % 10);
}
const P = (i: number, name: string, price: number, color: string, unit = "1개"): Product => ({
  code: ean13("20090000" + String(i).padStart(4, "0")),
  name, price, color, unit,
});
export const PRODUCTS: Product[] = [
  P(1, "흰 우유", 2800, "#e8f1fb", "1L"),
  P(2, "라면", 950, "#fde2c8", "1봉"),
  P(3, "사과", 4500, "#fbd3d3", "3개"),
  P(4, "두루마리 휴지", 8900, "#eef0f3", "12롤"),
  P(5, "달걀", 6900, "#fff3d6", "10구"),
  P(6, "두부", 1800, "#f6f4ec", "1모"),
  P(7, "생수", 600, "#dcf0fb", "500ml"),
  P(8, "식빵", 3200, "#f4e2c4", "1봉"),
  P(9, "바나나", 3900, "#fff6bf", "1송이"),
  P(10, "주방세제", 4200, "#dff5e6", "1통"),
  P(11, "김", 3500, "#dfe7da", "5봉"),
  P(12, "요구르트", 2400, "#f9e0ef", "5개"),
];

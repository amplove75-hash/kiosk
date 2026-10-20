// 나인식당 메뉴 (가상 식당)
export type RCat = "main" | "side" | "drink";
export type RArt = "kimchi" | "doenjang" | "jeyuk" | "bibim" | "bulgogi" | "naengmyeon" | "egg" | "pajeon" | "rice" | "mandu" | "cola" | "cider" | "sikhye";
export type RItem = { id: string; name: string; price: number; cat: RCat; art: RArt; desc?: string };

export const R_CATS: { id: RCat; label: string }[] = [
  { id: "main", label: "식사" },
  { id: "side", label: "곁들임" },
  { id: "drink", label: "음료" },
];

export const R_MENU: RItem[] = [
  { id: "kimchi", name: "김치찌개", price: 8000, cat: "main", art: "kimchi", desc: "공기밥 포함" },
  { id: "doenjang", name: "된장찌개", price: 8000, cat: "main", art: "doenjang", desc: "공기밥 포함" },
  { id: "jeyuk", name: "제육볶음", price: 9000, cat: "main", art: "jeyuk", desc: "공기밥 포함" },
  { id: "bibim", name: "돌솥비빔밥", price: 8500, cat: "main", art: "bibim" },
  { id: "bulgogi", name: "불고기 정식", price: 11000, cat: "main", art: "bulgogi", desc: "공기밥 포함" },
  { id: "naengmyeon", name: "물냉면", price: 9000, cat: "main", art: "naengmyeon" },
  { id: "egg", name: "계란말이", price: 6000, cat: "side", art: "egg" },
  { id: "pajeon", name: "해물파전", price: 12000, cat: "side", art: "pajeon" },
  { id: "mandu", name: "군만두", price: 5000, cat: "side", art: "mandu" },
  { id: "rice", name: "공기밥 추가", price: 1000, cat: "side", art: "rice" },
  { id: "cola", name: "콜라", price: 2000, cat: "drink", art: "cola" },
  { id: "cider", name: "사이다", price: 2000, cat: "drink", art: "cider" },
  { id: "sikhye", name: "식혜", price: 2500, cat: "drink", art: "sikhye" },
];
export const rById = (id: string) => R_MENU.find((m) => m.id === id)!;

/** 직원 호출로 부탁할 수 있는 것 */
export const CALL_ITEMS: { id: string; label: string }[] = [
  { id: "water", label: "물" },
  { id: "plate", label: "앞접시" },
  { id: "spoon", label: "수저" },
  { id: "tissue", label: "물티슈" },
  { id: "staff", label: "직원만 불러주세요" },
];
export const TABLE_NO = 7;

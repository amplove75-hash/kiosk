// CAFE NINE 메뉴 (교육자료의 가상 카페). 가격은 교육자료 화면 기준.
export type Temp = "HOT" | "ICED";
export type CatId = "rec" | "coffee" | "smoothie" | "ade" | "tea" | "side";
export type Art =
  | { kind: "drink"; liquid: string; top?: string; cream?: boolean; bits?: string }
  | { kind: "cake" | "cookie" | "croffle" };

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  cats: CatId[];
  temps: Temp[]; // 빈 배열 = 온도 선택 없음(디저트)
  coffee?: boolean;
  art: Art;
};

export const CATEGORIES: { id: CatId; label: string }[] = [
  { id: "rec", label: "추천메뉴" },
  { id: "coffee", label: "커피" },
  { id: "smoothie", label: "스무디/프라페" },
  { id: "ade", label: "에이드" },
  { id: "tea", label: "티" },
  { id: "side", label: "사이드" },
];

export const MENU: MenuItem[] = [
  { id: "watermelon", name: "수박주스", price: 3500, cats: ["rec", "smoothie"], temps: ["ICED"], art: { kind: "drink", liquid: "#e5383b", bits: "#2d6a2d" } },
  { id: "strawberry", name: "딸기스무디", price: 3500, cats: ["rec", "smoothie"], temps: ["ICED"], art: { kind: "drink", liquid: "#f4a3b4", top: "#e8496b" } },
  { id: "mango", name: "망고스무디", price: 3500, cats: ["rec", "smoothie"], temps: ["ICED"], art: { kind: "drink", liquid: "#f7b32b" } },
  { id: "blueberry", name: "블루베리스무디", price: 3500, cats: ["rec", "smoothie"], temps: ["ICED"], art: { kind: "drink", liquid: "#8a5fbf", top: "#5b3a8c" } },
  { id: "javachip", name: "자바칩프라페", price: 4800, cats: ["smoothie"], temps: ["ICED"], art: { kind: "drink", liquid: "#8b5e3c", cream: true, bits: "#3b2416" } },

  { id: "americano", name: "아메리카노", price: 3500, cats: ["coffee"], temps: ["HOT", "ICED"], coffee: true, art: { kind: "drink", liquid: "#4a2a17" } },
  { id: "latte", name: "카페라떼", price: 4000, cats: ["coffee"], temps: ["HOT", "ICED"], coffee: true, art: { kind: "drink", liquid: "#c79a6e", top: "#f3e6d4" } },
  { id: "vanilla", name: "바닐라라떼", price: 4500, cats: ["coffee", "rec"], temps: ["HOT", "ICED"], coffee: true, art: { kind: "drink", liquid: "#d8b183", top: "#fbf0dc" } },
  { id: "caramel", name: "카라멜마키아또", price: 4800, cats: ["coffee"], temps: ["HOT", "ICED"], coffee: true, art: { kind: "drink", liquid: "#b9804a", top: "#f3e6d4", cream: true } },
  { id: "cappuccino", name: "카푸치노", price: 4000, cats: ["coffee"], temps: ["HOT", "ICED"], coffee: true, art: { kind: "drink", liquid: "#a87a52", cream: true } },
  { id: "coldbrew", name: "콜드브루", price: 4000, cats: ["coffee"], temps: ["ICED"], coffee: true, art: { kind: "drink", liquid: "#2e1a0e" } },

  { id: "lemon", name: "레몬에이드", price: 3800, cats: ["ade"], temps: ["ICED"], art: { kind: "drink", liquid: "#f6e05e", bits: "#f2c94c" } },
  { id: "grapefruit", name: "자몽에이드", price: 3800, cats: ["ade"], temps: ["ICED"], art: { kind: "drink", liquid: "#f28482" } },
  { id: "greengrape", name: "청포도에이드", price: 3800, cats: ["ade", "rec"], temps: ["ICED"], art: { kind: "drink", liquid: "#a7d676" } },

  { id: "chamomile", name: "캐모마일", price: 3000, cats: ["tea"], temps: ["HOT", "ICED"], art: { kind: "drink", liquid: "#e9c46a" } },
  { id: "peppermint", name: "페퍼민트", price: 3000, cats: ["tea"], temps: ["HOT", "ICED"], art: { kind: "drink", liquid: "#9ccc65" } },
  { id: "yuja", name: "유자차", price: 3500, cats: ["tea"], temps: ["HOT", "ICED"], art: { kind: "drink", liquid: "#f9a825" } },

  { id: "cheesecake", name: "치즈케이크", price: 5000, cats: ["side"], temps: [], art: { kind: "cake" } },
  { id: "cookie", name: "초코쿠키", price: 2500, cats: ["side"], temps: [], art: { kind: "cookie" } },
  { id: "croffle", name: "크로플", price: 4000, cats: ["side"], temps: [], art: { kind: "croffle" } },
];

export type Cup = "store" | "takeout" | "tumbler";
export const CUP_LABEL: Record<Cup, string> = { store: "매장컵", takeout: "일회용컵", tumbler: "개인컵(텀블러)" };
export const TUMBLER_DC = 300;
export const SHOT = 500;
export const SYRUP = 500;

export const byId = (id: string) => MENU.find((m) => m.id === id)!;

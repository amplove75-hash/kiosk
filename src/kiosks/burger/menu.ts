// 나인버거 메뉴 (가상 브랜드)
export type BCat = "rec" | "burger" | "side" | "drink" | "dessert";
export type BArt = "burger" | "cheese" | "bulgogi" | "shrimp" | "chicken" | "double" | "fries" | "cheesestick" | "nugget" | "coleslaw" | "cola" | "cider" | "zero" | "coffee" | "orange" | "cone" | "pie";

export type BItem = { id: string; name: string; price: number; cats: BCat[]; art: BArt; burger?: boolean };

export const B_CATS: { id: BCat; label: string }[] = [
  { id: "rec", label: "추천메뉴" },
  { id: "burger", label: "버거" },
  { id: "side", label: "사이드" },
  { id: "drink", label: "음료" },
  { id: "dessert", label: "디저트" },
];

export const B_MENU: BItem[] = [
  { id: "nine", name: "나인버거", price: 5500, cats: ["rec", "burger"], art: "burger", burger: true },
  { id: "cheese", name: "치즈버거", price: 5900, cats: ["rec", "burger"], art: "cheese", burger: true },
  { id: "bulgogi", name: "불고기버거", price: 5200, cats: ["rec", "burger"], art: "bulgogi", burger: true },
  { id: "shrimp", name: "새우버거", price: 5700, cats: ["burger"], art: "shrimp", burger: true },
  { id: "chicken", name: "치킨버거", price: 6200, cats: ["burger"], art: "chicken", burger: true },
  { id: "double", name: "더블버거", price: 7400, cats: ["burger"], art: "double", burger: true },
  { id: "fries", name: "감자튀김", price: 2300, cats: ["rec", "side"], art: "fries" },
  { id: "cheesestick", name: "치즈스틱", price: 2500, cats: ["side"], art: "cheesestick" },
  { id: "nugget", name: "너겟 4조각", price: 2800, cats: ["side"], art: "nugget" },
  { id: "coleslaw", name: "코울슬로", price: 2000, cats: ["side"], art: "coleslaw" },
  { id: "cola", name: "콜라", price: 2000, cats: ["rec", "drink"], art: "cola" },
  { id: "cider", name: "사이다", price: 2000, cats: ["drink"], art: "cider" },
  { id: "zero", name: "제로콜라", price: 2000, cats: ["drink"], art: "zero" },
  { id: "coffee", name: "아이스커피", price: 2500, cats: ["drink"], art: "coffee" },
  { id: "orange", name: "오렌지주스", price: 2800, cats: ["drink"], art: "orange" },
  { id: "cone", name: "아이스크림콘", price: 1000, cats: ["dessert"], art: "cone" },
  { id: "pie", name: "애플파이", price: 1800, cats: ["dessert"], art: "pie" },
];

export type SetType = "single" | "set" | "large";
export const SET_TYPES: { id: SetType; label: string; sub: string; add: number }[] = [
  { id: "single", label: "단품", sub: "버거만", add: 0 },
  { id: "set", label: "세트", sub: "버거 + 사이드 + 음료", add: 2000 },
  { id: "large", label: "라지세트", sub: "사이드·음료 큰 사이즈", add: 2800 },
];
/** 세트 사이드 변경 (기본: 감자튀김) */
export const SET_SIDES: { id: string; add: number }[] = [
  { id: "fries", add: 0 },
  { id: "coleslaw", add: 0 },
  { id: "cheesestick", add: 500 },
  { id: "nugget", add: 700 },
];
/** 세트 음료 변경 (기본: 콜라) */
export const SET_DRINKS: { id: string; add: number }[] = [
  { id: "cola", add: 0 },
  { id: "zero", add: 0 },
  { id: "cider", add: 0 },
  { id: "coffee", add: 500 },
  { id: "orange", add: 800 },
];
export const bById = (id: string) => B_MENU.find((m) => m.id === id)!;

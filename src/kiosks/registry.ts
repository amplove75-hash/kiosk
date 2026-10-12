import type { KioskDef } from "../engine/types";
import { CafeKiosk, cafeHint } from "./cafe/CafeKiosk";
import { cafeGuide, cafeDetour } from "./cafe/guide";

export const KIOSKS: KioskDef[] = [
  {
    id: "cafe", place: "카페", brand: "CAFE NINE", group: "food", icon: "cafe", status: "ready",
    summary: "음료를 고르고 카드로 결제해요",
    Component: CafeKiosk, guide: cafeGuide, guideDetour: cafeDetour, hint: cafeHint,
    guideTitle: "아이스 아메리카노 1잔 주문하기",
  },
  { id: "burger", place: "패스트푸드", brand: "나인버거", group: "food", icon: "burger", status: "soon", summary: "세트 메뉴 고르기" },
  { id: "rail", place: "기차역", brand: "나인레일", group: "ticket", icon: "train", status: "soon", summary: "승차권 사고 좌석 고르기" },
  { id: "movie", place: "영화관", brand: "나인시네마", group: "ticket", icon: "movie", status: "soon", summary: "영화표 예매하고 발권하기" },
  { id: "mart", place: "마트 셀프계산대", brand: "나인마트", group: "life", icon: "mart", status: "soon", summary: "상품 바코드를 직접 찍어요" },
  { id: "hospital", place: "병원", brand: "나인병원", group: "life", icon: "hospital", status: "soon", summary: "접수하고 진료비 내기" },
  { id: "civil", place: "무인민원발급기", brand: "나인시청", group: "life", icon: "civil", status: "soon", summary: "주민등록등본 떼기" },
  { id: "parking", place: "주차 정산기", brand: "나인파킹", group: "life", icon: "parking", status: "soon", summary: "차량번호로 주차요금 내기" },
];

export const GROUPS: { id: KioskDef["group"]; title: string }[] = [
  { id: "food", title: "음식 주문" },
  { id: "ticket", title: "표를 사는 곳" },
  { id: "life", title: "생활 속 키오스크" },
];

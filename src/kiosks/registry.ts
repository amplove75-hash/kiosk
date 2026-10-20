import type { KioskDef } from "../engine/types";
import { CafeKiosk, cafeHint } from "./cafe/CafeKiosk";
import { cafeGuide, cafeDetour } from "./cafe/guide";
import { MartKiosk, martHint } from "./mart/MartKiosk";
import { martGuide, martDetour } from "./mart/guide";
import { BurgerKiosk, burgerHint } from "./burger/BurgerKiosk";
import { burgerGuide, burgerDetour } from "./burger/guide";
import { RestaurantKiosk, restaurantHint } from "./restaurant/RestaurantKiosk";
import { restaurantGuide } from "./restaurant/guide";

/** 만든 순서대로 보여준다 (준비 중인 키오스크는 맨 뒤) */
export const KIOSKS: KioskDef[] = [
  {
    id: "cafe", place: "카페", brand: "CAFE NINE", group: "food", icon: "cafe", status: "ready",
    summary: "음료를 고르고 카드로 결제해요",
    Component: CafeKiosk, guide: cafeGuide, guideDetour: cafeDetour, hint: cafeHint,
    guideTitle: "아이스 아메리카노 1잔 주문하기",
    printables: [{ to: "/print/cards", label: "체험카드·멤버십·쿠폰 인쇄", note: "카드 결제, 스탬프 적립, 쿠폰 할인을 카메라로 연습해요" }],
  },
  {
    id: "mart", place: "마트 셀프계산대", brand: "나인마트", group: "life", icon: "mart", status: "ready",
    summary: "상품 바코드를 직접 찍고 계산해요",
    Component: MartKiosk, guide: martGuide, guideDetour: martDetour, hint: martHint,
    guideTitle: "우유 1개, 라면 2개 계산하기",
    printables: [
      { to: "/print/products", label: "마트 상품 바코드 인쇄", note: "우유·라면 등 12종 라벨. 물건에 붙여 하나씩 찍어봐요" },
      { to: "/print/cards", label: "체험카드·회원카드 인쇄", note: "카드 결제와 포인트 적립을 카메라로 연습해요" },
    ],
  },
  {
    id: "burger", place: "패스트푸드", brand: "나인버거", group: "food", icon: "burger", status: "ready",
    summary: "버거를 세트로 바꾸고 음료도 골라요",
    Component: BurgerKiosk, guide: burgerGuide, guideDetour: burgerDetour, hint: burgerHint,
    guideTitle: "불고기버거 세트(음료는 사이다) 포장하기",
    printables: [{ to: "/print/cards", label: "체험카드 인쇄", note: "카드 결제를 카메라로 연습해요" }],
  },
  {
    id: "restaurant", place: "식당 테이블 주문", brand: "나인식당", group: "food", icon: "restaurant", status: "ready",
    summary: "앉은 자리 태블릿으로 주문하고 직원도 불러요",
    Component: RestaurantKiosk, guide: restaurantGuide, hint: restaurantHint, layout: "wide",
    guideTitle: "김치찌개 2개·계란말이 주문하고 물 부탁하기",
  },
  { id: "parking", place: "주차 정산기", brand: "나인파킹", group: "life", icon: "parking", status: "soon", summary: "차량번호로 주차요금 내기" },
  { id: "rail", place: "기차역", brand: "나인레일", group: "ticket", icon: "train", status: "soon", summary: "승차권 사고 좌석 고르기" },
  { id: "hospital", place: "병원", brand: "나인병원", group: "life", icon: "hospital", status: "soon", summary: "접수하고 진료비 내기" },
  { id: "civil", place: "무인민원발급기", brand: "나인시청", group: "life", icon: "civil", status: "soon", summary: "주민등록등본 떼기" },
  { id: "movie", place: "영화관", brand: "나인시네마", group: "ticket", icon: "movie", status: "soon", summary: "영화표 예매하고 발권하기" },
];

export const GROUPS: { id: KioskDef["group"]; title: string }[] = [
  { id: "food", title: "음식 주문" },
  { id: "ticket", title: "표를 사는 곳" },
  { id: "life", title: "생활 속 키오스크" },
];

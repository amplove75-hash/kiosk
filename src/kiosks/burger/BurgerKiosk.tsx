import { useEffect, useReducer } from "react";
import type { KioskProps, OrderResult } from "../../engine/types";
import { KioskDevice, type CardState } from "../../engine/KioskDevice";
import { nextOrderNo, nowText } from "../../engine/orderNo";
import { useToast } from "../../components/Toast";
import { sounds } from "../../lib/sound";
import { won } from "../../lib/format";
import {
  CardPayScreen, CashNoticeScreen, KLogo, PayMethodScreen, PaySummary, ReceiptScreen, StepHead, useProcessing,
  type PayScreen,
} from "../shared/Pay";
import { BurgerArt } from "./BurgerArt";
import { B_CATS, B_MENU, bById, SET_DRINKS, SET_SIDES, SET_TYPES, type BCat, type SetType } from "./menu";

/* ───────── 상태 ───────── */
export type BurgerScreen = "attract" | "menu" | "confirm" | "payMethod" | "cashNotice" | PayScreen | "receipt" | "done";
export type SheetStep = "type" | "side" | "drink" | "qty";
export type BSheet = { itemId: string; step: SheetStep; setType: SetType; side: string; drink: string; qty: number };
export type BLine = Omit<BSheet, "step"> & { key: string; unit: number };

export type BurgerState = {
  screen: BurgerScreen;
  orderType: "dine" | "takeout" | null;
  category: BCat;
  sheet: BSheet | null;
  cart: BLine[];
  askHome: boolean;
  orderNo: string;
  when: string;
  receiptTaken: boolean;
};

const initial: BurgerState = {
  screen: "attract", orderType: null, category: "rec", sheet: null, cart: [],
  askHome: false, orderNo: "", when: "", receiptTaken: false,
};

type Action =
  | { t: "start"; orderType: "dine" | "takeout" }
  | { t: "cat"; id: BCat }
  | { t: "open"; id: string }
  | { t: "sheet"; patch: Partial<BSheet> }
  | { t: "sheetCancel" }
  | { t: "sheetAdd" }
  | { t: "qty"; key: string; d: number }
  | { t: "remove"; key: string }
  | { t: "clear" }
  | { t: "askHome"; v: boolean }
  | { t: "reset" }
  | { t: "go"; screen: BurgerScreen }
  | { t: "paid"; orderNo: string; when: string }
  | { t: "takeReceipt" };

export const bUnit = (s: Pick<BSheet, "itemId" | "setType" | "side" | "drink">) => {
  const base = bById(s.itemId).price;
  if (s.setType === "single") return base;
  const setAdd = SET_TYPES.find((t) => t.id === s.setType)!.add;
  const sideAdd = SET_SIDES.find((x) => x.id === s.side)?.add ?? 0;
  const drinkAdd = SET_DRINKS.find((x) => x.id === s.drink)?.add ?? 0;
  return base + setAdd + sideAdd + drinkAdd;
};
export const bTotal = (cart: BLine[]) => cart.reduce((a, l) => a + l.unit * l.qty, 0);
export const bCount = (cart: BLine[]) => cart.reduce((a, l) => a + l.qty, 0);
export function bTitle(l: Pick<BLine, "itemId" | "setType">) {
  const n = bById(l.itemId).name;
  return l.setType === "set" ? `${n} 세트` : l.setType === "large" ? `${n} 라지세트` : n;
}
export function bDetail(l: Pick<BLine, "setType" | "side" | "drink">) {
  if (l.setType === "single") return "";
  const big = l.setType === "large" ? "(L) " : "";
  return `${big}${bById(l.side).name} · ${big}${bById(l.drink).name}`;
}

function reducer(s: BurgerState, a: Action): BurgerState {
  switch (a.t) {
    case "start":
      return { ...initial, screen: "menu", orderType: a.orderType };
    case "cat":
      return { ...s, category: a.id };
    case "open": {
      const item = bById(a.id);
      return { ...s, sheet: { itemId: a.id, step: item.burger ? "type" : "qty", setType: "single", side: "fries", drink: "cola", qty: 1 } };
    }
    case "sheet":
      return s.sheet ? { ...s, sheet: { ...s.sheet, ...a.patch } } : s;
    case "sheetCancel":
      return { ...s, sheet: null };
    case "sheetAdd": {
      const sh = s.sheet;
      if (!sh) return s;
      const norm = sh.setType === "single" ? { ...sh, side: "", drink: "" } : sh;
      const key = [norm.itemId, norm.setType, norm.side, norm.drink].join("|");
      const found = s.cart.find((l) => l.key === key);
      const cart = found
        ? s.cart.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + sh.qty) } : l))
        : [...s.cart, { itemId: norm.itemId, setType: norm.setType, side: norm.side, drink: norm.drink, qty: sh.qty, key, unit: bUnit(norm) }];
      return { ...s, sheet: null, cart };
    }
    case "qty":
      return { ...s, cart: s.cart.map((l) => (l.key === a.key ? { ...l, qty: Math.max(1, Math.min(20, l.qty + a.d)) } : l)) };
    case "remove":
      return { ...s, cart: s.cart.filter((l) => l.key !== a.key) };
    case "clear":
      return { ...s, cart: [] };
    case "askHome":
      return { ...s, askHome: a.v };
    case "reset":
      return initial;
    case "go":
      return { ...s, screen: a.screen };
    case "paid":
      return { ...s, screen: "receipt", orderNo: a.orderNo, when: a.when, receiptTaken: false };
    case "takeReceipt":
      return { ...s, receiptTaken: true };
  }
}

function toResult(s: BurgerState): OrderResult {
  return {
    shop: "나인버거",
    orderNo: s.orderNo,
    when: s.when,
    total: bTotal(s.cart),
    extra: s.orderType === "takeout" ? "포장" : "매장",
    lines: s.cart.map((l) => ({ name: bTitle(l), detail: bDetail(l), qty: l.qty, amount: l.unit * l.qty })),
  };
}

const LOGO = <KLogo mark="B" name="나인버거" />;

/* ───────── 화면 ───────── */
export function BurgerKiosk({ onState, onComplete, onReceipt }: KioskProps<BurgerState>) {
  const [s, dispatch] = useReducer(reducer, initial);
  const toast = useToast((t) => t.show);
  useEffect(() => onState(s), [s, onState]);
  useProcessing(s.screen, () => dispatch({ t: "go", screen: "cardRemove" }));

  const card: CardState =
    s.screen === "cardInsert" ? "await" : s.screen === "processing" ? "inserted" : s.screen === "cardRemove" ? "eject" : "none";
  const onCardSlot = () => {
    if (s.screen === "cardInsert") {
      sounds.soft();
      dispatch({ t: "go", screen: "processing" });
    } else if (s.screen === "cardRemove") {
      sounds.soft();
      dispatch({ t: "paid", orderNo: nextOrderNo("B"), when: nowText() });
    } else if (s.screen === "processing") {
      toast("결제 중에는 카드를 빼지 마세요!");
    } else if (s.screen === "cardError") {
      toast("다른 카드로 결제하려면 화면의 [다른 카드로 결제]를 누르세요.");
    } else {
      toast("지금은 카드를 꽂을 때가 아니에요. 화면을 먼저 진행해 주세요.");
    }
  };
  const onReceiptSlot = () => {
    if (s.screen === "receipt" && !s.receiptTaken) {
      sounds.soft();
      dispatch({ t: "takeReceipt" });
      onReceipt(toResult(s));
    } else if (!(s.screen === "receipt" || s.screen === "done")) {
      toast("영수증은 결제가 끝나면 이곳으로 나와요.");
    }
  };
  const summary = <PaySummary rows={[{ label: `주문 금액 (${bCount(s.cart)}개)`, amount: bTotal(s.cart) }]} total={bTotal(s.cart)} />;

  return (
    <KioskDevice card={card} receiptOut={s.screen === "receipt" && !s.receiptTaken} onCardSlot={onCardSlot} onReceipt={onReceiptSlot}>
      <div className="kx burger">
        {s.screen === "attract" && <Attract onPick={(o) => dispatch({ t: "start", orderType: o })} />}
        {s.screen === "menu" && <MenuScreen s={s} dispatch={dispatch} />}
        {s.screen === "confirm" && (
          <div className="k-page">
            <StepHead logo={LOGO} step={1} title="주문 내역을 확인해주세요" />
            <div className="k-body">
              <p className="k-chip solid">{s.orderType === "takeout" ? "포장해서 갈게요" : "매장에서 먹어요"}</p>
              <ul className="k-review">
                {s.cart.map((l) => (
                  <li key={l.key}>
                    <BurgerArt art={bById(l.itemId).art} size={48} />
                    <div>
                      <b>{bTitle(l)}</b>
                      {bDetail(l) && <small>{bDetail(l)}</small>}
                    </div>
                    <span>{l.qty}개</span>
                    <span className="k-price">{won(l.unit * l.qty)}</span>
                  </li>
                ))}
              </ul>
              {summary}
            </div>
            <div className="k-foot">
              <button className="k-btn ghost" onClick={() => dispatch({ t: "go", screen: "menu" })}>이전</button>
              <button className="k-btn brand" onClick={() => dispatch({ t: "go", screen: "payMethod" })} data-guide="btn-next">다음</button>
            </div>
          </div>
        )}
        {s.screen === "payMethod" && (
          <PayMethodScreen
            logo={LOGO} step={2} summary={summary}
            onCard={() => dispatch({ t: "go", screen: "cardInsert" })}
            onCash={() => dispatch({ t: "go", screen: "cashNotice" })}
            onCancelAll={() => dispatch({ t: "askHome", v: true })}
            onPrev={() => dispatch({ t: "go", screen: "confirm" })}
          />
        )}
        {s.screen === "cashNotice" && (
          <CashNoticeScreen logo={LOGO} step={2} onHome={() => dispatch({ t: "askHome", v: true })} onOther={() => dispatch({ t: "go", screen: "payMethod" })} />
        )}
        {(s.screen === "cardInsert" || s.screen === "cardError" || s.screen === "processing" || s.screen === "cardRemove") && (
          <CardPayScreen
            logo={LOGO} step={3} screen={s.screen} total={bTotal(s.cart)}
            onCardRead={(ok) => dispatch({ t: "go", screen: ok ? "processing" : "cardError" })}
            onCardSlot={onCardSlot}
            onCancel={() => dispatch({ t: "go", screen: "payMethod" })}
            onOtherCard={() => dispatch({ t: "go", screen: "cardInsert" })}
          />
        )}
        {s.screen === "receipt" && (
          <ReceiptScreen
            logo={LOGO} step={4} numberLabel="주문번호" number={s.orderNo} receiptTaken={s.receiptTaken}
            remind="결제하신 카드와 영수증을 꼭 챙겨주세요!"
            onOk={() => {
              dispatch({ t: "go", screen: "done" });
              onComplete(toResult(s));
            }}
          />
        )}
        {s.screen === "done" && (
          <div className="k-page">
            <div className="k-body center">
              {LOGO}
              <p className="k-say">주문이 완료되었습니다</p>
              <div className="k-orderno"><span>주문번호</span><b>{s.orderNo}</b></div>
              <div className="burger-pickup">
                <span className="burger-pickup-screen">{s.orderNo}</span>
                <p>안내 화면에 내 주문번호가 뜨면<br /><b>픽업대</b>에서 받아가세요.</p>
              </div>
            </div>
            <div className="k-foot">
              <button className="k-btn brand" onClick={() => dispatch({ t: "reset" })}>처음 화면으로</button>
            </div>
          </div>
        )}

        {s.askHome && (
          <div className="k-dim">
            <div className="k-dialog" role="dialog" aria-label="처음으로 돌아가기">
              <p className="k-dialog-title">처음 화면으로 돌아갈까요?</p>
              <p>지금까지 담은 메뉴가 모두 지워져요.</p>
              <div className="k-row">
                <button className="k-btn ghost" onClick={() => dispatch({ t: "askHome", v: false })}>아니요</button>
                <button className="k-btn brand" onClick={() => dispatch({ t: "reset" })}>처음으로</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </KioskDevice>
  );
}

type D = React.Dispatch<Action>;

function Attract({ onPick }: { onPick: (o: "dine" | "takeout") => void }) {
  return (
    <div className="attract burger-attract">
      <div className="attract-poster">
        {LOGO}
        <h2 className="burger-title">오늘도<br />든든하게!</h2>
        <div className="burger-hero">
          <BurgerArt art="double" size={150} />
          <div className="burger-hero-side">
            <BurgerArt art="fries" size={76} />
            <BurgerArt art="cola" size={76} />
          </div>
        </div>
        <p className="burger-hero-cap">세트로 주문하면 사이드와 음료가 함께!</p>
      </div>
      <div className="attract-order" data-guide="order-type">
        <p>주문방법을 선택해주세요 ▼</p>
        <div className="k-row">
          <button className="k-btn white" onClick={() => onPick("dine")} data-guide="order-dine">매장에서 먹어요</button>
          <button className="k-btn white" onClick={() => onPick("takeout")} data-guide="order-takeout">포장해서 갈게요</button>
        </div>
      </div>
    </div>
  );
}

function MenuScreen({ s, dispatch }: { s: BurgerState; dispatch: D }) {
  const items = B_MENU.filter((m) => m.cats.includes(s.category));
  return (
    <div className="menu">
      <div className="k-head">
        {LOGO}
        <span className="k-chip">{s.orderType === "takeout" ? "포장" : "매장"}</span>
        <button className="k-icon-btn" onClick={() => (s.cart.length ? dispatch({ t: "askHome", v: true }) : dispatch({ t: "reset" }))} data-guide="btn-home">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" />
          </svg>
          처음으로
        </button>
      </div>
      <nav className="k-tabs five" data-guide="tabs" aria-label="메뉴 종류">
        {B_CATS.map((c) => (
          <button key={c.id} aria-pressed={s.category === c.id} onClick={() => dispatch({ t: "cat", id: c.id })} data-guide={`tab-${c.id}`}>
            {c.label}
          </button>
        ))}
      </nav>
      <div className="k-grid">
        {items.map((m) => (
          <button key={m.id} className="k-item" onClick={() => dispatch({ t: "open", id: m.id })} data-guide={`item-${m.id}`}>
            <BurgerArt art={m.art} size={70} />
            <span className="k-item-name">{m.name}</span>
            <span className="k-price">{won(m.price)}{m.burger && <small className="from"> ~</small>}</span>
          </button>
        ))}
      </div>
      <div className="k-cart" data-guide="cart">
        <div className="k-cart-head">
          <span>선택한 상품 <b>{bCount(s.cart)}</b>개</span>
          <span>총 주문금액 <b className="k-price">{won(bTotal(s.cart))}</b></span>
        </div>
        <div className="k-cart-list">
          {s.cart.length === 0 && <p className="k-empty">메뉴를 눌러 담아주세요</p>}
          {s.cart.map((l) => (
            <div key={l.key} className="k-line">
              <button className="k-x" aria-label={`${bTitle(l)} 빼기`} onClick={() => dispatch({ t: "remove", key: l.key })}>×</button>
              <span className="k-line-name">{bTitle(l)}</span>
              {bDetail(l) && <span className="k-line-opt">{bDetail(l)}</span>}
              <span className="k-qty">
                <button aria-label="하나 빼기" onClick={() => dispatch({ t: "qty", key: l.key, d: -1 })}>−</button>
                <b>{l.qty}</b>
                <button aria-label="하나 더하기" onClick={() => dispatch({ t: "qty", key: l.key, d: 1 })}>+</button>
              </span>
            </div>
          ))}
        </div>
        <div className="k-row">
          <button className="k-btn ghost" disabled={!s.cart.length} onClick={() => dispatch({ t: "clear" })}>전체삭제</button>
          <button className="k-btn brand" disabled={!s.cart.length} onClick={() => dispatch({ t: "go", screen: "confirm" })} data-guide="btn-checkout">결제하기</button>
        </div>
      </div>
      {s.sheet && <SetSheet sh={s.sheet} dispatch={dispatch} />}
    </div>
  );
}

const STEP_NO: Record<SheetStep, string> = { type: "1", side: "2", drink: "3", qty: "4" };

function SetSheet({ sh, dispatch }: { sh: BSheet; dispatch: D }) {
  const item = bById(sh.itemId);
  const set = (patch: Partial<BSheet>) => dispatch({ t: "sheet", patch });
  const isSet = sh.setType !== "single";
  const steps: SheetStep[] = item.burger ? (isSet ? ["type", "side", "drink", "qty"] : ["type", "qty"]) : ["qty"];
  const idx = steps.indexOf(sh.step);
  const back = () => (idx > 0 ? set({ step: steps[idx - 1] }) : dispatch({ t: "sheetCancel" }));
  const L = sh.setType === "large" ? "(L) " : "";

  return (
    <div className="k-dim">
      <div className="k-sheet" role="dialog" aria-label={`${item.name} 주문`}>
        <div className="k-sheet-top">
          <BurgerArt art={item.art} size={70} />
          <div>
            <p className="k-sheet-name">{item.burger && isSet ? `${item.name} ${sh.setType === "large" ? "라지세트" : "세트"}` : item.name}</p>
            <p className="k-price big">{won(bUnit(sh) * sh.qty)}</p>
          </div>
          {item.burger && <span className="burger-stepno">{STEP_NO[sh.step]}/{isSet ? 4 : 2}</span>}
        </div>

        {sh.step === "type" && (
          <div className="k-opt" data-guide="set-options">
            <p className="k-opt-title">단품으로 드릴까요, 세트로 드릴까요?</p>
            <div className="burger-sets">
              {SET_TYPES.map((t) => (
                <button
                  key={t.id}
                  aria-pressed={sh.setType === t.id}
                  onClick={() => set({ setType: t.id, step: t.id === "single" ? "qty" : "side" })}
                  data-guide={`set-${t.id}`}
                >
                  <b>{t.label}</b>
                  <small>{t.sub}</small>
                  <span className="k-price">{won(item.price + t.add)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {sh.step === "side" && (
          <div className="k-opt" data-guide="side-options">
            <p className="k-opt-title">사이드를 골라주세요 <em>(기본: 감자튀김)</em></p>
            <div className="k-choices burger-choices">
              {SET_SIDES.map((x) => (
                <button key={x.id} aria-pressed={sh.side === x.id} onClick={() => set({ side: x.id })} data-guide={`side-${x.id}`}>
                  <BurgerArt art={bById(x.id).art} size={44} />
                  {L}{bById(x.id).name}
                  <small>{x.add ? `+${won(x.add)}` : "추가금 없음"}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {sh.step === "drink" && (
          <div className="k-opt" data-guide="drink-options">
            <p className="k-opt-title">음료를 골라주세요 <em>(기본: 콜라)</em></p>
            <div className="k-choices burger-choices">
              {SET_DRINKS.map((x) => (
                <button key={x.id} aria-pressed={sh.drink === x.id} onClick={() => set({ drink: x.id })} data-guide={`drink-${x.id}`}>
                  <BurgerArt art={bById(x.id).art} size={44} />
                  {L}{bById(x.id).name}
                  <small>{x.add ? `+${won(x.add)}` : "추가금 없음"}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {sh.step === "qty" && (
          <div className="k-opt" data-guide="sheet-summary">
            {isSet && (
              <ul className="burger-summary">
                <li><span>버거</span><b>{item.name}</b></li>
                <li><span>사이드</span><b>{L}{bById(sh.side).name}</b></li>
                <li><span>음료</span><b>{L}{bById(sh.drink).name}</b></li>
              </ul>
            )}
            <div className="k-opt-qty k-opt">
              <p className="k-opt-title">수량</p>
              <span className="k-qty big">
                <button aria-label="수량 하나 빼기" onClick={() => set({ qty: Math.max(1, sh.qty - 1) })}>−</button>
                <b>{sh.qty}</b>
                <button aria-label="수량 하나 더하기" onClick={() => set({ qty: Math.min(20, sh.qty + 1) })} data-guide="sheet-plus">+</button>
              </span>
            </div>
          </div>
        )}

        <div className="k-row">
          <button className="k-btn ghost" onClick={back} data-guide="sheet-back">{idx > 0 ? "이전" : "취소"}</button>
          {sh.step === "side" || sh.step === "drink" ? (
            <button className="k-btn brand" onClick={() => set({ step: steps[idx + 1] })} data-guide="sheet-next">다음</button>
          ) : sh.step === "qty" ? (
            <button className="k-btn brand" onClick={() => dispatch({ t: "sheetAdd" })} data-guide="sheet-add">장바구니 담기</button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ───────── 혼자 해보기: [직원 호출] 도움말 ───────── */
export function burgerHint(s: BurgerState): string {
  switch (s.screen) {
    case "attract":
      return "먹고 갈지, 포장할지 골라요. 화면 아래 두 버튼 중 하나를 누르세요.";
    case "menu":
      if (s.askHome) return "[처음으로]를 누르면 담은 메뉴가 지워져요. 계속하려면 [아니요]를 누르세요.";
      if (s.sheet) {
        switch (s.sheet.step) {
          case "type": return "버거만 원하면 [단품], 감자튀김과 음료도 함께 원하면 [세트]를 누르세요.";
          case "side": return "세트에 들어갈 사이드를 고르고 [다음]을 누르세요. 그대로 두면 감자튀김이에요.";
          case "drink": return "음료를 고르고 [다음]을 누르세요. 그대로 두면 콜라예요.";
          case "qty": return "고른 내용을 확인하고 [장바구니 담기]를 누르세요.";
        }
      }
      if (!s.cart.length) return "위쪽 메뉴 종류를 누른 뒤, 먹고 싶은 메뉴 그림을 누르세요.";
      return "다 담았으면 화면 아래 [결제하기]를 누르세요.";
    case "confirm":
      return "주문 내역을 확인하고 [다음]을 누르세요.";
    case "payMethod":
      return "[신용/체크카드]를 누르세요. 키오스크는 현금을 안 받는 곳이 많아요.";
    case "cashNotice":
      return "현금은 카운터에서 내요. 카드로 하려면 [다른 방법으로 결제]를 누르세요.";
    case "cardInsert":
      return "화면 아래 [카드 투입구]를 눌러 카드를 꽂으세요.";
    case "cardError":
      return "잔액이 부족한 카드예요. [다른 카드로 결제]를 누르세요.";
    case "processing":
      return "결제 중이에요. 카드를 빼지 말고 기다리세요.";
    case "cardRemove":
      return "[카드 투입구]를 눌러 카드를 꼭 챙기세요.";
    case "receipt":
      return s.receiptTaken ? "[확인]을 누르세요." : "[영수증] 출구를 눌러 영수증을 챙기세요. 주문번호가 적혀 있어요.";
    case "done":
      return "주문 끝! 안내 화면에 내 번호가 뜨면 픽업대로 가세요.";
  }
}

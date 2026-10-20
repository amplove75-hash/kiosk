import { useEffect, useReducer } from "react";
import type { KioskProps, OrderResult } from "../../engine/types";
import { TabletDevice } from "../../engine/TabletDevice";
import { nowText } from "../../engine/orderNo";
import { sounds } from "../../lib/sound";
import { won } from "../../lib/format";
import { KLogo } from "../shared/Pay";
import { FoodArt } from "./FoodArt";
import { CALL_ITEMS, R_CATS, R_MENU, rById, TABLE_NO, type RCat } from "./menu";

/* ───────── 상태 ───────── */
export type RScreen = "welcome" | "menu" | "bill" | "done";
type Qty = { itemId: string; qty: number };
export type ROrder = { no: number; time: string; lines: Qty[] };

export type RestaurantState = {
  screen: RScreen;
  category: RCat;
  sheet: Qty | null;
  cart: Qty[];
  cartOpen: boolean;
  confirmOrder: boolean;
  justOrdered: boolean;
  orders: ROrder[];
  callOpen: boolean;
  callPick: string[];
  calls: string[][];
  callSent: boolean;
  historyOpen: boolean;
};

const initial: RestaurantState = {
  screen: "welcome", category: "main", sheet: null, cart: [], cartOpen: false, confirmOrder: false,
  justOrdered: false, orders: [], callOpen: false, callPick: [], calls: [], callSent: false, historyOpen: false,
};

type Action =
  | { t: "start" }
  | { t: "cat"; id: RCat }
  | { t: "open"; id: string }
  | { t: "sheetQty"; d: number }
  | { t: "sheetCancel" }
  | { t: "sheetAdd" }
  | { t: "qty"; id: string; d: number }
  | { t: "remove"; id: string }
  | { t: "cartOpen"; v: boolean }
  | { t: "confirmOrder"; v: boolean }
  | { t: "order"; time: string }
  | { t: "orderedOk" }
  | { t: "callOpen"; v: boolean }
  | { t: "callToggle"; id: string }
  | { t: "callSend" }
  | { t: "callOk" }
  | { t: "historyOpen"; v: boolean }
  | { t: "bill" }
  | { t: "backToMenu" }
  | { t: "done" }
  | { t: "reset" };

const sum = (qs: Qty[]) => qs.reduce((a, l) => a + rById(l.itemId).price * l.qty, 0);
const count = (qs: Qty[]) => qs.reduce((a, l) => a + l.qty, 0);
export const cartSum = (s: Pick<RestaurantState, "cart">) => sum(s.cart);
export const orderedSum = (s: Pick<RestaurantState, "orders">) => s.orders.reduce((a, o) => a + sum(o.lines), 0);
export const orderedQty = (s: Pick<RestaurantState, "orders">, id: string) =>
  s.orders.reduce((a, o) => a + o.lines.filter((l) => l.itemId === id).reduce((b, l) => b + l.qty, 0), 0);
export const cartQty = (s: Pick<RestaurantState, "cart">, id: string) => s.cart.find((l) => l.itemId === id)?.qty ?? 0;

function reducer(s: RestaurantState, a: Action): RestaurantState {
  switch (a.t) {
    case "start":
      return { ...initial, screen: "menu" };
    case "cat":
      return { ...s, category: a.id };
    case "open":
      return { ...s, sheet: { itemId: a.id, qty: 1 } };
    case "sheetQty":
      return s.sheet ? { ...s, sheet: { ...s.sheet, qty: Math.max(1, Math.min(20, s.sheet.qty + a.d)) } } : s;
    case "sheetCancel":
      return { ...s, sheet: null };
    case "sheetAdd": {
      const sh = s.sheet;
      if (!sh) return s;
      const found = s.cart.find((l) => l.itemId === sh.itemId);
      const cart = found ? s.cart.map((l) => (l.itemId === sh.itemId ? { ...l, qty: Math.min(20, l.qty + sh.qty) } : l)) : [...s.cart, sh];
      return { ...s, sheet: null, cart };
    }
    case "qty":
      return { ...s, cart: s.cart.map((l) => (l.itemId === a.id ? { ...l, qty: Math.max(1, Math.min(20, l.qty + a.d)) } : l)) };
    case "remove":
      return { ...s, cart: s.cart.filter((l) => l.itemId !== a.id) };
    case "cartOpen":
      return { ...s, cartOpen: a.v };
    case "confirmOrder":
      return { ...s, confirmOrder: a.v };
    case "order":
      return {
        ...s,
        orders: [...s.orders, { no: s.orders.length + 1, time: a.time, lines: s.cart }],
        cart: [],
        cartOpen: false,
        confirmOrder: false,
        justOrdered: true,
      };
    case "orderedOk":
      return { ...s, justOrdered: false };
    case "callOpen":
      return { ...s, callOpen: a.v, callPick: a.v ? [] : s.callPick };
    case "callToggle":
      return { ...s, callPick: s.callPick.includes(a.id) ? s.callPick.filter((x) => x !== a.id) : [...s.callPick, a.id] };
    case "callSend":
      return { ...s, calls: [...s.calls, s.callPick], callOpen: false, callSent: true };
    case "callOk":
      return { ...s, callSent: false };
    case "historyOpen":
      return { ...s, historyOpen: a.v };
    case "bill":
      return { ...s, historyOpen: false, screen: "bill" };
    case "backToMenu":
      return { ...s, screen: "menu" };
    case "done":
      return { ...s, screen: "done" };
    case "reset":
      return initial;
  }
}

function toResult(s: RestaurantState): OrderResult {
  const merged = new Map<string, number>();
  s.orders.forEach((o) => o.lines.forEach((l) => merged.set(l.itemId, (merged.get(l.itemId) ?? 0) + l.qty)));
  return {
    shop: "나인식당",
    orderNo: `${TABLE_NO}번`,
    numberLabel: "테이블",
    payment: "카운터에서 결제 (식사 후)",
    when: nowText(),
    total: orderedSum(s),
    extra: `주문 ${s.orders.length}번`,
    lines: [...merged].map(([id, qty]) => ({ name: rById(id).name, qty, amount: rById(id).price * qty })),
  };
}

const LOGO = <KLogo mark="食" name="나인식당" />;

/* ───────── 화면 ───────── */
export function RestaurantKiosk({ onState, onComplete, onReceipt }: KioskProps<RestaurantState>) {
  const [s, dispatch] = useReducer(reducer, initial);
  useEffect(() => onState(s), [s, onState]);

  return (
    <TabletDevice>
      <div className="kx resto">
        {s.screen === "welcome" && (
          <button className="resto-welcome" onClick={() => dispatch({ t: "start" })} data-guide="start">
            {LOGO}
            <span className="resto-table" data-guide="table-no">테이블 <b>{TABLE_NO}</b></span>
            <span className="resto-welcome-say">화면을 눌러 주문을 시작하세요</span>
            <span className="resto-welcome-sub">자리에서 메뉴를 고르면 주방으로 바로 전달돼요</span>
            <span className="resto-art-row" aria-hidden>
              <FoodArt art="kimchi" size={80} /><FoodArt art="bibim" size={80} /><FoodArt art="pajeon" size={80} />
            </span>
          </button>
        )}

        {s.screen === "menu" && <MenuScreen s={s} dispatch={dispatch} />}

        {s.screen === "bill" && (
          <div className="k-page">
            <div className="resto-top">
              {LOGO}
              <span className="resto-table small">테이블 {TABLE_NO}</span>
            </div>
            <div className="k-body center">
              <p className="k-say">계산 안내</p>
              <p className="k-total-big resto-total">{won(orderedSum(s))}</p>
              <div className="k-notice resto-bill" data-guide="bill-info">
                <p className="k-notice-big">식사를 마치면 카운터에서 결제해 주세요</p>
                <p>카운터에서 <b>"{TABLE_NO}번 테이블이에요"</b>라고 말하면 돼요.</p>
                <p className="k-muted">식당에 따라 이 화면에서 바로 카드로 결제하는 곳도 있어요.</p>
              </div>
            </div>
            <div className="k-foot">
              <button className="k-btn ghost" onClick={() => dispatch({ t: "backToMenu" })}>메뉴로 돌아가기</button>
              <button
                className="k-btn brand"
                onClick={() => {
                  dispatch({ t: "done" });
                  onComplete(toResult(s));
                }}
                data-guide="bill-ok"
              >
                확인했어요
              </button>
            </div>
          </div>
        )}

        {s.screen === "done" && (
          <div className="k-page">
            <div className="k-body center">
              {LOGO}
              <p className="k-say">맛있게 드세요!</p>
              <p>식사 후 카운터에서 <b>{TABLE_NO}번 테이블</b> 계산을 해 주세요.</p>
              <p className="k-total-big resto-total">{won(orderedSum(s))}</p>
            </div>
            <div className="k-foot">
              <button className="k-btn brand" onClick={() => dispatch({ t: "reset" })}>처음 화면으로</button>
            </div>
          </div>
        )}

        {/* 주문내역 → 계산하기를 누르면 옆 칸에 주문 내역서를 보여준다 */}
        <BillReporter s={s} onReceipt={onReceipt} />
      </div>
    </TabletDevice>
  );
}

function BillReporter({ s, onReceipt }: { s: RestaurantState; onReceipt: (r: OrderResult) => void }) {
  useEffect(() => {
    if (s.screen === "bill") onReceipt(toResult(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.screen]);
  return null;
}

type D = React.Dispatch<Action>;

function MenuScreen({ s, dispatch }: { s: RestaurantState; dispatch: D }) {
  const items = R_MENU.filter((m) => m.cat === s.category);
  return (
    <div className="resto-menu">
      <div className="resto-top">
        {LOGO}
        <span className="resto-table small" data-guide="table-no">테이블 {TABLE_NO}</span>
        <span className="resto-top-gap" />
        <button className="resto-top-btn call" onClick={() => dispatch({ t: "callOpen", v: true })} data-guide="call-btn">
          직원 호출
        </button>
        <button className="resto-top-btn" onClick={() => dispatch({ t: "historyOpen", v: true })} data-guide="history-btn">
          주문내역{s.orders.length > 0 && <span className="resto-badge">{s.orders.length}</span>}
        </button>
      </div>
      <div className="resto-body">
        <nav className="resto-cats" data-guide="cats" aria-label="메뉴 종류">
          {R_CATS.map((c) => (
            <button key={c.id} aria-pressed={s.category === c.id} onClick={() => dispatch({ t: "cat", id: c.id })} data-guide={`cat-${c.id}`}>
              {c.label}
            </button>
          ))}
        </nav>
        <div className="resto-grid">
          {items.map((m) => (
            <button key={m.id} className="k-item resto-item" onClick={() => dispatch({ t: "open", id: m.id })} data-guide={`item-${m.id}`}>
              <FoodArt art={m.art} size={84} />
              <span className="k-item-name">{m.name}</span>
              {m.desc && <small className="k-muted">{m.desc}</small>}
              <span className="k-price">{won(m.price)}</span>
              {cartQty(s, m.id) > 0 && <span className="resto-incart">담음 {cartQty(s, m.id)}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="resto-bottom">
        <span className="k-muted">메뉴를 눌러 담고, 장바구니에서 [주문하기]를 눌러요</span>
        <button className="resto-cart-btn" onClick={() => dispatch({ t: "cartOpen", v: true })} data-guide="cart-btn">
          장바구니 <b>{count(s.cart)}</b> · {won(cartSum(s))}
        </button>
      </div>

      {s.sheet && (
        <div className="k-dim center">
          <div className="k-dialog resto-sheet" role="dialog" aria-label={`${rById(s.sheet.itemId).name} 담기`}>
            <FoodArt art={rById(s.sheet.itemId).art} size={90} />
            <p className="k-dialog-title">{rById(s.sheet.itemId).name}</p>
            <p className="k-price big">{won(rById(s.sheet.itemId).price * s.sheet.qty)}</p>
            <span className="k-qty big" data-guide="sheet-qty">
              <button aria-label="하나 빼기" onClick={() => dispatch({ t: "sheetQty", d: -1 })}>−</button>
              <b>{s.sheet.qty}</b>
              <button aria-label="하나 더하기" onClick={() => dispatch({ t: "sheetQty", d: 1 })} data-guide="sheet-plus">+</button>
            </span>
            <div className="k-row">
              <button className="k-btn ghost" onClick={() => dispatch({ t: "sheetCancel" })}>취소</button>
              <button className="k-btn brand" onClick={() => dispatch({ t: "sheetAdd" })} data-guide="sheet-add">담기</button>
            </div>
          </div>
        </div>
      )}

      {s.cartOpen && (
        <div className="k-dim right">
          <div className="resto-drawer" role="dialog" aria-label="장바구니">
            <p className="k-dialog-title">장바구니</p>
            <div className="resto-cart-list" data-guide="cart-list">
              {s.cart.length === 0 && <p className="k-empty">아직 담은 메뉴가 없어요</p>}
              {s.cart.map((l) => (
                <div key={l.itemId} className="resto-cart-row">
                  <FoodArt art={rById(l.itemId).art} size={40} />
                  <span className="resto-cart-name"><b>{rById(l.itemId).name}</b><small>{won(rById(l.itemId).price * l.qty)}</small></span>
                  <span className="k-qty">
                    <button aria-label="하나 빼기" onClick={() => dispatch({ t: "qty", id: l.itemId, d: -1 })}>−</button>
                    <b>{l.qty}</b>
                    <button aria-label="하나 더하기" onClick={() => dispatch({ t: "qty", id: l.itemId, d: 1 })}>+</button>
                  </span>
                  <button className="k-x" aria-label={`${rById(l.itemId).name} 빼기`} onClick={() => dispatch({ t: "remove", id: l.itemId })}>×</button>
                </div>
              ))}
            </div>
            <div className="resto-sum"><span>합계</span><b className="k-price">{won(cartSum(s))}</b></div>
            <div className="k-row">
              <button className="k-btn ghost" onClick={() => dispatch({ t: "cartOpen", v: false })}>더 담기</button>
              <button className="k-btn brand" disabled={!s.cart.length} onClick={() => dispatch({ t: "confirmOrder", v: true })} data-guide="order-btn">
                주문하기
              </button>
            </div>
          </div>
        </div>
      )}

      {s.confirmOrder && (
        <div className="k-dim center">
          <div className="k-dialog" role="dialog" aria-label="주문 확인">
            <p className="k-dialog-title">이대로 주문할까요?</p>
            <p>{s.cart.map((l) => `${rById(l.itemId).name} ${l.qty}개`).join(", ")}</p>
            <p className="k-muted">주문하면 바로 주방으로 전달돼서 취소가 어려워요.</p>
            <div className="k-row">
              <button className="k-btn ghost" onClick={() => dispatch({ t: "confirmOrder", v: false })}>취소</button>
              <button
                className="k-btn brand"
                onClick={() => {
                  sounds.ok();
                  dispatch({ t: "order", time: nowText().slice(11) });
                }}
                data-guide="order-confirm"
              >
                주문하기
              </button>
            </div>
          </div>
        </div>
      )}

      {s.justOrdered && (
        <div className="k-dim center">
          <div className="k-dialog" role="dialog" aria-label="주문 완료" data-guide="order-done">
            <svg width="64" height="64" viewBox="0 0 48 48" aria-hidden style={{ justifySelf: "center" }}>
              <circle cx="24" cy="24" r="22" fill="#1b8754" />
              <path d="M14 25l7 7 13-15" stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="k-dialog-title">주문이 주방으로 전달되었어요</p>
            <p>음식이 준비되면 자리로 가져다 드려요.<br />더 필요하면 언제든 추가로 주문할 수 있어요.</p>
            <button className="k-btn brand" onClick={() => dispatch({ t: "orderedOk" })} data-guide="order-done-ok">확인</button>
          </div>
        </div>
      )}

      {s.callOpen && (
        <div className="k-dim center">
          <div className="k-dialog resto-call" role="dialog" aria-label="직원 호출">
            <p className="k-dialog-title">무엇이 필요하세요?</p>
            <p className="k-muted">여러 개를 함께 고를 수 있어요.</p>
            <div className="resto-call-grid" data-guide="call-options">
              {CALL_ITEMS.map((c) => (
                <button key={c.id} aria-pressed={s.callPick.includes(c.id)} onClick={() => dispatch({ t: "callToggle", id: c.id })} data-guide={`call-${c.id}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="k-row">
              <button className="k-btn ghost" onClick={() => dispatch({ t: "callOpen", v: false })}>취소</button>
              <button className="k-btn brand" disabled={!s.callPick.length} onClick={() => { sounds.soft(); dispatch({ t: "callSend" }); }} data-guide="call-send">
                호출하기
              </button>
            </div>
          </div>
        </div>
      )}

      {s.callSent && (
        <div className="k-dim center">
          <div className="k-dialog" role="dialog" aria-label="호출 완료">
            <p className="k-dialog-title">직원에게 알렸어요</p>
            <p>{(s.calls[s.calls.length - 1] ?? []).map((id) => CALL_ITEMS.find((c) => c.id === id)?.label).join(", ")}</p>
            <p className="k-muted">잠시만 기다려 주세요.</p>
            <button className="k-btn brand" onClick={() => dispatch({ t: "callOk" })} data-guide="call-ok">확인</button>
          </div>
        </div>
      )}

      {s.historyOpen && (
        <div className="k-dim center">
          <div className="k-dialog resto-history" role="dialog" aria-label="주문내역">
            <p className="k-dialog-title">주문내역 · 테이블 {TABLE_NO}</p>
            <div className="resto-history-list" data-guide="history-list">
              {s.orders.length === 0 && <p className="k-empty">아직 주문한 메뉴가 없어요</p>}
              {s.orders.map((o) => (
                <div key={o.no} className="resto-history-row">
                  <span className="resto-history-no">{o.no}차 주문 · {o.time}</span>
                  <span>{o.lines.map((l) => `${rById(l.itemId).name} ${l.qty}`).join(", ")}</span>
                  <span className="resto-cooking">조리 중</span>
                </div>
              ))}
            </div>
            <div className="resto-sum"><span>지금까지 주문 금액</span><b className="k-price">{won(orderedSum(s))}</b></div>
            <div className="k-row">
              <button className="k-btn ghost" onClick={() => dispatch({ t: "historyOpen", v: false })}>닫기</button>
              <button className="k-btn brand" disabled={!s.orders.length} onClick={() => dispatch({ t: "bill" })} data-guide="pay-request">
                계산하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── 혼자 해보기: [직원 호출] 도움말 (연습장의 빨간 버튼) ───────── */
export function restaurantHint(s: RestaurantState): string {
  if (s.screen === "welcome") return "화면 아무 곳이나 누르면 주문을 시작해요.";
  if (s.screen === "bill") return "계산은 식사 후 카운터에서 해요. [확인했어요]를 누르세요.";
  if (s.screen === "done") return "끝! 식사 후 카운터에서 테이블 번호를 말하고 계산하세요.";
  if (s.sheet) return "−, + 로 개수를 정하고 [담기]를 누르세요.";
  if (s.confirmOrder) return "맞으면 [주문하기], 고칠 게 있으면 [취소]를 누르세요.";
  if (s.justOrdered) return "주문이 주방에 전달됐어요. [확인]을 누르세요.";
  if (s.callOpen) return "필요한 것(물, 앞접시 등)을 누르고 [호출하기]를 누르세요.";
  if (s.callSent) return "[확인]을 누르고 직원을 기다리세요.";
  if (s.historyOpen) return s.orders.length ? "주문한 메뉴와 금액을 확인하세요. 다 먹었으면 [계산하기]를 누르세요." : "아직 주문한 게 없어요. [닫기]를 누르고 메뉴를 담으세요.";
  if (s.cartOpen) return s.cart.length ? "담은 메뉴를 확인하고 [주문하기]를 누르세요." : "[더 담기]를 누르고 메뉴를 골라 담으세요.";
  if (s.cart.length) return "다 담았으면 오른쪽 아래 [장바구니]를 누르고 [주문하기]를 하세요.";
  if (s.orders.length) return "더 주문하려면 메뉴를 담고, 물이 필요하면 [직원 호출], 다 먹었으면 [주문내역] → [계산하기]를 누르세요.";
  return "왼쪽에서 메뉴 종류(식사, 곁들임, 음료)를 고르고 먹고 싶은 메뉴를 누르세요.";
}

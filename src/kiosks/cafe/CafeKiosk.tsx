import { useEffect, useReducer } from "react";
import type { KioskProps, OrderResult } from "../../engine/types";
import { KioskDevice, type CardState } from "../../engine/KioskDevice";
import { nextOrderNo, nowText } from "../../engine/orderNo";
import { useToast } from "../../components/Toast";
import { sounds } from "../../lib/sound";
import { won } from "../../lib/format";
import { DrinkArt } from "./DrinkArt";
import { BarcodeScanner } from "../../scanner/BarcodeScanner";
import { PRACTICE_CARDS } from "../../data/practiceCards";
import type { Scanned } from "../../scanner/codes";
import {
  byId, CATEGORIES, CUP_LABEL, MENU, SHOT, SYRUP, TUMBLER_DC,
  type CatId, type Cup, type Temp,
} from "./menu";

/* ───────── 상태 ───────── */
export type Screen =
  | "attract" | "menu" | "confirm" | "member" | "payMethod" | "cashNotice"
  | "cardInsert" | "cardError" | "processing" | "cardRemove" | "receipt" | "done";

export type Sheet = { itemId: string; qty: number; temp: Temp | null; cup: Cup | null; shot: boolean; syrup: boolean };
export type Line = Omit<Sheet, "itemId"> & { key: string; itemId: string; unit: number };

export type CafeState = {
  screen: Screen;
  orderType: "dine" | "takeout" | null;
  category: CatId;
  sheet: Sheet | null;
  cart: Line[];
  askHome: boolean;
  orderNo: string;
  when: string;
  receiptTaken: boolean;
  /** 멤버십 적립: 카드 주인과 적립 전 스탬프 수 */
  member: { holder: string; stamps: number } | null;
  coupon: number;
  /** STEP 2에서 열린 인식기 */
  scanFor: "member" | "coupon" | null;
};

const initial: CafeState = {
  screen: "attract", orderType: null, category: "rec", sheet: null, cart: [],
  askHome: false, orderNo: "", when: "", receiptTaken: false,
  member: null, coupon: 0, scanFor: null,
};

type Action =
  | { t: "start"; orderType: "dine" | "takeout" }
  | { t: "cat"; id: CatId }
  | { t: "open"; id: string }
  | { t: "sheet"; patch: Partial<Sheet> }
  | { t: "sheetCancel" }
  | { t: "sheetDone" }
  | { t: "qty"; key: string; d: number }
  | { t: "remove"; key: string }
  | { t: "clear" }
  | { t: "askHome"; v: boolean }
  | { t: "reset" }
  | { t: "go"; screen: Screen }
  | { t: "paid"; orderNo: string; when: string }
  | { t: "takeReceipt" }
  | { t: "scanFor"; v: CafeState["scanFor"] }
  | { t: "member"; holder: string; stamps: number }
  | { t: "coupon"; amount: number };

export const unitPrice = (s: Pick<Sheet, "itemId" | "cup" | "shot" | "syrup">) =>
  byId(s.itemId).price + (s.shot ? SHOT : 0) + (s.syrup ? SYRUP : 0) - (s.cup === "tumbler" ? TUMBLER_DC : 0);
export const cartTotal = (cart: Line[]) => cart.reduce((a, l) => a + l.unit * l.qty, 0);
export const cartCount = (cart: Line[]) => cart.reduce((a, l) => a + l.qty, 0);
export const payTotal = (s: Pick<CafeState, "cart" | "coupon">) => Math.max(0, cartTotal(s.cart) - s.coupon);
/** 스탬프는 음료 1잔에 1개 (디저트 제외) */
export const stampEarn = (cart: Line[]) => cart.filter((l) => byId(l.itemId).temps.length > 0).reduce((a, l) => a + l.qty, 0);

function reducer(s: CafeState, a: Action): CafeState {
  switch (a.t) {
    case "start":
      return { ...initial, screen: "menu", orderType: a.orderType };
    case "cat":
      return { ...s, category: a.id };
    case "open": {
      const item = byId(a.id);
      const cup: Cup | null = item.temps.length === 0 ? null : s.orderType === "takeout" ? "takeout" : "store";
      const temp = item.temps.length === 1 ? item.temps[0] : null;
      return { ...s, sheet: { itemId: a.id, qty: 1, temp, cup, shot: false, syrup: false } };
    }
    case "sheet":
      return s.sheet ? { ...s, sheet: { ...s.sheet, ...a.patch } } : s;
    case "sheetCancel":
      return { ...s, sheet: null };
    case "sheetDone": {
      const sh = s.sheet;
      if (!sh) return s;
      const key = [sh.itemId, sh.temp, sh.cup, sh.shot, sh.syrup].join("|");
      const found = s.cart.find((l) => l.key === key);
      const cart = found
        ? s.cart.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + sh.qty) } : l))
        : [...s.cart, { ...sh, key, unit: unitPrice(sh) }];
      return { ...s, sheet: null, cart };
    }
    case "qty":
      return {
        ...s,
        cart: s.cart.map((l) => (l.key === a.key ? { ...l, qty: Math.max(1, Math.min(20, l.qty + a.d)) } : l)),
      };
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
    case "scanFor":
      return { ...s, scanFor: a.v };
    case "member":
      return { ...s, member: { holder: a.holder, stamps: a.stamps }, scanFor: null };
    case "coupon":
      return { ...s, coupon: a.amount, scanFor: null };
  }
}

export function lineTitle(l: Pick<Line, "itemId" | "temp">) {
  return `${l.temp ? `(${l.temp}) ` : ""}${byId(l.itemId).name}`;
}
export function lineDetail(l: Pick<Line, "cup" | "shot" | "syrup">) {
  return [l.cup ? CUP_LABEL[l.cup] : "", l.shot ? "샷 추가" : "", l.syrup ? "바닐라시럽 추가" : ""].filter(Boolean).join(" · ");
}

function toResult(s: CafeState): OrderResult {
  return {
    shop: "CAFE NINE",
    orderNo: s.orderNo,
    when: s.when,
    total: payTotal(s),
    extra: s.orderType === "takeout" ? "포장" : "매장",
    lines: [
      ...s.cart.map((l) => ({ name: lineTitle(l), detail: lineDetail(l), qty: l.qty, amount: l.unit * l.qty })),
      ...(s.coupon ? [{ name: "쿠폰 할인", qty: 1, amount: -s.coupon }] : []),
    ],
    notes: s.member
      ? [`${s.member.holder}님 스탬프 ${stampEarn(s.cart)}개 적립 (모두 ${Math.min(10, s.member.stamps + stampEarn(s.cart))}개)`]
      : undefined,
  };
}

/* ───────── 화면 ───────── */
export function CafeKiosk({ onState, onComplete, onReceipt }: KioskProps<CafeState>) {
  const [s, dispatch] = useReducer(reducer, initial);
  const toast = useToast((t) => t.show);

  useEffect(() => onState(s), [s, onState]);

  // 결제 처리 중: 잠깐 기다린 뒤 "카드를 뽑아주세요"
  useEffect(() => {
    if (s.screen !== "processing") return;
    const t = setTimeout(() => {
      sounds.ok();
      dispatch({ t: "go", screen: "cardRemove" });
    }, 2400);
    return () => clearTimeout(t);
  }, [s.screen]);

  const card: CardState =
    s.screen === "cardInsert" ? "await" : s.screen === "processing" ? "inserted" : s.screen === "cardRemove" ? "eject" : "none";

  const onCardSlot = () => {
    if (s.screen === "cardInsert") {
      sounds.soft();
      dispatch({ t: "go", screen: "processing" });
    } else if (s.screen === "cardRemove") {
      sounds.soft();
      dispatch({ t: "paid", orderNo: nextOrderNo("A"), when: nowText() });
    } else if (s.screen === "cardError") {
      toast("다른 카드로 결제하려면 화면의 [다른 카드로 결제]를 누르세요.");
    } else if (s.screen === "processing") {
      toast("결제 중에는 카드를 빼지 마세요!");
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

  return (
    <KioskDevice card={card} receiptOut={s.screen === "receipt" && !s.receiptTaken} onCardSlot={onCardSlot} onReceipt={onReceiptSlot}>
      <div className="cafe">
        {s.screen === "attract" && <Attract onPick={(o) => dispatch({ t: "start", orderType: o })} />}
        {s.screen === "menu" && <MenuScreen s={s} dispatch={dispatch} />}
        {s.screen === "confirm" && <Confirm s={s} dispatch={dispatch} />}
        {s.screen === "member" && <Member s={s} dispatch={dispatch} />}
        {s.screen === "payMethod" && <PayMethod s={s} dispatch={dispatch} />}
        {s.screen === "cashNotice" && <CashNotice dispatch={dispatch} />}
        {(s.screen === "cardInsert" || s.screen === "processing" || s.screen === "cardRemove" || s.screen === "cardError") && (
          <CardPay s={s} dispatch={dispatch} onCardSlot={onCardSlot} />
        )}
        {s.screen === "receipt" && (
          <ReceiptScreen
            s={s}
            onOk={() => {
              dispatch({ t: "go", screen: "done" });
              onComplete(toResult(s));
            }}
          />
        )}
        {s.screen === "done" && <Done s={s} onHome={() => dispatch({ t: "reset" })} />}

        {s.askHome && (
          <div className="k-dim">
            <div className="k-dialog" role="dialog" aria-label="처음으로 돌아가기">
              <p className="k-dialog-title">처음 화면으로 돌아갈까요?</p>
              <p>지금까지 담은 메뉴가 모두 지워져요.</p>
              <div className="k-row">
                <button className="k-btn ghost" onClick={() => dispatch({ t: "askHome", v: false })} data-guide="home-no">
                  아니요
                </button>
                <button className="k-btn brand" onClick={() => dispatch({ t: "reset" })} data-guide="home-yes">
                  처음으로
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </KioskDevice>
  );
}

type D = React.Dispatch<Action>;

function Logo() {
  return (
    <div className="k-logo" aria-label="CAFE NINE">
      <span className="k-logo-n">N</span>
      <span className="k-logo-t">CAFE NINE</span>
    </div>
  );
}

function Attract({ onPick }: { onPick: (o: "dine" | "takeout") => void }) {
  return (
    <div className="attract">
      <div className="attract-poster">
        <p className="attract-kicker">어서오세요</p>
        <h2 className="attract-title">CAFE<br />NINE</h2>
        <div className="attract-art">
          <figure><DrinkArt art={byId("americano").art} temp="ICED" size={96} /><figcaption>Best · 아이스 아메리카노</figcaption></figure>
          <figure><DrinkArt art={byId("latte").art} temp="ICED" size={96} /><figcaption>Special · 카페라떼</figcaption></figure>
          <figure><DrinkArt art={byId("strawberry").art} temp="ICED" size={96} /><figcaption>New · 딸기스무디</figcaption></figure>
        </div>
      </div>
      <div className="attract-order" data-guide="order-type">
        <p>주문방법을 선택해주세요 ▼</p>
        <div className="k-row">
          <button className="k-btn white" onClick={() => onPick("dine")} data-guide="order-dine">
            매장에서 먹어요
          </button>
          <button className="k-btn white" onClick={() => onPick("takeout")} data-guide="order-takeout">
            포장해서 갈게요
          </button>
        </div>
      </div>
    </div>
  );
}

function TopStrip({ s, dispatch }: { s: CafeState; dispatch: D }) {
  return (
    <div className="k-head">
      <Logo />
      <span className="k-chip">{s.orderType === "takeout" ? "포장" : "매장"}</span>
      <button
        className="k-icon-btn"
        onClick={() => (s.cart.length ? dispatch({ t: "askHome", v: true }) : dispatch({ t: "reset" }))}
        data-guide="btn-home"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" />
        </svg>
        처음으로
      </button>
    </div>
  );
}

function MenuScreen({ s, dispatch }: { s: CafeState; dispatch: D }) {
  const items = MENU.filter((m) => m.cats.includes(s.category));
  return (
    <div className="menu">
      <TopStrip s={s} dispatch={dispatch} />
      <nav className="k-tabs" data-guide="tabs" aria-label="메뉴 종류">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            aria-pressed={s.category === c.id}
            onClick={() => dispatch({ t: "cat", id: c.id })}
            data-guide={`tab-${c.id}`}
          >
            {c.label}
          </button>
        ))}
      </nav>
      <div className="k-grid">
        {items.map((m) => (
          <button key={m.id} className="k-item" onClick={() => dispatch({ t: "open", id: m.id })} data-guide={`item-${m.id}`}>
            <DrinkArt art={m.art} temp={m.temps.length === 1 ? m.temps[0] : "ICED"} size={72} />
            <span className="k-item-name">{m.name}</span>
            <span className="k-price">{won(m.price)}</span>
          </button>
        ))}
      </div>
      <CartBar s={s} dispatch={dispatch} />
      {s.sheet && <OptionSheet s={s} dispatch={dispatch} />}
    </div>
  );
}

function CartBar({ s, dispatch }: { s: CafeState; dispatch: D }) {
  return (
    <div className="k-cart" data-guide="cart">
      <div className="k-cart-head">
        <span>선택한 상품 <b>{cartCount(s.cart)}</b>개</span>
        <span>총 주문금액 <b className="k-price">{won(cartTotal(s.cart))}</b></span>
      </div>
      <div className="k-cart-list">
        {s.cart.length === 0 && <p className="k-empty">메뉴를 눌러 담아주세요</p>}
        {s.cart.map((l) => (
          <div key={l.key} className="k-line">
            <button className="k-x" aria-label={`${lineTitle(l)} 빼기`} onClick={() => dispatch({ t: "remove", key: l.key })}>
              ×
            </button>
            <span className="k-line-name">{lineTitle(l)}</span>
            {lineDetail(l) && <span className="k-line-opt">{lineDetail(l)}</span>}
            <span className="k-qty">
              <button aria-label="하나 빼기" onClick={() => dispatch({ t: "qty", key: l.key, d: -1 })}>−</button>
              <b>{l.qty}</b>
              <button aria-label="하나 더하기" onClick={() => dispatch({ t: "qty", key: l.key, d: 1 })}>+</button>
            </span>
          </div>
        ))}
      </div>
      <div className="k-row">
        <button className="k-btn ghost" disabled={!s.cart.length} onClick={() => dispatch({ t: "clear" })}>
          전체삭제
        </button>
        <button className="k-btn brand" disabled={!s.cart.length} onClick={() => dispatch({ t: "go", screen: "confirm" })} data-guide="btn-checkout">
          결제하기
        </button>
      </div>
    </div>
  );
}

function OptionSheet({ s, dispatch }: { s: CafeState; dispatch: D }) {
  const sh = s.sheet!;
  const item = byId(sh.itemId);
  const ready = item.temps.length === 0 || sh.temp !== null;
  const set = (patch: Partial<Sheet>) => dispatch({ t: "sheet", patch });
  return (
    <div className="k-dim">
      <div className="k-sheet" role="dialog" aria-label={`${item.name} 옵션 선택`}>
        <div className="k-sheet-top">
          <DrinkArt art={item.art} temp={sh.temp ?? (item.temps[0] as Temp | undefined)} size={76} />
          <div>
            <p className="k-sheet-name">{item.name}</p>
            <p className="k-price big">{won(unitPrice(sh) * sh.qty)}</p>
          </div>
        </div>

        {item.temps.length > 0 && (
          <div className="k-opt">
            <p className="k-opt-title">온도 {item.temps.length > 1 && <em>(필수)</em>}</p>
            <div className="k-choices">
              {(["HOT", "ICED"] as Temp[]).map((t) => (
                <button
                  key={t}
                  className={`temp ${t}`}
                  aria-pressed={sh.temp === t}
                  disabled={!item.temps.includes(t)}
                  onClick={() => set({ temp: t })}
                  data-guide={`opt-temp-${t}`}
                >
                  {t === "HOT" ? "HOT 따뜻하게" : "ICED 차갑게"}
                </button>
              ))}
            </div>
          </div>
        )}

        {sh.cup && (
          <div className="k-opt">
            <p className="k-opt-title">컵 선택</p>
            <div className="k-choices three">
              {(["store", "takeout", "tumbler"] as Cup[]).map((c) => (
                <button key={c} aria-pressed={sh.cup === c} onClick={() => set({ cup: c })} data-guide={`opt-cup-${c}`}>
                  {CUP_LABEL[c]}
                  {c === "tumbler" && <small>-{won(TUMBLER_DC)}</small>}
                </button>
              ))}
            </div>
          </div>
        )}

        {item.coffee && (
          <div className="k-opt">
            <p className="k-opt-title">추가 선택</p>
            <div className="k-choices">
              <button aria-pressed={sh.shot} onClick={() => set({ shot: !sh.shot })} data-guide="opt-shot">
                샷 추가<small>+{won(SHOT)}</small>
              </button>
              <button aria-pressed={sh.syrup} onClick={() => set({ syrup: !sh.syrup })} data-guide="opt-syrup">
                바닐라시럽 추가<small>+{won(SYRUP)}</small>
              </button>
            </div>
          </div>
        )}

        <div className="k-opt k-opt-qty">
          <p className="k-opt-title">수량</p>
          <span className="k-qty big" data-guide="opt-qty">
            <button aria-label="수량 하나 빼기" onClick={() => set({ qty: Math.max(1, sh.qty - 1) })} data-guide="opt-qty-minus">−</button>
            <b>{sh.qty}</b>
            <button aria-label="수량 하나 더하기" onClick={() => set({ qty: Math.min(20, sh.qty + 1) })} data-guide="opt-qty-plus">+</button>
          </span>
        </div>

        {!ready && <p className="k-warn">온도(HOT/ICED)를 먼저 골라주세요</p>}
        <div className="k-row">
          <button className="k-btn ghost" onClick={() => dispatch({ t: "sheetCancel" })} data-guide="opt-cancel">
            취소
          </button>
          <button className="k-btn brand" disabled={!ready} onClick={() => dispatch({ t: "sheetDone" })} data-guide="opt-done">
            선택완료
          </button>
        </div>
      </div>
    </div>
  );
}

function StepHead({ step, title }: { step: number; title: string }) {
  return (
    <div className="k-step">
      <Logo />
      <p className="k-step-no">STEP {step}.</p>
      <h3 className="k-step-title">{title}</h3>
    </div>
  );
}

function Summary({ s }: { s: CafeState }) {
  return (
    <dl className="k-summary">
      <div><dt>주문 금액</dt><dd>{won(cartTotal(s.cart))}</dd></div>
      <div><dt>할인 금액</dt><dd className="dc">{s.coupon ? "-" : ""}{won(s.coupon)}</dd></div>
      <div className="final"><dt>결제 금액</dt><dd>{won(payTotal(s))}</dd></div>
    </dl>
  );
}

const DEMO_MEMBER = PRACTICE_CARDS.find((c) => c.code === "KX-MEM-CAFE-0001")!;
const DEMO_COUPON = PRACTICE_CARDS.find((c) => c.code === "KX-CPN-1000")!;

function Member({ s, dispatch }: { s: CafeState; dispatch: D }) {
  const earn = stampEarn(s.cart);
  const onScan = (x: Scanned) => {
    if (x.kind === "member" && "card" in x) dispatch({ t: "member", holder: x.card.holder ?? "회원", stamps: x.card.stamps ?? 0 });
    if (x.kind === "coupon" && "card" in x) dispatch({ t: "coupon", amount: x.card.amount ?? 0 });
  };
  return (
    <div className="k-page">
      <StepHead step={2} title="멤버십 적립 · 쿠폰" />
      <div className="k-body">
        <div className="k-pay" data-guide="member-options">
          <button aria-pressed={s.scanFor === "member"} onClick={() => dispatch({ t: "scanFor", v: s.scanFor === "member" ? null : "member" })} data-guide="member-open">
            <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden><rect x="4" y="10" width="40" height="28" rx="4" fill="#d3261e" /><text x="24" y="29" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff">STAMP</text></svg>
            {s.member ? "적립 완료 ✓" : "멤버십 적립"}
          </button>
          <button aria-pressed={s.scanFor === "coupon"} onClick={() => dispatch({ t: "scanFor", v: s.scanFor === "coupon" ? null : "coupon" })} data-guide="coupon-open">
            <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden><path d="M4 14h40v7a4 4 0 0 0 0 6v7H4v-7a4 4 0 0 0 0-6z" fill="#f08a00" /><text x="24" y="28" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff">-1,000</text></svg>
            {s.coupon ? "쿠폰 적용 ✓" : "쿠폰 사용"}
          </button>
        </div>

        {s.member && (
          <p className="k-note ok">{s.member.holder}님 · 스탬프 {s.member.stamps}개 → 주문하면 <b>{Math.min(10, s.member.stamps + earn)}개</b></p>
        )}
        {s.coupon > 0 && <p className="k-note ok">쿠폰 {won(s.coupon)} 할인이 적용됐어요</p>}

        {s.scanFor === "member" && (
          <BarcodeScanner
            compact
            accept={["member"]}
            prompt="멤버십 카드의 바코드를 카메라에 비춰주세요"
            reject={(x) => (x.kind === "member" && "card" in x && x.card.shop !== "cafe" ? "CAFE NINE 멤버십 카드가 아니에요. 그 카드는 마트에서 써요." : null)}
            onScan={onScan}
            fallback={{ label: "카메라 없이 적립하기 (연습)", onClick: () => dispatch({ t: "member", holder: DEMO_MEMBER.holder!, stamps: DEMO_MEMBER.stamps! }) }}
          />
        )}
        {s.scanFor === "coupon" && (
          <BarcodeScanner
            compact
            accept={["coupon"]}
            prompt="쿠폰의 바코드를 카메라에 비춰주세요"
            reject={() => (s.coupon ? "쿠폰은 한 번만 쓸 수 있어요." : null)}
            onScan={onScan}
            fallback={{ label: "카메라 없이 쿠폰 쓰기 (연습)", onClick: () => dispatch({ t: "coupon", amount: DEMO_COUPON.amount! }) }}
          />
        )}
        {!s.scanFor && <Summary s={s} />}
      </div>
      <div className="k-foot">
        <button className="k-btn ghost" onClick={() => dispatch({ t: "go", screen: "confirm" })}>
          이전
        </button>
        <button className="k-btn brand" onClick={() => dispatch({ t: "go", screen: "payMethod" })} data-guide="member-next">
          {s.member || s.coupon ? "다음" : "적립 안 하고 다음"}
        </button>
      </div>
    </div>
  );
}

function Confirm({ s, dispatch }: { s: CafeState; dispatch: D }) {
  return (
    <div className="k-page">
      <StepHead step={1} title="주문 내역을 확인해주세요" />
      <div className="k-body">
        <p className="k-chip solid">{s.orderType === "takeout" ? "포장해서 갈게요" : "매장에서 먹어요"}</p>
        <ul className="k-review">
          {s.cart.map((l) => (
            <li key={l.key}>
              <DrinkArt art={byId(l.itemId).art} temp={l.temp ?? undefined} size={52} />
              <div>
                <b>{lineTitle(l)}</b>
                {lineDetail(l) && <small>{lineDetail(l)}</small>}
              </div>
              <span>{l.qty}개</span>
              <span className="k-price">{won(l.unit * l.qty)}</span>
            </li>
          ))}
        </ul>
        <Summary s={s} />
      </div>
      <div className="k-foot">
        <button className="k-btn ghost" onClick={() => dispatch({ t: "go", screen: "menu" })} data-guide="btn-prev">
          이전
        </button>
        <button className="k-btn brand" onClick={() => dispatch({ t: "go", screen: "member" })} data-guide="btn-next">
          다음
        </button>
      </div>
    </div>
  );
}

function PayMethod({ s, dispatch }: { s: CafeState; dispatch: D }) {
  return (
    <div className="k-page">
      <StepHead step={3} title="결제방식을 선택해주세요" />
      <div className="k-body">
        <div className="k-pay">
          <button onClick={() => dispatch({ t: "go", screen: "cardInsert" })} data-guide="pay-card">
            <svg width="56" height="56" viewBox="0 0 48 48" fill="none" aria-hidden>
              <rect x="4" y="10" width="40" height="28" rx="4" fill="#3a69d4" />
              <rect x="4" y="16" width="40" height="5" fill="#1f3f8f" />
              <rect x="9" y="26" width="9" height="6" rx="1.5" fill="#f3d77b" />
            </svg>
            신용/체크카드
          </button>
          <button onClick={() => dispatch({ t: "go", screen: "cashNotice" })} data-guide="pay-cash">
            <svg width="56" height="56" viewBox="0 0 48 48" fill="none" aria-hidden>
              <rect x="4" y="12" width="40" height="24" rx="3" fill="#5aa469" />
              <circle cx="24" cy="24" r="7" fill="#d9f0dd" />
              <text x="24" y="28" textAnchor="middle" fontSize="10" fontWeight="900" fill="#2f6b3b">₩</text>
            </svg>
            현금
          </button>
        </div>
        <Summary s={s} />
      </div>
      <div className="k-foot">
        <button className="k-btn ghost" onClick={() => dispatch({ t: "askHome", v: true })}>
          전체취소
        </button>
        <button className="k-btn ghost" onClick={() => dispatch({ t: "go", screen: "member" })}>
          이전
        </button>
      </div>
    </div>
  );
}

function CashNotice({ dispatch }: { dispatch: D }) {
  return (
    <div className="k-page">
      <StepHead step={3} title="현금 결제 안내" />
      <div className="k-body center">
        <div className="k-notice">
          <p className="k-notice-big">이 키오스크는 현금을 받지 않아요</p>
          <p>현금으로 결제하시려면 <b>카운터</b>에서 주문해 주세요.</p>
          <p className="k-muted">키오스크는 카드나 모바일 결제만 되는 곳이 많아요.</p>
        </div>
      </div>
      <div className="k-foot">
        <button className="k-btn ghost" onClick={() => dispatch({ t: "askHome", v: true })}>
          처음으로
        </button>
        <button className="k-btn brand" onClick={() => dispatch({ t: "go", screen: "payMethod" })} data-guide="btn-other-pay">
          다른 방법으로 결제
        </button>
      </div>
    </div>
  );
}

function CardPay({ s, dispatch, onCardSlot }: { s: CafeState; dispatch: D; onCardSlot: () => void }) {
  const total = payTotal(s);
  const onScan = (x: Scanned) => {
    if (x.kind !== "card" || !("card" in x)) return;
    if ((x.card.balance ?? 0) >= total) dispatch({ t: "go", screen: "processing" });
    else dispatch({ t: "go", screen: "cardError" });
  };
  return (
    <div className="k-page">
      <StepHead step={4} title={s.screen === "cardRemove" ? "결제가 완료되었습니다" : "카드 결제"} />
      <div className="k-body center" data-guide="screen-msg">
        {s.screen === "cardInsert" && (
          <>
            <CardIllust />
            <p className="k-say">화면 아래 <b>카드 투입구</b>에<br />IC카드를 꽂아주세요</p>
            <p className="k-muted">결제 금액 <b className="k-price">{won(total)}</b></p>
            <div className="k-or"><span>또는 체험카드를 카메라에</span></div>
            <BarcodeScanner compact accept={["card"]} prompt="체험 신용카드의 바코드를 비춰주세요" onScan={onScan} guideId="card-scan" />
            <button className="k-link" onClick={onCardSlot}>화면에서 카드 꽂기 (연습)</button>
          </>
        )}
        {s.screen === "cardError" && (
          <>
            <svg width="72" height="72" viewBox="0 0 48 48" aria-hidden>
              <circle cx="24" cy="24" r="22" fill="#d3261e" />
              <path d="M24 12v15" stroke="#fff" strokeWidth="5" strokeLinecap="round" /><circle cx="24" cy="35" r="3" fill="#fff" />
            </svg>
            <p className="k-say"><b>잔액이 부족합니다</b></p>
            <p>이 카드로는 결제할 수 없어요.<br />다른 카드로 결제해 주세요.</p>
            <p className="k-muted">당황하지 마세요. 키오스크에서는 이런 안내가 자주 나와요.</p>
            <div className="k-row" style={{ width: "100%" }}>
              <button className="k-btn ghost" onClick={() => dispatch({ t: "go", screen: "payMethod" })}>결제방식 다시 고르기</button>
              <button className="k-btn brand" onClick={() => dispatch({ t: "go", screen: "cardInsert" })} data-guide="btn-other-card">다른 카드로 결제</button>
            </div>
          </>
        )}
        {s.screen === "processing" && (
          <>
            <span className="k-spinner" aria-hidden />
            <p className="k-say">결제 중입니다</p>
            <p className="k-warn">카드를 빼지 마세요!</p>
          </>
        )}
        {s.screen === "cardRemove" && (
          <>
            <svg width="72" height="72" viewBox="0 0 48 48" aria-hidden>
              <circle cx="24" cy="24" r="22" fill="#1b8754" />
              <path d="M14 25l7 7 13-15" stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="k-say"><b>카드를 뽑아주세요</b></p>
            <p className="k-muted">카드를 두고 가지 않도록 꼭 챙기세요.</p>
            <button className="k-link" onClick={onCardSlot}>화면에서 카드 뽑기 (연습)</button>
          </>
        )}
      </div>
      <div className="k-foot">
        {s.screen === "cardInsert" || s.screen === "cardError" ? (
          <button className="k-btn ghost" onClick={() => dispatch({ t: "go", screen: "payMethod" })}>
            취소
          </button>
        ) : (
          <span className="k-muted">잠시만 기다려 주세요</span>
        )}
      </div>
    </div>
  );
}

function CardIllust() {
  return (
    <svg width="170" height="120" viewBox="0 0 170 120" aria-hidden className="k-card-illust">
      <rect x="20" y="92" width="130" height="16" rx="6" fill="#2a2e37" />
      <rect x="35" y="98" width="100" height="4" rx="2" fill="#0d0f13" />
      <g className="k-card-move">
        <rect x="50" y="8" width="70" height="86" rx="8" fill="#3a69d4" />
        <rect x="60" y="66" width="18" height="14" rx="3" fill="#f3d77b" />
        <text x="85" y="34" fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle">연습용</text>
      </g>
      <path d="M85 -2 v0" />
    </svg>
  );
}

function ReceiptScreen({ s, onOk }: { s: CafeState; onOk: () => void }) {
  return (
    <div className="k-page">
      <StepHead step={5} title="결제 완료" />
      <div className="k-body center">
        <p className="k-say">영수증이 출력되었습니다</p>
        <div className="k-orderno">
          <span>주문번호</span>
          <b>{s.orderNo}</b>
        </div>
        <p className="k-warn">결제하신 카드와 영수증을 꼭 챙겨주세요!</p>
        {!s.receiptTaken ? (
          <p className="k-muted">↓ 화면 아래 영수증 출구에서 영수증을 챙겨주세요</p>
        ) : (
          <p className="k-ok">영수증을 챙겼어요 ✓</p>
        )}
      </div>
      <div className="k-foot">
        <button className="k-btn brand" disabled={!s.receiptTaken} onClick={onOk} data-guide="btn-receipt-ok">
          확인
        </button>
      </div>
    </div>
  );
}

function Done({ s, onHome }: { s: CafeState; onHome: () => void }) {
  return (
    <div className="k-page">
      <div className="k-body center">
        <Logo />
        <p className="k-say">주문이 완료되었습니다</p>
        <div className="k-orderno">
          <span>주문번호</span>
          <b>{s.orderNo}</b>
        </div>
        <p>주문번호를 부르면 카운터에서<br />음료를 받아가세요.</p>
        <p className="k-muted">영수증의 주문번호가 필요해요.</p>
      </div>
      <div className="k-foot">
        <button className="k-btn brand" onClick={onHome}>
          처음 화면으로
        </button>
      </div>
    </div>
  );
}

/* ───────── 혼자 해보기: [직원 호출] 도움말 ───────── */
export function cafeHint(s: CafeState): string {
  switch (s.screen) {
    case "attract":
      return "먼저 매장에서 드실지, 포장해서 가실지 골라요. 화면 아래 두 버튼 중 하나를 누르세요.";
    case "menu":
      if (s.askHome) return "[처음으로]를 누르면 담은 메뉴가 지워져요. 계속 주문하려면 [아니요]를 누르세요.";
      if (s.sheet) {
        const item = byId(s.sheet.itemId);
        if (item.temps.length > 1 && !s.sheet.temp) return "따뜻한 음료는 HOT, 차가운 음료는 ICED를 먼저 누르세요.";
        return "컵과 수량을 확인하고 아래 [선택완료]를 누르세요. 잘못 골랐으면 [취소]를 누르세요.";
      }
      if (!s.cart.length) return "위쪽 메뉴 종류(커피, 티 등)를 누른 뒤, 마시고 싶은 메뉴 그림을 누르세요.";
      return "다 담았으면 화면 아래 [결제하기]를 누르세요. 수량은 − + 로 바꿀 수 있어요.";
    case "confirm":
      return "주문 내역이 맞는지 보고 [다음]을 누르세요. 고치려면 [이전]을 누르세요.";
    case "member":
      if (s.scanFor) return "카드나 쿠폰의 바코드를 카메라 네모 칸 안에 비추세요. 카메라가 없으면 파란 버튼을 누르세요.";
      return "멤버십 카드가 있으면 [멤버십 적립]을 누르세요. 없으면 [적립 안 하고 다음]을 누르면 돼요.";
    case "cardError":
      return "잔액이 부족한 카드예요. [다른 카드로 결제]를 누르고 다른 카드를 쓰세요.";
    case "payMethod":
      return "카드로 결제하려면 [신용/체크카드]를 누르세요. 키오스크는 현금을 안 받는 곳이 많아요.";
    case "cashNotice":
      return "현금은 카운터에서 결제해요. 카드로 하려면 [다른 방법으로 결제]를 누르세요.";
    case "cardInsert":
      return "화면 아래 [카드 투입구]를 눌러 카드를 꽂으세요. 체험카드가 있으면 바코드를 카메라에 비춰도 돼요.";
    case "processing":
      return "결제 중이에요. 카드를 빼지 말고 잠시 기다리세요.";
    case "cardRemove":
      return "결제가 끝났어요. 화면 아래 [카드 투입구]를 눌러 카드를 꼭 챙기세요.";
    case "receipt":
      return s.receiptTaken
        ? "영수증을 챙겼어요. [확인]을 누르세요."
        : "화면 아래 [영수증] 출구를 눌러 영수증을 챙기세요. 주문번호가 적혀 있어요.";
    case "done":
      return "주문 끝! 주문번호를 부르면 음료를 받으러 가면 돼요.";
  }
}

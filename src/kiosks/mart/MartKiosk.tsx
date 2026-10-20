import { useEffect, useReducer } from "react";
import type { KioskProps, OrderResult } from "../../engine/types";
import { KioskDevice, type CardState } from "../../engine/KioskDevice";
import { nextOrderNo, nowText } from "../../engine/orderNo";
import { useToast } from "../../components/Toast";
import { sounds } from "../../lib/sound";
import { won } from "../../lib/format";
import { BarcodeScanner } from "../../scanner/BarcodeScanner";
import type { Scanned } from "../../scanner/codes";
import { PRACTICE_CARDS, PRODUCTS, type Product } from "../../data/practiceCards";
import {
  CardPayScreen, CashNoticeScreen, KLogo, PayMethodScreen, PaySummary, ReceiptScreen, StepHead, useProcessing,
  type PayScreen,
} from "../shared/Pay";
import { ProductArt } from "./ProductArt";

/* ───────── 상태 ───────── */
export type MartScreen = "attract" | "scan" | "bag" | "member" | "payMethod" | "cashNotice" | PayScreen | "receipt" | "done";
export type BagId = "none" | "paper" | "trash";
export const BAGS: { id: BagId; label: string; sub: string; price: number }[] = [
  { id: "none", label: "필요 없어요", sub: "장바구니를 가져왔어요", price: 0 },
  { id: "paper", label: "종이봉투", sub: "1장", price: 100 },
  { id: "trash", label: "종량제봉투 20L", sub: "1장", price: 490 },
];

export type MartState = {
  screen: MartScreen;
  items: { code: string; qty: number }[];
  lastCode: string | null;
  bag: BagId | null;
  member: { holder: string; points: number } | null;
  scanMember: boolean;
  askHome: boolean;
  orderNo: string;
  when: string;
  receiptTaken: boolean;
};

const initial: MartState = {
  screen: "attract", items: [], lastCode: null, bag: null, member: null, scanMember: false,
  askHome: false, orderNo: "", when: "", receiptTaken: false,
};

type Action =
  | { t: "start" }
  | { t: "scan"; code: string }
  | { t: "qty"; code: string; d: number }
  | { t: "remove"; code: string }
  | { t: "clear" }
  | { t: "askHome"; v: boolean }
  | { t: "reset" }
  | { t: "go"; screen: MartScreen }
  | { t: "bag"; id: BagId }
  | { t: "scanMember"; v: boolean }
  | { t: "member"; holder: string; points: number }
  | { t: "paid"; orderNo: string; when: string }
  | { t: "takeReceipt" };

export const productByCode = (code: string) => PRODUCTS.find((p) => p.code === code)!;
export const productById = (id: string) => PRODUCTS.find((p) => p.id === id)!;
export const goodsTotal = (s: Pick<MartState, "items">) => s.items.reduce((a, i) => a + productByCode(i.code).price * i.qty, 0);
export const itemCount = (s: Pick<MartState, "items">) => s.items.reduce((a, i) => a + i.qty, 0);
export const bagPrice = (s: Pick<MartState, "bag">) => BAGS.find((b) => b.id === s.bag)?.price ?? 0;
export const martTotal = (s: Pick<MartState, "items" | "bag">) => goodsTotal(s) + bagPrice(s);
export const pointsEarn = (s: Pick<MartState, "items">) => Math.floor(goodsTotal(s) * 0.01);
export const qtyOf = (s: Pick<MartState, "items">, id: string) => s.items.find((i) => i.code === productById(id).code)?.qty ?? 0;

function reducer(s: MartState, a: Action): MartState {
  switch (a.t) {
    case "start":
      return { ...initial, screen: "scan" };
    case "scan": {
      const found = s.items.find((i) => i.code === a.code);
      const items = found
        ? s.items.map((i) => (i.code === a.code ? { ...i, qty: Math.min(30, i.qty + 1) } : i))
        : [...s.items, { code: a.code, qty: 1 }];
      return { ...s, items, lastCode: a.code };
    }
    case "qty":
      return {
        ...s,
        items: s.items.map((i) => (i.code === a.code ? { ...i, qty: Math.max(1, Math.min(30, i.qty + a.d)) } : i)),
        lastCode: a.code,
      };
    case "remove":
      return { ...s, items: s.items.filter((i) => i.code !== a.code), lastCode: null };
    case "clear":
      return { ...s, items: [], lastCode: null };
    case "askHome":
      return { ...s, askHome: a.v };
    case "reset":
      return initial;
    case "go":
      return { ...s, screen: a.screen, scanMember: false };
    case "bag":
      return { ...s, bag: a.id };
    case "scanMember":
      return { ...s, scanMember: a.v };
    case "member":
      return { ...s, member: { holder: a.holder, points: a.points }, scanMember: false };
    case "paid":
      return { ...s, screen: "receipt", orderNo: a.orderNo, when: a.when, receiptTaken: false };
    case "takeReceipt":
      return { ...s, receiptTaken: true };
  }
}

function toResult(s: MartState): OrderResult {
  const bag = BAGS.find((b) => b.id === s.bag);
  return {
    shop: "나인마트",
    orderNo: s.orderNo,
    when: s.when,
    total: martTotal(s),
    extra: "셀프계산대",
    lines: [
      ...s.items.map((i) => {
        const p = productByCode(i.code);
        return { name: p.name, detail: `${p.unit} · ${won(p.price)}`, qty: i.qty, amount: p.price * i.qty };
      }),
      ...(bag && bag.price ? [{ name: bag.label, qty: 1, amount: bag.price }] : []),
    ],
    notes: s.member ? [`${s.member.holder}님 포인트 ${pointsEarn(s).toLocaleString("ko-KR")}P 적립 (모두 ${(s.member.points + pointsEarn(s)).toLocaleString("ko-KR")}P)`] : undefined,
  };
}

const LOGO = <KLogo mark="9" name="나인마트" />;
const DEMO_MEMBER = PRACTICE_CARDS.find((c) => c.code === "KX-MEM-MART-0001")!;
/** 기계 아래 장바구니에 담긴 상품 (카메라가 없을 때 눌러서 찍는다) */
const TRAY = ["milk", "ramen", "apple", "egg", "water", "bread", "banana", "tofu"].map(productById);

/* ───────── 화면 ───────── */
export function MartKiosk({ onState, onComplete, onReceipt }: KioskProps<MartState>) {
  const [s, dispatch] = useReducer(reducer, initial);
  const toast = useToast((t) => t.show);
  useEffect(() => onState(s), [s, onState]);
  useProcessing(s.screen, () => dispatch({ t: "go", screen: "cardRemove" }));

  const card: CardState =
    s.screen === "cardInsert" ? "await" : s.screen === "processing" ? "inserted" : s.screen === "cardRemove" ? "eject" : "none";

  const scanProduct = (p: Product) => {
    sounds.ok();
    dispatch({ t: "scan", code: p.code });
  };
  const onTray = (p: Product) => {
    if (s.screen === "scan") scanProduct(p);
    else if (s.screen === "attract") toast("먼저 화면의 [계산 시작하기]를 눌러주세요.");
    else toast("상품은 결제하기 전에 찍어요. 더 찍으려면 화면에서 [이전]으로 돌아가세요.");
  };
  const onCardSlot = () => {
    if (s.screen === "cardInsert") {
      sounds.soft();
      dispatch({ t: "go", screen: "processing" });
    } else if (s.screen === "cardRemove") {
      sounds.soft();
      dispatch({ t: "paid", orderNo: nextOrderNo("M"), when: nowText() });
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
  const askHome = () => (s.items.length ? dispatch({ t: "askHome", v: true }) : dispatch({ t: "reset" }));

  const tray = (
    <div className="mart-tray" data-guide="tray">
      <p className="mart-tray-title">장바구니 <span>눌러서 스캐너에 대기</span></p>
      <div className="mart-tray-grid">
        {TRAY.map((p) => (
          <button key={p.id} type="button" onClick={() => onTray(p)} data-guide={`tray-${p.id}`} aria-label={`${p.name} 바코드 찍기`}>
            <ProductArt id={p.id} size={36} />
            <span>{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const summary = (
    <PaySummary
      rows={[
        { label: `상품 금액 (${itemCount(s)}개)`, amount: goodsTotal(s) },
        { label: "봉투", amount: bagPrice(s) },
      ]}
      total={martTotal(s)}
    />
  );

  return (
    <KioskDevice card={card} receiptOut={s.screen === "receipt" && !s.receiptTaken} onCardSlot={onCardSlot} onReceipt={onReceiptSlot} tray={tray}>
      <div className="kx mart">
        {s.screen === "attract" && <Attract onStart={() => dispatch({ t: "start" })} />}
        {s.screen === "scan" && <ScanScreen s={s} dispatch={dispatch} onHome={askHome} />}
        {s.screen === "bag" && <BagScreen s={s} dispatch={dispatch} summary={summary} />}
        {s.screen === "member" && <MemberScreen s={s} dispatch={dispatch} />}
        {s.screen === "payMethod" && (
          <PayMethodScreen
            logo={LOGO} step={4} summary={summary}
            onCard={() => dispatch({ t: "go", screen: "cardInsert" })}
            onCash={() => dispatch({ t: "go", screen: "cashNotice" })}
            onCancelAll={() => dispatch({ t: "askHome", v: true })}
            onPrev={() => dispatch({ t: "go", screen: "member" })}
          />
        )}
        {s.screen === "cashNotice" && (
          <CashNoticeScreen logo={LOGO} step={4} where="일반 계산대" onHome={() => dispatch({ t: "askHome", v: true })} onOther={() => dispatch({ t: "go", screen: "payMethod" })} />
        )}
        {(s.screen === "cardInsert" || s.screen === "cardError" || s.screen === "processing" || s.screen === "cardRemove") && (
          <CardPayScreen
            logo={LOGO} step={5} screen={s.screen} total={martTotal(s)}
            onCardRead={(ok) => dispatch({ t: "go", screen: ok ? "processing" : "cardError" })}
            onCardSlot={onCardSlot}
            onCancel={() => dispatch({ t: "go", screen: "payMethod" })}
            onOtherCard={() => dispatch({ t: "go", screen: "cardInsert" })}
          />
        )}
        {s.screen === "receipt" && (
          <ReceiptScreen
            logo={LOGO} step={6} numberLabel="영수증 번호" number={s.orderNo} receiptTaken={s.receiptTaken}
            remind="카드와 영수증, 구매한 상품을 꼭 챙겨주세요!"
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
              <p className="k-say">계산이 끝났어요</p>
              <p className="k-total-big">{won(martTotal(s))}</p>
              <p>구매한 상품, 카드, 영수증을<br />꼭 챙겨 가세요.</p>
              <p className="k-muted">교환·환불할 때는 영수증이 필요해요.</p>
            </div>
            <div className="k-foot">
              <button className="k-btn brand" onClick={() => dispatch({ t: "reset" })}>처음 화면으로</button>
            </div>
          </div>
        )}

        {s.askHome && (
          <div className="k-dim">
            <div className="k-dialog" role="dialog" aria-label="처음으로 돌아가기">
              <p className="k-dialog-title">계산을 처음부터 다시 할까요?</p>
              <p>지금까지 찍은 상품이 모두 지워져요.</p>
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

function Attract({ onStart }: { onStart: () => void }) {
  return (
    <div className="mart-attract">
      <div className="mart-attract-top" data-guide="attract-msg">
        {LOGO}
        <h2>셀프 계산대</h2>
        <p>상품 바코드를 직접 찍고<br />카드로 계산해요</p>
        <svg className="mart-scan-illust" width="200" height="120" viewBox="0 0 200 120" aria-hidden>
          <rect x="10" y="78" width="180" height="30" rx="8" fill="#0b5c33" />
          <rect x="60" y="20" width="80" height="58" rx="10" fill="#ffffff" />
          <path d="M70 34v30M76 34v30M80 34v30M87 34v30M93 34v30M96 34v30M103 34v30M110 34v30M114 34v30M121 34v30M126 34v30M130 34v30" stroke="#16223d" strokeWidth="2.4" />
          <path d="M40 92h120" stroke="#ff4d4d" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
      <div className="mart-attract-bottom">
        <button className="k-btn white big" onClick={onStart} data-guide="start-btn">계산 시작하기</button>
        <p className="mart-attract-note">카드 결제 전용 · 현금은 일반 계산대를 이용해 주세요</p>
      </div>
    </div>
  );
}

function ScanScreen({ s, dispatch, onHome }: { s: MartState; dispatch: D; onHome: () => void }) {
  const onCode = (x: Scanned) => {
    if (x.kind === "product" && "product" in x) dispatch({ t: "scan", code: x.product.code });
  };
  return (
    <div className="menu">
      <div className="k-head">
        {LOGO}
        <span className="k-chip">셀프계산대</span>
        <button className="k-icon-btn" onClick={onHome} data-guide="btn-home">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" />
          </svg>
          처음으로
        </button>
      </div>
      <div className="mart-scan" data-guide="scan-area">
        <p className="mart-scan-say">상품의 바코드를 스캐너에 대주세요</p>
        <BarcodeScanner compact accept={["product"]} prompt="상품 바코드를 카메라에 비춰주세요" onScan={onCode} guideId="product-scan" />
        <p className="k-muted mart-scan-alt">카메라가 없으면 기계 아래 <b>장바구니</b>의 상품을 누르세요</p>
      </div>
      <div className="mart-list" data-guide="item-list">
        {s.items.length === 0 && <p className="k-empty">아직 찍은 상품이 없어요</p>}
        {s.items.map((i) => {
          const p = productByCode(i.code);
          return (
            <div key={i.code} className={`mart-row ${s.lastCode === i.code ? "is-last" : ""}`}>
              <ProductArt id={p.id} size={34} />
              <span className="mart-row-name">
                <b>{p.name}</b>
                <small>{p.unit} · {won(p.price)}</small>
              </span>
              <span className="k-qty">
                <button aria-label={`${p.name} 하나 빼기`} onClick={() => dispatch({ t: "qty", code: i.code, d: -1 })} data-guide={`qty-minus-${p.id}`}>−</button>
                <b>{i.qty}</b>
                <button aria-label={`${p.name} 하나 더하기`} onClick={() => dispatch({ t: "qty", code: i.code, d: 1 })} data-guide={`qty-plus-${p.id}`}>+</button>
              </span>
              <span className="mart-row-amt">{won(p.price * i.qty)}</span>
              <button className="k-x" aria-label={`${p.name} 빼기`} onClick={() => dispatch({ t: "remove", code: i.code })}>×</button>
            </div>
          );
        })}
      </div>
      <div className="k-cart mart-total" data-guide="total">
        <div className="k-cart-head">
          <span>총 수량 <b>{itemCount(s)}</b>개</span>
          <span>합계 <b className="k-price">{won(goodsTotal(s))}</b></span>
        </div>
        <div className="k-row">
          <button className="k-btn ghost" disabled={!s.items.length} onClick={() => dispatch({ t: "askHome", v: true })}>
            전체 취소
          </button>
          <button className="k-btn brand" disabled={!s.items.length} onClick={() => dispatch({ t: "go", screen: "bag" })} data-guide="btn-pay">
            결제하기
          </button>
        </div>
      </div>
    </div>
  );
}

function BagScreen({ s, dispatch, summary }: { s: MartState; dispatch: D; summary: React.ReactNode }) {
  return (
    <div className="k-page">
      <StepHead logo={LOGO} step={2} title="봉투가 필요하세요?" />
      <div className="k-body">
        <div className="mart-bags" data-guide="bag-options">
          {BAGS.map((b) => (
            <button key={b.id} aria-pressed={s.bag === b.id} onClick={() => dispatch({ t: "bag", id: b.id })} data-guide={`bag-${b.id}`}>
              <b>{b.label}</b>
              <small>{b.sub}</small>
              <span className="k-price">{b.price ? won(b.price) : "0원"}</span>
            </button>
          ))}
        </div>
        <p className="k-muted">대형마트에서는 비닐봉투를 팔지 않아요. 장바구니를 챙기면 좋아요.</p>
        {summary}
      </div>
      <div className="k-foot">
        <button className="k-btn ghost" onClick={() => dispatch({ t: "go", screen: "scan" })}>이전</button>
        <button className="k-btn brand" disabled={!s.bag} onClick={() => dispatch({ t: "go", screen: "member" })} data-guide="bag-next">
          다음
        </button>
      </div>
    </div>
  );
}

function MemberScreen({ s, dispatch }: { s: MartState; dispatch: D }) {
  const earn = pointsEarn(s);
  const onScan = (x: Scanned) => {
    if (x.kind === "member" && "card" in x) dispatch({ t: "member", holder: x.card.holder ?? "회원", points: x.card.points ?? 0 });
  };
  return (
    <div className="k-page">
      <StepHead logo={LOGO} step={3} title="회원 포인트 적립" />
      <div className="k-body">
        <div className="k-pay" data-guide="member-options">
          <button aria-pressed={s.scanMember} onClick={() => dispatch({ t: "scanMember", v: !s.scanMember })} data-guide="member-open">
            <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden><rect x="4" y="10" width="40" height="28" rx="4" fill="#0f7a43" /><text x="24" y="29" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff">POINT</text></svg>
            {s.member ? "적립 완료 ✓" : "회원카드 찍기"}
          </button>
          <div className="mart-member-info">
            <b>구매 금액의 1%</b>
            <span>이번에 {earn.toLocaleString("ko-KR")}P 적립돼요</span>
          </div>
        </div>
        {s.member && (
          <p className="k-note ok">{s.member.holder}님 · {s.member.points.toLocaleString("ko-KR")}P → 결제하면 <b>{(s.member.points + earn).toLocaleString("ko-KR")}P</b></p>
        )}
        {s.scanMember && (
          <BarcodeScanner
            compact
            accept={["member"]}
            prompt="나인마트 회원카드의 바코드를 비춰주세요"
            reject={(x) => (x.kind === "member" && "card" in x && x.card.shop !== "mart" ? "나인마트 회원카드가 아니에요. 그 카드는 카페에서 써요." : null)}
            onScan={onScan}
            fallback={{ label: "카메라 없이 적립하기 (연습)", onClick: () => dispatch({ t: "member", holder: DEMO_MEMBER.holder!, points: DEMO_MEMBER.points! }) }}
          />
        )}
      </div>
      <div className="k-foot">
        <button className="k-btn ghost" onClick={() => dispatch({ t: "go", screen: "bag" })}>이전</button>
        <button className="k-btn brand" onClick={() => dispatch({ t: "go", screen: "payMethod" })} data-guide="member-next">
          {s.member ? "다음" : "적립 안 하고 다음"}
        </button>
      </div>
    </div>
  );
}

/* ───────── 혼자 해보기: [직원 호출] 도움말 ───────── */
export function martHint(s: MartState): string {
  switch (s.screen) {
    case "attract":
      return "화면의 [계산 시작하기]를 누르세요.";
    case "scan":
      if (s.askHome) return "[처음으로]를 누르면 찍은 상품이 모두 지워져요. 계속하려면 [아니요]를 누르세요.";
      if (!s.items.length) return "상품의 바코드를 카메라 네모 칸에 비추세요. 카메라가 없으면 기계 아래 장바구니의 상품을 누르세요.";
      return "목록의 이름과 가격을 확인하세요. 같은 상품은 [+]로 수량을 늘려요. 다 찍었으면 [결제하기]를 누르세요.";
    case "bag":
      return s.bag ? "[다음]을 누르세요." : "봉투가 필요하면 봉투를, 장바구니가 있으면 [필요 없어요]를 누르세요.";
    case "member":
      if (s.scanMember) return "회원카드 바코드를 카메라에 비추세요. 카메라가 없으면 파란 버튼을 누르세요.";
      return "회원카드가 있으면 [회원카드 찍기], 없으면 [적립 안 하고 다음]을 누르세요.";
    case "payMethod":
      return "카드로 결제하려면 [신용/체크카드]를 누르세요. 셀프계산대는 현금을 받지 않아요.";
    case "cashNotice":
      return "현금은 일반 계산대에서 내요. 카드로 하려면 [다른 방법으로 결제]를 누르세요.";
    case "cardInsert":
      return "화면 아래 [카드 투입구]를 눌러 카드를 꽂으세요. 체험카드가 있으면 바코드를 카메라에 비춰도 돼요.";
    case "cardError":
      return "잔액이 부족한 카드예요. [다른 카드로 결제]를 누르고 다른 카드를 쓰세요.";
    case "processing":
      return "결제 중이에요. 카드를 빼지 말고 잠시 기다리세요.";
    case "cardRemove":
      return "결제가 끝났어요. [카드 투입구]를 눌러 카드를 꼭 챙기세요.";
    case "receipt":
      return s.receiptTaken ? "영수증을 챙겼어요. [확인]을 누르세요." : "[영수증] 출구를 눌러 영수증을 챙기세요.";
    case "done":
      return "계산 끝! 구매한 상품을 챙겨 가세요.";
  }
}

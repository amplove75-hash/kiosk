// 여러 키오스크가 함께 쓰는 결제 화면들 (결제방식 → 카드 → 영수증)
import { useEffect, type ReactNode } from "react";
import { BarcodeScanner } from "../../scanner/BarcodeScanner";
import type { Scanned } from "../../scanner/codes";
import { sounds } from "../../lib/sound";
import { won } from "../../lib/format";

export type PayScreen = "cardInsert" | "cardError" | "processing" | "cardRemove";

export function KLogo({ mark, name }: { mark: string; name: string }) {
  return (
    <div className="k-logo" aria-label={name}>
      <span className="k-logo-n">{mark}</span>
      <span className="k-logo-t">{name}</span>
    </div>
  );
}

export function StepHead({ logo, step, title }: { logo: ReactNode; step: number; title: string }) {
  return (
    <div className="k-step">
      {logo}
      <p className="k-step-no">STEP {step}.</p>
      <h3 className="k-step-title">{title}</h3>
    </div>
  );
}

export function PaySummary({ rows, total }: { rows: { label: string; amount: number; discount?: boolean }[]; total: number }) {
  return (
    <dl className="k-summary">
      {rows.map((r) => (
        <div key={r.label}>
          <dt>{r.label}</dt>
          <dd className={r.discount ? "dc" : ""}>{r.discount && r.amount ? "-" : ""}{won(r.amount)}</dd>
        </div>
      ))}
      <div className="final"><dt>결제 금액</dt><dd>{won(total)}</dd></div>
    </dl>
  );
}

export function PayMethodScreen(p: {
  logo: ReactNode; step: number; summary: ReactNode;
  onCard: () => void; onCash: () => void; onCancelAll: () => void; onPrev: () => void;
}) {
  return (
    <div className="k-page">
      <StepHead logo={p.logo} step={p.step} title="결제방식을 선택해주세요" />
      <div className="k-body">
        <div className="k-pay">
          <button onClick={p.onCard} data-guide="pay-card">
            <svg width="56" height="56" viewBox="0 0 48 48" fill="none" aria-hidden>
              <rect x="4" y="10" width="40" height="28" rx="4" fill="#3a69d4" />
              <rect x="4" y="16" width="40" height="5" fill="#1f3f8f" />
              <rect x="9" y="26" width="9" height="6" rx="1.5" fill="#f3d77b" />
            </svg>
            신용/체크카드
          </button>
          <button onClick={p.onCash} data-guide="pay-cash">
            <svg width="56" height="56" viewBox="0 0 48 48" fill="none" aria-hidden>
              <rect x="4" y="12" width="40" height="24" rx="3" fill="#5aa469" />
              <circle cx="24" cy="24" r="7" fill="#d9f0dd" />
              <text x="24" y="28" textAnchor="middle" fontSize="10" fontWeight="900" fill="#2f6b3b">₩</text>
            </svg>
            현금
          </button>
        </div>
        {p.summary}
      </div>
      <div className="k-foot">
        <button className="k-btn ghost" onClick={p.onCancelAll}>전체취소</button>
        <button className="k-btn ghost" onClick={p.onPrev}>이전</button>
      </div>
    </div>
  );
}

export function CashNoticeScreen(p: { logo: ReactNode; step: number; where?: string; onHome: () => void; onOther: () => void }) {
  return (
    <div className="k-page">
      <StepHead logo={p.logo} step={p.step} title="현금 결제 안내" />
      <div className="k-body center">
        <div className="k-notice">
          <p className="k-notice-big">이 키오스크는 현금을 받지 않아요</p>
          <p>현금으로 결제하시려면 <b>{p.where ?? "카운터"}</b>에서 계산해 주세요.</p>
          <p className="k-muted">키오스크는 카드나 모바일 결제만 되는 곳이 많아요.</p>
        </div>
      </div>
      <div className="k-foot">
        <button className="k-btn ghost" onClick={p.onHome}>처음으로</button>
        <button className="k-btn brand" onClick={p.onOther} data-guide="btn-other-pay">다른 방법으로 결제</button>
      </div>
    </div>
  );
}

/** 결제 처리 중 → 잠시 뒤 "카드를 뽑아주세요" */
export function useProcessing(screen: string, done: () => void) {
  useEffect(() => {
    if (screen !== "processing") return;
    const t = setTimeout(() => {
      sounds.ok();
      done();
    }, 2400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);
}

export function CardPayScreen(p: {
  logo: ReactNode; step: number; screen: PayScreen; total: number;
  /** 카메라로 체험카드를 읽었을 때: 잔액이 충분하면 true */
  onCardRead: (enough: boolean) => void;
  onCardSlot: () => void; onCancel: () => void; onOtherCard: () => void;
}) {
  const onScan = (x: Scanned) => {
    if (x.kind !== "card" || !("card" in x)) return;
    p.onCardRead((x.card.balance ?? 0) >= p.total);
  };
  const s = p.screen;
  return (
    <div className="k-page">
      <StepHead logo={p.logo} step={p.step} title={s === "cardRemove" ? "결제가 완료되었습니다" : "카드 결제"} />
      <div className="k-body center" data-guide="screen-msg">
        {s === "cardInsert" && (
          <>
            <CardIllust />
            <p className="k-say">화면 아래 <b>카드 투입구</b>에<br />IC카드를 꽂아주세요</p>
            <p className="k-muted">결제 금액 <b className="k-price">{won(p.total)}</b></p>
            <div className="k-or"><span>또는 체험카드를 카메라에</span></div>
            <BarcodeScanner compact accept={["card"]} prompt="체험 신용카드의 바코드를 비춰주세요" onScan={onScan} guideId="card-scan" />
            <button className="k-link" onClick={p.onCardSlot}>화면에서 카드 꽂기 (연습)</button>
          </>
        )}
        {s === "cardError" && (
          <>
            <svg width="72" height="72" viewBox="0 0 48 48" aria-hidden>
              <circle cx="24" cy="24" r="22" fill="#d3261e" />
              <path d="M24 12v15" stroke="#fff" strokeWidth="5" strokeLinecap="round" /><circle cx="24" cy="35" r="3" fill="#fff" />
            </svg>
            <p className="k-say"><b>잔액이 부족합니다</b></p>
            <p>이 카드로는 결제할 수 없어요.<br />다른 카드로 결제해 주세요.</p>
            <p className="k-muted">당황하지 마세요. 키오스크에서는 이런 안내가 자주 나와요.</p>
            <div className="k-row" style={{ width: "100%" }}>
              <button className="k-btn ghost" onClick={p.onCancel}>결제방식 다시 고르기</button>
              <button className="k-btn brand" onClick={p.onOtherCard} data-guide="btn-other-card">다른 카드로 결제</button>
            </div>
          </>
        )}
        {s === "processing" && (
          <>
            <span className="k-spinner" aria-hidden />
            <p className="k-say">결제 중입니다</p>
            <p className="k-warn">카드를 빼지 마세요!</p>
          </>
        )}
        {s === "cardRemove" && (
          <>
            <svg width="72" height="72" viewBox="0 0 48 48" aria-hidden>
              <circle cx="24" cy="24" r="22" fill="#1b8754" />
              <path d="M14 25l7 7 13-15" stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="k-say"><b>카드를 뽑아주세요</b></p>
            <p className="k-muted">카드를 두고 가지 않도록 꼭 챙기세요.</p>
            <button className="k-link" onClick={p.onCardSlot}>화면에서 카드 뽑기 (연습)</button>
          </>
        )}
      </div>
      <div className="k-foot">
        {s === "cardInsert" || s === "cardError" ? (
          <button className="k-btn ghost" onClick={p.onCancel}>취소</button>
        ) : (
          <span className="k-muted">잠시만 기다려 주세요</span>
        )}
      </div>
    </div>
  );
}

function CardIllust() {
  return (
    <svg width="150" height="106" viewBox="0 0 170 120" aria-hidden className="k-card-illust">
      <rect x="20" y="92" width="130" height="16" rx="6" fill="#2a2e37" />
      <rect x="35" y="98" width="100" height="4" rx="2" fill="#0d0f13" />
      <g className="k-card-move">
        <rect x="50" y="8" width="70" height="86" rx="8" fill="#3a69d4" />
        <rect x="60" y="66" width="18" height="14" rx="3" fill="#f3d77b" />
        <text x="85" y="34" fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle">연습용</text>
      </g>
    </svg>
  );
}

export function ReceiptScreen(p: {
  logo: ReactNode; step: number; numberLabel: string; number: string; receiptTaken: boolean;
  remind: string; onOk: () => void;
}) {
  return (
    <div className="k-page">
      <StepHead logo={p.logo} step={p.step} title="결제 완료" />
      <div className="k-body center">
        <p className="k-say">영수증이 출력되었습니다</p>
        <div className="k-orderno">
          <span>{p.numberLabel}</span>
          <b>{p.number}</b>
        </div>
        <p className="k-warn">{p.remind}</p>
        {!p.receiptTaken ? (
          <p className="k-muted">↓ 화면 아래 영수증 출구에서 영수증을 챙겨주세요</p>
        ) : (
          <p className="k-ok">영수증을 챙겼어요 ✓</p>
        )}
      </div>
      <div className="k-foot">
        <button className="k-btn brand" disabled={!p.receiptTaken} onClick={p.onOk} data-guide="btn-receipt-ok">
          확인
        </button>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

export type CardState = "none" | "await" | "inserted" | "eject";

/**
 * 실물 키오스크 기계 모양.
 * 화면 아래에 카드 투입구와 영수증 출구가 있어서, 손으로 카드를 꽂고 영수증을 챙기는 동작까지 연습한다.
 */
export function KioskDevice(props: {
  children: ReactNode;
  card: CardState;
  receiptOut: boolean;
  onCardSlot: () => void;
  onReceipt: () => void;
}) {
  const { card, receiptOut } = props;
  return (
    <div className="kdevice">
      <div className="kd-top" aria-hidden>
        <span className="kd-cam" />
      </div>
      <div className="kscreen" data-guide="screen">
        {props.children}
      </div>
      <div className="kd-lower">
        <button
          type="button"
          className={`kd-slot kd-card is-${card}`}
          data-guide="card-slot"
          onClick={props.onCardSlot}
          aria-label={
            card === "await" ? "카드 투입구: 눌러서 카드 꽂기" : card === "eject" ? "카드 투입구: 눌러서 카드 뽑기" : "카드 투입구"
          }
        >
          <span className="kd-label">카드 투입구</span>
          <span className="kd-light" aria-hidden />
          <span className="kd-mouth" aria-hidden>
            <span className="kd-plastic">
              <span className="chip" />
              <span className="txt">연습용 카드</span>
            </span>
          </span>
          {card === "await" && <span className="kd-call">여기를 눌러 카드 꽂기</span>}
          {card === "eject" && <span className="kd-call">카드를 뽑아주세요</span>}
        </button>
        <button
          type="button"
          className={`kd-slot kd-printer ${receiptOut ? "is-out" : ""}`}
          data-guide="receipt-slot"
          onClick={props.onReceipt}
          aria-label={receiptOut ? "영수증 출구: 눌러서 영수증 챙기기" : "영수증 출구"}
        >
          <span className="kd-label">영수증</span>
          <span className="kd-mouth" aria-hidden>
            <span className="kd-paper">
              <i /><i /><i /><i />
            </span>
          </span>
          {receiptOut && <span className="kd-call">영수증을 챙기세요</span>}
        </button>
      </div>
    </div>
  );
}

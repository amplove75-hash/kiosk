import { useState } from "react";
import { PRACTICE_CARDS, PRODUCTS, type PracticeCard, type Product } from "../data/practiceCards";
import { Barcode } from "../components/Barcode";
import { won } from "../lib/format";

type Big = { title: string; sub: string; code: string; format: "CODE128" | "EAN13" | "QR" } | null;

export function PrintPage() {
  const [big, setBig] = useState<Big>(null);
  return (
    <main className="wrap section print-page">
      <div className="no-print print-intro">
        <h1>연습용 카드 인쇄</h1>
        <p>A4 종이에 인쇄해서 선을 따라 잘라 쓰세요. 키오스크 화면에서 카드 바코드를 카메라에 비추면 결제·적립이 돼요.</p>
        <p>인쇄가 어렵다면 카드를 눌러 크게 띄운 뒤, <b>휴대폰 화면을 카메라에 비춰도</b> 돼요.</p>
        <div className="row-btns">
          <button className="btn primary" onClick={() => { try { window.print(); } catch { /* noop */ } }}>인쇄하기</button>
        </div>
        <p className="muted-note">모든 카드는 연습용이에요. 실제 카드번호나 개인정보는 들어 있지 않아요.</p>
      </div>

      <h2 className="print-h">카드 · 회원권 · 티켓</h2>
      <div className="pcards">
        {PRACTICE_CARDS.map((c) => (
          <CardTile key={c.code} c={c} onOpen={() => setBig({ title: c.title, sub: c.sub, code: c.code, format: c.format })} />
        ))}
      </div>

      <h2 className="print-h page-break">마트 상품 바코드</h2>
      <div className="pproducts">
        {PRODUCTS.map((p) => (
          <ProductTile key={p.code} p={p} onOpen={() => setBig({ title: p.name, sub: `${p.unit} · ${won(p.price)}`, code: p.code, format: "EAN13" })} />
        ))}
      </div>

      {big && (
        <div className="modal-back no-print" onClick={() => setBig(null)}>
          <div className="modal big-code" role="dialog" aria-label={`${big.title} 크게 보기`} onClick={(e) => e.stopPropagation()}>
            <h2>{big.title}</h2>
            <p>{big.sub}</p>
            <div className="big-code-box"><Barcode value={big.code} format={big.format} big /></div>
            <p className="muted-note">화면 밝기를 최대로 하고, 카메라에서 한 뼘 정도 떨어뜨려 비춰주세요.</p>
            <button className="btn primary" onClick={() => setBig(null)}>닫기</button>
          </div>
        </div>
      )}
    </main>
  );
}

function CardTile({ c, onOpen }: { c: PracticeCard; onOpen: () => void }) {
  return (
    <button type="button" className="pcard" onClick={onOpen} aria-label={`${c.title} 크게 보기`}>
      <span className="pcard-band" style={{ background: c.band }} />
      <span className="pcard-head">
        <b>{c.title}</b>
        <small>{c.sub}{c.holder ? ` · ${c.holder}` : ""}</small>
      </span>
      <span className={`pcard-code ${c.format === "QR" ? "is-qr" : ""}`}>
        <Barcode value={c.code} format={c.format} height={44} />
      </span>
      <span className="pcard-foot">
        <span>{c.code}</span>
        <span className="wm">연습용 · 실제 사용 불가</span>
      </span>
    </button>
  );
}

function ProductTile({ p, onOpen }: { p: Product; onOpen: () => void }) {
  return (
    <button type="button" className="pprod" onClick={onOpen} aria-label={`${p.name} 바코드 크게 보기`}>
      <span className="pprod-pic" style={{ background: p.color }}>{p.name.slice(0, 2)}</span>
      <span className="pprod-name"><b>{p.name}</b><small>{p.unit} · {won(p.price)}</small></span>
      <Barcode value={p.code} format="EAN13" height={40} />
    </button>
  );
}

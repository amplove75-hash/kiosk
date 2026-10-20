import { useState } from "react";
import { NavLink } from "react-router-dom";
import { PRACTICE_CARDS, PRODUCTS, type PracticeCard, type Product } from "../data/practiceCards";
import { Barcode } from "../components/Barcode";
import { ProductArt } from "../kiosks/mart/ProductArt";
import { won } from "../lib/format";

type Big = { title: string; sub: string; code: string; format: "CODE128" | "EAN13" | "QR"; productId?: string } | null;
export type PrintSection = "all" | "cards" | "products";

export function PrintPage({ section = "all" }: { section?: PrintSection }) {
  const [big, setBig] = useState<Big>(null);
  const [copies, setCopies] = useState<1 | 2>(1);
  const showCards = section !== "products";
  const showProducts = section !== "cards";
  const products = copies === 2 ? PRODUCTS.flatMap((p) => [p, p]) : PRODUCTS;

  return (
    <main className={`wrap section print-page is-${section}`}>
      <div className="no-print print-intro">
        <h1>{section === "products" ? "마트 상품 바코드 인쇄" : section === "cards" ? "연습용 카드 인쇄" : "연습용 카드·바코드 인쇄"}</h1>
        <nav className="print-tabs" aria-label="인쇄할 종류">
          <NavLink to="/print" end>전체</NavLink>
          <NavLink to="/print/cards">카드·회원권</NavLink>
          <NavLink to="/print/products">마트 상품</NavLink>
        </nav>
        {section === "products" ? (
          <>
            <p>마트 셀프계산대 연습용 상품 라벨 12종이에요. A4 한 장에 인쇄해서 잘라 쓰세요.</p>
            <p>라벨을 빈 상자나 우유갑 같은 <b>실제 물건에 붙이면</b> 진짜 장보기처럼 하나씩 집어서 카메라에 찍어볼 수 있어요.</p>
          </>
        ) : (
          <>
            <p>A4 종이에 인쇄해서 선을 따라 잘라 쓰세요. 키오스크 화면에서 바코드를 카메라에 비추면 결제·적립·상품 담기가 돼요.</p>
          </>
        )}
        <p>인쇄가 어렵다면 라벨을 눌러 크게 띄운 뒤, <b>휴대폰 화면을 카메라에 비춰도</b> 돼요.</p>
        <div className="row-btns">
          <button className="btn primary" onClick={() => { try { window.print(); } catch { /* noop */ } }}>인쇄하기</button>
          {showProducts && (
            <div className="seg" role="group" aria-label="상품 라벨 장수">
              <button aria-pressed={copies === 1} onClick={() => setCopies(1)}>상품마다 1장</button>
              <button aria-pressed={copies === 2} onClick={() => setCopies(2)}>상품마다 2장</button>
            </div>
          )}
        </div>
        <p className="muted-note">모든 바코드는 연습용이에요. 상품 바코드는 실제 판매 상품과 겹치지 않는 매장 내부용 번호(2로 시작)만 써요.</p>
      </div>

      {showCards && (
        <>
          <h2 className="print-h">카드 · 회원권 · 티켓</h2>
          <div className="pcards">
            {PRACTICE_CARDS.map((c) => (
              <CardTile key={c.code} c={c} onOpen={() => setBig({ title: c.title, sub: c.sub, code: c.code, format: c.format })} />
            ))}
          </div>
        </>
      )}

      {showProducts && (
        <>
          <h2 className={`print-h ${showCards ? "page-break" : ""}`}>나인마트 상품 바코드</h2>
          <div className="pproducts">
            {products.map((p, i) => (
              <ProductTile
                key={`${p.code}-${i}`}
                p={p}
                onOpen={() => setBig({ title: p.name, sub: `${p.unit} · ${won(p.price)}`, code: p.code, format: "EAN13", productId: p.id })}
              />
            ))}
          </div>
        </>
      )}

      {big && (
        <div className="modal-back no-print" onClick={() => setBig(null)}>
          <div className="modal big-code" role="dialog" aria-label={`${big.title} 크게 보기`} onClick={(e) => e.stopPropagation()}>
            {big.productId && <ProductArt id={big.productId} size={72} />}
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
      <span className="pprod-top">
        <span className="pprod-pic" style={{ background: p.color }}><ProductArt id={p.id} size={42} /></span>
        <span className="pprod-name">
          <small className="pprod-shop">나인마트</small>
          <b>{p.name}</b>
          <span className="pprod-price">{won(p.price)} <small>/ {p.unit}</small></span>
        </span>
      </span>
      <span className="pprod-code"><Barcode value={p.code} format="EAN13" height={48} /></span>
      <span className="pprod-wm">연습용 상품 라벨</span>
    </button>
  );
}

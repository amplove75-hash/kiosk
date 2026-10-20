import { Link } from "react-router-dom";
import { GROUPS, KIOSKS } from "../kiosks/registry";
import { Icon } from "../components/Icons";
import { getProgress } from "../settings";

export const RULES = [
  { t: "손가락 바닥으로 눌러요", d: "손톱이 아니라 손가락 바닥으로 눌러야 잘 인식돼요." },
  { t: "한 개씩, 천천히", d: "버튼은 하나씩 천천히 눌러요. 안 눌리면 2~3초 길게 눌러보세요." },
  { t: "카드와 영수증 챙기기", d: "영수증의 주문번호는 상품을 받을 때 필요해요. 버리지 말고 챙겨요." },
  { t: "차례를 지켜요", d: "한 줄로 서서 기다리고, 세게 두드리거나 흔들지 않아요. 모르면 직원을 불러요." },
];

export function Home() {
  const progress = getProgress();
  return (
    <main>
      <section className="wrap hero">
        <p className="eyebrow">디지털 전환 교육 · 키오스크 연습장</p>
        <h1>키오스크야!<br />내 주문을 받아줘!</h1>
        <p>화면을 직접 눌러 주문하고, 카드를 꽂고, 영수증까지 챙겨 보세요. 여기서는 틀려도 괜찮아요. 연습이니까요.</p>
        <div><Link className="btn primary" to="/kiosk/cafe">카페 키오스크부터 시작하기</Link></div>
      </section>

      <section className="wrap section" aria-labelledby="places">
        <h2 id="places">어디서 연습할까요?</h2>
        <div className="kiosk-grid">
          {KIOSKS.map((k) => {
            const I = Icon[k.icon];
            const p = progress[k.id];
            const done = (p?.guide ?? 0) + (p?.practice ?? 0) > 0;
            const inner = (
              <>
                <span className="icon"><I /></span>
                <span className="txt">
                  <span className="group">{GROUPS.find((g) => g.id === k.group)?.title}</span>
                  <span className="name">{k.place}</span>
                  <span className="meta">{k.summary}</span>
                </span>
                {k.status === "ready" ? (
                  <span className={`badge ${done ? "done" : "go"}`}>{done ? "완주했어요 ✓ 다시 연습하기" : "연습하러 가기 →"}</span>
                ) : (
                  <span className="badge soon">준비 중이에요</span>
                )}
              </>
            );
            return k.status === "ready" ? (
              <Link key={k.id} to={`/kiosk/${k.id}`} className="place">{inner}</Link>
            ) : (
              <div key={k.id} className="place is-soon" aria-disabled>{inner}</div>
            );
          })}
        </div>
      </section>

      <section className="wrap section" aria-labelledby="prep">
        <h2 id="prep">수업 준비</h2>
        <div className="kiosk-grid">
          <Link to="/print/cards" className="place">
            <span className="icon">
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><rect x="4" y="8" width="24" height="16" rx="3" /><path d="M9 13v6M12 13v6M15 13v6M19 13v6M22 13v6" /></svg>
            </span>
            <span className="txt"><span className="name">연습용 카드 인쇄</span><span className="meta">체험 신용카드, 멤버십, 쿠폰, 주차권을 A4로 뽑아요</span></span>
          </Link>
          <Link to="/print/products" className="place">
            <span className="icon">
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M3 5h4l3 14h14l3-10H9" /><circle cx="12" cy="25" r="2" /><circle cx="22" cy="25" r="2" /></svg>
            </span>
            <span className="txt"><span className="name">마트 상품 바코드 인쇄</span><span className="meta">우유·라면·사과 등 12종 상품 라벨을 뽑아 셀프계산대에서 찍어요</span></span>
          </Link>
          <Link to="/camera-test" className="place">
            <span className="icon">
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M5 10h5l2-4h8l2 4h5v15H5z" /><circle cx="16" cy="17" r="4.5" /></svg>
            </span>
            <span className="txt"><span className="name">카메라 점검</span><span className="meta">수업 전에 카메라로 카드가 잘 읽히는지 확인해요</span></span>
          </Link>
        </div>
      </section>

      <section className="wrap section" aria-labelledby="rules">
        <h2 id="rules">키오스크 쓸 때 기억해요</h2>
        <div className="rules">
          {RULES.map((r) => (
            <div className="rule" key={r.t}>
              <strong>{r.t}</strong>
              <span>{r.d}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

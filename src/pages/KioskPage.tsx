import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import { KIOSKS } from "../kiosks/registry";
import type { Mode, OrderResult } from "../engine/types";
import { GuideOverlay } from "../engine/GuideOverlay";
import { useToast } from "../components/Toast";
import { useSettings, addProgress } from "../settings";
import { speak, stopSpeaking } from "../lib/speech";
import { sounds } from "../lib/sound";
import { won } from "../lib/format";
import { RULES } from "./Home";
import { Icon } from "../components/Icons";

/** 만들어진 키오스크로 바로 옮겨 가는 줄 */
function KioskSwitcher({ current }: { current: string }) {
  const ref = useRef<HTMLElement>(null);
  // 휴대폰처럼 좁은 화면에서도 지금 키오스크가 보이도록 가로로 밀어 둔다
  useEffect(() => {
    const nav = ref.current;
    const cur = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && cur) nav.scrollLeft = cur.offsetLeft - nav.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2;
  }, [current]);
  return (
    <nav className="kiosk-switch" aria-label="다른 키오스크로 가기" ref={ref}>
      {KIOSKS.filter((k) => k.status === "ready").map((k) => {
        const I = Icon[k.icon];
        return (
          <NavLink key={k.id} to={`/kiosk/${k.id}`} className="kiosk-switch-item" aria-current={k.id === current ? "page" : undefined}>
            <I size={24} />
            <span>{k.place}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export function KioskPage() {
  const { id } = useParams();
  const def = KIOSKS.find((k) => k.id === id);
  const voice = useSettings((s) => s.voice);
  const toast = useToast((t) => t.show);

  const [mode, setMode] = useState<Mode>("practice");
  const [run, setRun] = useState(0);
  const [kState, setKState] = useState<any>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [receipt, setReceipt] = useState<OrderResult | null>(null);
  const [help, setHelp] = useState(false);
  const deviceRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef<{ el: Element | null; t: number }>({ el: null, t: 0 });

  const guide = mode === "guide" ? def?.guide : undefined;
  const detour = mode === "guide" && kState && def?.guideDetour ? def.guideDetour(kState) : null;
  const step = guide && stepIdx < guide.length && !detour ? guide[stepIdx] : undefined;

  const restart = useCallback((m: Mode = mode) => {
    stopSpeaking();
    setMode(m);
    setRun((r) => r + 1);
    setKState(null);
    setStepIdx(0);
    setResult(null);
    setReceipt(null);
  }, [mode]);

  // 키오스크 상태가 바뀌면, 조건을 만족한 단계는 건너뛴다
  useEffect(() => {
    if (!guide || !kState) return;
    let i = stepIdx;
    while (i < guide.length && guide[i].until && guide[i].until!(kState)) i++;
    if (i !== stepIdx) setStepIdx(i);
  }, [kState, stepIdx, guide]);

  // 단계 설명 읽어주기
  useEffect(() => {
    if (step && voice) speak(step.text);
  }, [step, voice]);
  useEffect(() => {
    if (detour && voice) speak(detour);
  }, [detour, voice]);

  const onComplete = useCallback(
    (r: OrderResult) => {
      setResult(r);
      if (def) addProgress(def.id, mode);
      sounds.ok();
      if (voice) speak("잘하셨어요! 주문을 끝까지 마쳤어요.");
    },
    [def, mode, voice],
  );

  // 따라하기: 주황 상자 밖 터치를 막는다 / 공통: 같은 버튼 연타를 막는다
  const onClickCapture = (e: MouseEvent) => {
    const target = e.target as Element;
    const block = (msg: string) => {
      e.preventDefault();
      e.stopPropagation();
      sounds.warn();
      toast(msg);
    };
    if (step) {
      if (step.info) return block("오른쪽 설명을 읽고 [다음]을 눌러주세요.");
      const el = deviceRef.current?.querySelector(`[data-guide="${step.target}"]`);
      if (!el || !el.contains(target)) return block("주황색 상자 안을 눌러주세요.");
    }
    const btn = target.closest("button");
    if (btn) {
      const now = Date.now();
      if (lastTap.current.el === btn && now - lastTap.current.t < 450) {
        return block("버튼은 한 번만, 천천히 눌러주세요.");
      }
      lastTap.current = { el: btn, t: now };
    }
  };

  if (!def || def.status !== "ready" || !def.Component) {
    return (
      <main className="wrap section">
        <h1>아직 준비 중인 키오스크예요</h1>
        <p>곧 연습할 수 있게 만들고 있어요.</p>
        <p><Link className="btn primary" to="/">처음 화면으로</Link></p>
      </main>
    );
  }
  const K = def.Component;
  const total = guide?.length ?? 0;

  return (
    <main className={`wrap practice ${def.layout === "wide" ? "is-wide" : ""}`}>
      <KioskSwitcher current={def.id} />
      <div className="practice-head">
        <h1>{def.place} 키오스크</h1>
        <div className="modes" role="group" aria-label="연습 방법">
          <button aria-pressed={mode === "practice"} onClick={() => restart("practice")}>혼자 해보기</button>
          <button aria-pressed={mode === "guide"} onClick={() => restart("guide")}>따라하기</button>
          <button disabled title="다음 업데이트에서 열려요">미션 (준비 중)</button>
        </div>
      </div>

      <div className="guide-area">
        {mode === "guide" && !result && detour && (
          <div className="panel bubble" aria-live="polite">
            <p className="step-no">따라하기 · 잠깐!</p>
            <p className="say">{detour}</p>
          </div>
        )}
        {mode === "guide" && !result && step && (
          <div className="panel bubble" aria-live="polite">
            <p className="step-no">따라하기 · {def.guideTitle} · {stepIdx + 1} / {total}</p>
            <p className="say">{step.text}</p>
            <div className="progress-dots" aria-hidden>
              {guide!.map((_, i) => <i key={i} className={i <= stepIdx ? "on" : ""} />)}
            </div>
            <div className="row">
              {step.info && (
                <button className="btn primary" onClick={() => setStepIdx((i) => i + 1)}>다음 ▶</button>
              )}
              {voice ? (
                <button className="btn" onClick={() => speak(step.text)}>다시 듣기</button>
              ) : null}
              <button className="btn" onClick={() => restart()}>처음부터 다시</button>
            </div>
          </div>
        )}

        {mode === "practice" && !result && (
          <div className="panel">
            <h2>혼자 해보기</h2>
            <p>안내 없이 자유롭게 주문해 보세요. 실제 키오스크처럼 내가 직접 고르고 결제해요.</p>
            <p>막히면 언제든 <b>직원 호출</b>을 누르세요.</p>
            <p className="muted-note">처음이라 어렵다면 위의 <b>따라하기</b>를 누르면 한 단계씩 알려드려요.</p>
            <div className="bubble-row" style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              <button className="help-btn" onClick={() => { setHelp(true); if (voice && def.hint && kState) speak(def.hint(kState)); }}>
                직원 호출
              </button>
              <button className="btn" onClick={() => restart()}>처음부터 다시</button>
            </div>
          </div>
        )}

        {result && (
          <div className="panel success" aria-live="polite">
            <p className="big">잘하셨어요!</p>
            <p>
              {mode === "guide" ? "따라하기를 끝까지 마쳤어요." : "혼자서 주문을 끝까지 마쳤어요."} 주문번호는{" "}
              <b>{result.orderNo}</b>, 결제 금액은 <b>{won(result.total)}</b>이에요.
            </p>
            <div className="row" style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              {mode === "guide" ? (
                <button className="btn primary" onClick={() => restart("practice")}>이제 혼자 해보기</button>
              ) : (
                <button className="btn primary" onClick={() => restart("practice")}>한 번 더 해보기</button>
              )}
              <Link className="btn" to="/">다른 키오스크 고르기</Link>
            </div>
          </div>
        )}
      </div>

      <div className="device-area">
        <div className="device-wrap" ref={deviceRef} onClickCapture={onClickCapture} data-guide-step={step?.target ?? ""}>
          <K key={`${mode}-${run}`} onState={setKState} onComplete={onComplete} onReceipt={setReceipt} />
          {step && <GuideOverlay container={deviceRef} target={step.target} />}
        </div>
      </div>

      <div className="side-area">
        {def.printables && (
          <div className="panel">
            <h2>카메라로 연습하려면</h2>
            <p className="muted-note">인쇄한 바코드를 카메라에 비추면 진짜처럼 찍혀요. 카메라가 없어도 화면만으로 끝까지 할 수 있어요.</p>
            <div className="print-links">
              {def.printables.map((p) => (
                <Link key={p.to} to={p.to} className="print-link">
                  <b>{p.label}</b>
                  <span>{p.note}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        {receipt && (
          <div className="panel">
            <h2>{receipt.payment ? "주문 내역서" : "내가 챙긴 영수증"}</h2>
            <div className="receipt-paper" aria-label="영수증">
              <div style={{ textAlign: "center", fontWeight: 900 }}>{receipt.shop}</div>
              <div style={{ textAlign: "center" }}>{receipt.when} · {receipt.extra}</div>
              <hr />
              <div style={{ textAlign: "center" }}>{receipt.numberLabel ?? "주문번호"}</div>
              <div className="order-no">{receipt.orderNo}</div>
              <hr />
              {receipt.lines.map((l, i) => (
                <div key={i}>
                  <div className="r-row"><span>{l.name} x{l.qty}</span><span>{won(l.amount)}</span></div>
                  {l.detail && <div style={{ fontSize: "0.8rem", color: "#555" }}>  {l.detail}</div>}
                </div>
              ))}
              <hr />
              <div className="r-row" style={{ fontWeight: 900 }}><span>합계</span><span>{won(receipt.total)}</span></div>
              <div className="r-row"><span>결제</span><span>{receipt.payment ?? "신용카드(연습용)"}</span></div>
              {receipt.notes?.map((n) => <div key={n} style={{ fontSize: "0.85rem" }}>{n}</div>)}
              <hr />
              <div style={{ textAlign: "center", fontSize: "0.8rem" }}>연습용 영수증 · 실제 결제 아님</div>
            </div>
            <p>{receipt.payment ? "카운터에서 테이블 번호를 말하고 계산해요." : <>영수증의 <b>번호</b>는 상품을 받거나 교환할 때 필요해요.</>}</p>
          </div>
        )}
        <div className="panel">
          <h2>키오스크 쓸 때 기억해요</h2>
          <ul className="tip-list">
            {RULES.map((r, i) => (
              <li key={r.t}><span className="n">{i + 1}</span><span><b>{r.t}</b><br />{r.d}</span></li>
            ))}
          </ul>
        </div>
      </div>

      {help && (
        <div className="modal-back" onClick={() => setHelp(false)}>
          <div className="modal" role="dialog" aria-label="직원 도움말" onClick={(e) => e.stopPropagation()}>
            <h2>직원이 도와드릴게요</h2>
            <p className="hint">{def.hint && kState ? def.hint(kState) : "화면 아래 버튼부터 천천히 눌러보세요."}</p>
            <p>터치가 잘 안 되면 손가락 바닥으로 2~3초 길게 눌러보세요.</p>
            <button className="btn primary" onClick={() => setHelp(false)}>알겠어요</button>
          </div>
        </div>
      )}
    </main>
  );
}

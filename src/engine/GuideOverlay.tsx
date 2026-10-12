import { useEffect, useRef, useState, type RefObject } from "react";

type Box = { x: number; y: number; w: number; h: number; cw: number; ch: number };

/** container 안에서 [data-guide=target] 요소를 찾아 주황 상자와 손가락으로 강조한다. */
export function GuideOverlay({ container, target }: { container: RefObject<HTMLElement>; target: string | null }) {
  const [box, setBox] = useState<Box | null>(null);
  const last = useRef("");

  // 단계가 바뀌면 대상이 보이도록 스크롤
  useEffect(() => {
    if (!target) return;
    const t = setTimeout(() => {
      const el = container.current?.querySelector<HTMLElement>(`[data-guide="${target}"]`);
      el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }, 120);
    return () => clearTimeout(t);
  }, [target, container]);

  useEffect(() => {
    if (!target) {
      setBox(null);
      return;
    }
    let raf = 0;
    const tick = () => {
      const root = container.current;
      const el = root?.querySelector<HTMLElement>(`[data-guide="${target}"]`);
      if (root && el) {
        const r = root.getBoundingClientRect();
        const e = el.getBoundingClientRect();
        const b = { x: e.left - r.left, y: e.top - r.top, w: e.width, h: e.height, cw: r.width, ch: r.height };
        const key = [b.x, b.y, b.w, b.h, b.cw].map(Math.round).join(",");
        if (key !== last.current) {
          last.current = key;
          setBox(b);
        }
      } else if (last.current !== "none") {
        last.current = "none";
        setBox(null);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, container]);

  if (!box) return null;
  const pad = 6;
  const x = box.x - pad, y = box.y - pad, w = box.w + pad * 2, h = box.h + pad * 2;
  // 손가락은 상자 오른쪽 아래. 화면 밖으로 나가면 안쪽으로 당긴다.
  const fx = Math.min(x + w - 22, box.cw - 58);
  const fy = Math.min(y + h - 18, box.ch - 58);
  const tagAbove = y > 34;
  const tx = Math.max(6, Math.min(x, box.cw - 90));
  const ty = tagAbove ? y - 32 : y + h + 6;
  return (
    <div className="guide-layer" aria-hidden>
      <div className="guide-box" style={{ left: x, top: y, width: w, height: h }} />
      <div className="guide-tag" style={{ left: tx, top: ty }}>여기를 보세요</div>
      <svg className="guide-finger" style={{ left: fx, top: fy }} viewBox="0 0 64 64">
        <path
          d="M22 30V10a5 5 0 0 1 10 0v16l3-1a5 5 0 0 1 6 3l1 1 2-.5a5 5 0 0 1 6 3.5l.5.5 1.5-.3a5 5 0 0 1 6 4.8V48c0 8-6 14-14 14H34c-5 0-9-2-12-6L10 42a5 5 0 0 1 7-7l5 4z"
          fill="#fff"
          stroke="#16223d"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

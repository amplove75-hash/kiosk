import type { Art, Temp } from "./menu";

/** 음료·디저트 그림. 사진 대신 간단한 그림으로 그린다(저작권 걱정 없음). */
export function DrinkArt({ art, temp, size = 84 }: { art: Art; temp?: Temp; size?: number }) {
  if (art.kind === "cake")
    return (
      <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden>
        <ellipse cx="40" cy="66" rx="30" ry="5" fill="#e9e5dc" />
        <path d="M12 44 L64 30 L68 60 L14 64 Z" fill="#f6dc8e" stroke="#c9a24a" strokeWidth="2" />
        <path d="M12 44 L64 30 L66 38 L13 50 Z" fill="#fff7dd" />
        <path d="M14 60 L68 56 L68 60 L14 64 Z" fill="#a46b3c" />
      </svg>
    );
  if (art.kind === "cookie")
    return (
      <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden>
        <circle cx="40" cy="42" r="24" fill="#c98c4a" stroke="#9a6431" strokeWidth="2" />
        {[[30, 34], [46, 30], [50, 48], [34, 52], [40, 42]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.6" fill="#4a2a17" />
        ))}
      </svg>
    );
  if (art.kind === "croffle")
    return (
      <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden>
        <path d="M14 50 Q20 26 40 24 Q60 26 66 50 Q40 60 14 50Z" fill="#e3a857" stroke="#b07a2e" strokeWidth="2" />
        <path d="M24 36 L56 48 M30 30 L62 42 M20 44 L48 54 M34 28 L22 50 M46 28 L34 54 M58 34 L48 54" stroke="#b07a2e" strokeWidth="1.6" />
        <path d="M26 30 l3 -3 M50 28 l3 -2" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );

  if (art.kind !== "drink") return null;
  const hot = temp === "HOT";
  if (hot)
    return (
      <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden>
        <path d="M30 14c-3 4 3 6 0 10M40 12c-3 4 3 6 0 10M50 14c-3 4 3 6 0 10" stroke="#b9b9b9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <ellipse cx="40" cy="68" rx="28" ry="5" fill="#e6e6e6" />
        <path d="M18 32h44l-4 30a6 6 0 0 1-6 5H28a6 6 0 0 1-6-5z" fill="#fff" stroke="#cfcfcf" strokeWidth="2" />
        <path d="M62 38h4a7 7 0 0 1 0 14h-5" fill="none" stroke="#cfcfcf" strokeWidth="3" />
        <ellipse cx="40" cy="33" rx="21" ry="4" fill={art.top ?? art.liquid} />
        {art.cream && <ellipse cx="40" cy="32" rx="14" ry="3" fill="#fff8ec" />}
      </svg>
    );
  // 아이스 / 기본: 투명 컵 + 얼음 + 빨대
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden>
      <path d="M48 4 L42 30" stroke="#2b2b2b" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 22h40l-5 50a4 4 0 0 1-4 3H29a4 4 0 0 1-4-3z" fill="#f2f6f8" stroke="#c9d3d8" strokeWidth="2" />
      <path d="M22.4 34h35.2l-3.7 37a3 3 0 0 1-3 2.6H29.1a3 3 0 0 1-3-2.6z" fill={art.liquid} />
      {art.top && <path d="M22.4 34h35.2l-0.8 9H23.2z" fill={art.top} opacity="0.95" />}
      {temp === "ICED" && (
        <g fill="#ffffff" opacity="0.7">
          <rect x="28" y="38" width="9" height="9" rx="2" />
          <rect x="41" y="44" width="9" height="9" rx="2" />
          <rect x="31" y="52" width="8" height="8" rx="2" />
        </g>
      )}
      {art.bits && (
        <g fill={art.bits}>
          <circle cx="32" cy="62" r="1.6" /><circle cx="46" cy="58" r="1.6" /><circle cx="40" cy="66" r="1.6" />
        </g>
      )}
      {art.cream && <path d="M22 22 Q26 10 40 12 Q54 10 58 22 Z" fill="#fffaf0" stroke="#eadfcc" strokeWidth="1.5" />}
    </svg>
  );
}

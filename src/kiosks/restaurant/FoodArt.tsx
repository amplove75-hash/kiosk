import type { RArt } from "./menu";

/** 한식 메뉴 그림 (간단한 도형) */
export function FoodArt({ art, size = 72 }: { art: RArt; size?: number }) {
  const c = { width: size, height: size, viewBox: "0 0 80 80", "aria-hidden": true } as const;
  const pot = (soup: string, bits: string) => (
    <svg {...c}>
      <ellipse cx="40" cy="64" rx="30" ry="6" fill="#d9d4ca" />
      <path d="M10 40h60l-4 18a8 8 0 0 1-8 6H22a8 8 0 0 1-8-6z" fill="#3a3a3a" />
      <rect x="4" y="38" width="10" height="5" rx="2.5" fill="#3a3a3a" />
      <rect x="66" y="38" width="10" height="5" rx="2.5" fill="#3a3a3a" />
      <ellipse cx="40" cy="40" rx="30" ry="9" fill={soup} />
      {[28, 40, 52, 34, 47].map((x, i) => <rect key={i} x={x - 3} y={36 + (i % 2) * 4} width="6" height="4" rx="1" fill={bits} />)}
      <path d="M30 22c-3 4 3 6 0 10M40 20c-3 4 3 6 0 10M50 22c-3 4 3 6 0 10" stroke="#c9c9c9" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
  const plate = (inner: JSX.Element) => (
    <svg {...c}>
      <ellipse cx="40" cy="48" rx="34" ry="18" fill="#ffffff" stroke="#d9d4ca" strokeWidth="2" />
      <ellipse cx="40" cy="46" rx="26" ry="12" fill="#f4f1ea" />
      {inner}
    </svg>
  );
  const can = (fill: string, label: string) => (
    <svg {...c}>
      <rect x="26" y="12" width="28" height="58" rx="6" fill={fill} />
      <rect x="26" y="12" width="28" height="6" rx="3" fill="#cfcfcf" />
      <text x="40" y="46" textAnchor="middle" fontSize="8" fontWeight="900" fill="#fff">{label}</text>
    </svg>
  );
  switch (art) {
    case "kimchi": return pot("#d8452a", "#f3e2c0");
    case "doenjang": return pot("#a87a3d", "#e9e3c8");
    case "jeyuk": return plate(<g>{[30, 40, 50, 35, 46].map((x, i) => <path key={i} d={`M${x - 6} ${44 + (i % 2) * 4}q6-6 12 0`} stroke="#b8361d" strokeWidth="5" fill="none" strokeLinecap="round" />)}<path d="M24 50l6-6M54 40l4 6" stroke="#5aa832" strokeWidth="3" /></g>);
    case "bibim":
      return (
        <svg {...c}>
          <path d="M10 38h60l-6 24a8 8 0 0 1-8 6H24a8 8 0 0 1-8-6z" fill="#2e2e2e" />
          <ellipse cx="40" cy="38" rx="30" ry="10" fill="#f6f1e4" />
          <path d="M20 38l10-6 10 6z" fill="#5aa832" /><path d="M40 38l10-6 10 6z" fill="#f28c28" /><path d="M28 42l12 4 12-4z" fill="#8b4a2b" />
          <circle cx="40" cy="36" r="5" fill="#ffd34d" stroke="#fff" strokeWidth="2" />
        </svg>
      );
    case "bulgogi":
      return (
        <svg {...c}>
          <rect x="6" y="30" width="68" height="36" rx="6" fill="#c9a77c" />
          <ellipse cx="26" cy="48" rx="14" ry="9" fill="#7a3b14" />
          <circle cx="54" cy="42" r="7" fill="#ffffff" />
          <circle cx="54" cy="56" r="6" fill="#d8452a" />
          <circle cx="66" cy="48" r="4" fill="#5aa832" />
        </svg>
      );
    case "naengmyeon":
      return (
        <svg {...c}>
          <path d="M8 36h64l-6 24a10 10 0 0 1-10 8H24a10 10 0 0 1-10-8z" fill="#c9d3dd" />
          <ellipse cx="40" cy="36" rx="32" ry="10" fill="#e8eef3" />
          <path d="M22 36c6-4 10 4 16 0s10 4 16 0 8 2 8 0" stroke="#8a7a66" strokeWidth="2.5" fill="none" />
          <circle cx="40" cy="32" r="4" fill="#fff" stroke="#ffd34d" strokeWidth="2" />
        </svg>
      );
    case "egg": return plate(<g>{[24, 34, 44, 54].map((x) => <rect key={x} x={x - 4} y="36" width="9" height="16" rx="3" fill="#ffd34d" stroke="#e0a800" />)}</g>);
    case "pajeon": return plate(<g><ellipse cx="40" cy="45" rx="22" ry="10" fill="#e3b05c" />{[30, 40, 50].map((x) => <path key={x} d={`M${x - 6} 44h12`} stroke="#5aa832" strokeWidth="3" />)}<circle cx="34" cy="48" r="2.5" fill="#e85d2a" /><circle cx="48" cy="42" r="2.5" fill="#e85d2a" /></g>);
    case "mandu": return plate(<g>{[28, 40, 52].map((x) => <path key={x} d={`M${x - 8} 48q8-14 16 0z`} fill="#e9b96e" stroke="#b5823a" />)}</g>);
    case "rice":
      return (
        <svg {...c}>
          <path d="M18 40h44l-4 22a6 6 0 0 1-6 5H28a6 6 0 0 1-6-5z" fill="#ffffff" stroke="#cfcfcf" strokeWidth="2" />
          <ellipse cx="40" cy="40" rx="22" ry="8" fill="#ffffff" stroke="#e6e6e6" />
          <path d="M22 40c4-10 32-10 36 0" fill="#fbfbf7" />
        </svg>
      );
    case "cola": return can("#c4161c", "COLA");
    case "cider": return can("#2e9c4b", "CIDER");
    case "sikhye": return can("#c9a77c", "식혜");
  }
}

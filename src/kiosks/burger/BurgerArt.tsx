import type { BArt } from "./menu";

/** 패스트푸드 그림 (간단한 도형, 실제 상품 디자인 아님) */
export function BurgerArt({ art, size = 72 }: { art: BArt; size?: number }) {
  const c = { width: size, height: size, viewBox: "0 0 80 80", "aria-hidden": true } as const;
  const bun = (patty: string, extra?: JSX.Element, double = false) => (
    <svg {...c}>
      <ellipse cx="40" cy="70" rx="30" ry="4" fill="#e7e2d8" />
      <path d="M12 58h56a4 4 0 0 1-4 8H16a4 4 0 0 1-4-8z" fill="#d9944a" />
      <rect x="12" y={double ? 40 : 46} width="56" height="9" rx="4" fill={patty} />
      {double && <rect x="12" y="50" width="56" height="8" rx="4" fill={patty} />}
      {extra}
      <path d="M14 40l4 4 4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4 4-4" stroke="#5aa832" strokeWidth="4" fill="none" strokeLinejoin="round" />
      <path d="M12 38c0-14 12-22 28-22s28 8 28 22z" fill="#e7a24f" />
      {[24, 34, 44, 54, 30, 48].map((x, i) => <ellipse key={i} cx={x} cy={i > 3 ? 22 : 28} rx="1.6" ry="1" fill="#fff6e0" />)}
    </svg>
  );
  const cup = (fill: string, label: string) => (
    <svg {...c}>
      <path d="M46 4l-4 16" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 18h36l-5 54a4 4 0 0 1-4 4H31a4 4 0 0 1-4-4z" fill="#ffffff" stroke="#d0d0d0" strokeWidth="2" />
      <path d="M24 32h32l-1.4 16H25.4z" fill={fill} />
      <text x="40" y="44" textAnchor="middle" fontSize="8" fontWeight="900" fill="#fff">{label}</text>
      <rect x="20" y="14" width="40" height="6" rx="2" fill="#e8e8e8" />
    </svg>
  );
  switch (art) {
    case "burger": return bun("#6b3a1e");
    case "cheese": return bun("#6b3a1e", <path d="M12 44h56l-10 6-8-4-10 6-10-6-8 4z" fill="#ffc83d" />);
    case "bulgogi": return bun("#7a3b14", <rect x="14" y="44" width="52" height="3" rx="1.5" fill="#f2e7c9" />);
    case "shrimp": return bun("#f08a4b", <rect x="14" y="44" width="52" height="3" rx="1.5" fill="#fff4dc" />);
    case "chicken": return bun("#d99a3a");
    case "double": return bun("#5b2f17", <path d="M12 48h56l-10 5-8-3-10 5-10-5-8 3z" fill="#ffc83d" />, true);
    case "fries":
      return (
        <svg {...c}>
          {[24, 30, 36, 42, 48, 54].map((x, i) => <rect key={x} x={x - 2} y={10 + (i % 3) * 4} width="5" height="34" rx="1.5" fill="#f7cf4a" stroke="#d9a520" />)}
          <path d="M18 34h44l-6 40H24z" fill="#d3261e" />
          <path d="M30 50a10 8 0 0 0 20 0" stroke="#ffd166" strokeWidth="3" fill="none" />
        </svg>
      );
    case "cheesestick":
      return (
        <svg {...c}>
          {[0, 1, 2].map((i) => <rect key={i} x={16 + i * 6} y={22 + i * 12} width="48" height="10" rx="5" fill="#d68a2e" stroke="#a8641a" transform={`rotate(-12 40 40)`} />)}
        </svg>
      );
    case "nugget":
      return (
        <svg {...c}>
          {[[26, 32], [48, 30], [30, 52], [52, 52]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="12" ry="9" fill="#d99a3a" stroke="#a8641a" strokeWidth="2" />)}
        </svg>
      );
    case "coleslaw":
      return (
        <svg {...c}>
          <path d="M18 36h44l-4 30H22z" fill="#ffffff" stroke="#cfcfcf" strokeWidth="2" />
          <ellipse cx="40" cy="36" rx="22" ry="6" fill="#dff0c8" />
          {[30, 38, 46, 34, 44].map((x, i) => <circle key={i} cx={x} cy={34 + (i % 2) * 3} r="1.8" fill={i % 2 ? "#f28c28" : "#7cc04b"} />)}
        </svg>
      );
    case "cola": return cup("#3b1f12", "COLA");
    case "zero": return cup("#111111", "ZERO");
    case "cider": return cup("#7cc04b", "CIDER");
    case "coffee": return cup("#5a3622", "COFFEE");
    case "orange": return cup("#f28c28", "JUICE");
    case "cone":
      return (
        <svg {...c}>
          <path d="M28 38l12 38 12-38z" fill="#d9a35b" stroke="#b07a2e" strokeWidth="2" />
          <path d="M26 38c-6-10 2-24 14-24s20 14 14 24z" fill="#fffaf0" stroke="#e5dcc8" strokeWidth="2" />
        </svg>
      );
    case "pie":
      return (
        <svg {...c}>
          <rect x="14" y="26" width="52" height="28" rx="10" fill="#e3a24f" stroke="#b5762a" strokeWidth="2" />
          <path d="M22 34l6 12M32 34l6 12M42 34l6 12M52 34l6 12" stroke="#c98a3a" strokeWidth="2" />
        </svg>
      );
  }
}

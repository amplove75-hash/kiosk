// 마트 상품 그림 (간단한 선·면 그림, 실제 상품 디자인 아님)
export function ProductArt({ id, size = 44 }: { id: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 48 48", "aria-hidden": true } as const;
  switch (id) {
    case "milk":
      return (
        <svg {...common}>
          <path d="M14 14l4-8h12l4 8v28H14z" fill="#ffffff" stroke="#7aa7d8" strokeWidth="2" />
          <path d="M14 14h20" stroke="#7aa7d8" strokeWidth="2" />
          <rect x="14" y="24" width="20" height="10" fill="#3a69d4" />
          <text x="24" y="32" textAnchor="middle" fontSize="7" fontWeight="900" fill="#fff">우유</text>
        </svg>
      );
    case "ramen":
      return (
        <svg {...common}>
          <rect x="6" y="10" width="36" height="28" rx="4" fill="#e85d2a" />
          <path d="M12 26c3-4 6 4 9 0s6 4 9 0 6 4 6 0" stroke="#ffd166" strokeWidth="2.4" fill="none" />
          <text x="24" y="20" textAnchor="middle" fontSize="7" fontWeight="900" fill="#fff">라면</text>
        </svg>
      );
    case "apple":
      return (
        <svg {...common}>
          <path d="M24 14c-8-4-16 2-14 12 2 11 9 16 14 13 5 3 12-2 14-13 2-10-6-16-14-12z" fill="#d93a3a" />
          <path d="M24 14c0-4 2-7 5-8" stroke="#6b3d1f" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M26 10c4-3 8-1 8-1s-3 4-8 1z" fill="#3f9b4b" />
        </svg>
      );
    case "tissue":
      return (
        <svg {...common}>
          <rect x="8" y="12" width="32" height="28" rx="6" fill="#f3f4f6" stroke="#b8bec9" strokeWidth="2" />
          <ellipse cx="24" cy="12" rx="16" ry="5" fill="#ffffff" stroke="#b8bec9" strokeWidth="2" />
          <ellipse cx="24" cy="12" rx="4" ry="1.6" fill="#b8bec9" />
        </svg>
      );
    case "egg":
      return (
        <svg {...common}>
          <rect x="4" y="24" width="40" height="14" rx="3" fill="#c9a77c" />
          {[10, 19, 29, 38].map((x) => (
            <ellipse key={x} cx={x} cy="22" rx="4.5" ry="6" fill="#fff4dc" stroke="#d9c39b" />
          ))}
        </svg>
      );
    case "tofu":
      return (
        <svg {...common}>
          <path d="M8 20l8-6h24l-8 6z" fill="#ffffff" stroke="#d8d2c0" strokeWidth="1.6" />
          <path d="M8 20h24v16H8z" fill="#f6f2e4" stroke="#d8d2c0" strokeWidth="1.6" />
          <path d="M32 20l8-6v16l-8 6z" fill="#ebe5d2" stroke="#d8d2c0" strokeWidth="1.6" />
        </svg>
      );
    case "water":
      return (
        <svg {...common}>
          <rect x="20" y="4" width="8" height="5" rx="1" fill="#2f6fd6" />
          <path d="M18 10h12l3 6v26a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V16z" fill="#d9eefc" stroke="#7fb4e6" strokeWidth="2" />
          <rect x="15" y="22" width="18" height="8" fill="#2f6fd6" />
        </svg>
      );
    case "bread":
      return (
        <svg {...common}>
          <path d="M8 22c0-8 6-12 16-12s16 4 16 12v16H8z" fill="#e2b46a" stroke="#b5823a" strokeWidth="2" />
          <path d="M12 24c0-6 5-9 12-9s12 3 12 9v12H12z" fill="#f8e6c1" />
        </svg>
      );
    case "banana":
      return (
        <svg {...common}>
          <path d="M8 16c4 16 20 22 32 14-12 2-22-4-26-16z" fill="#f6d33c" stroke="#c9a316" strokeWidth="2" strokeLinejoin="round" />
          <path d="M8 16l-2-4" stroke="#6b4d12" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "detergent":
      return (
        <svg {...common}>
          <rect x="18" y="4" width="10" height="7" rx="2" fill="#1b8754" />
          <path d="M14 12h18l2 6v22a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V18z" fill="#9fdcb5" stroke="#1b8754" strokeWidth="2" />
          <circle cx="23" cy="28" r="5" fill="#ffffff" />
        </svg>
      );
    case "laver":
      return (
        <svg {...common}>
          <rect x="6" y="12" width="36" height="24" rx="3" fill="#24331f" />
          <rect x="10" y="16" width="28" height="16" rx="2" fill="#3c5530" />
          <text x="24" y="28" textAnchor="middle" fontSize="8" fontWeight="900" fill="#e6f0d8">김</text>
        </svg>
      );
    case "yogurt":
      return (
        <svg {...common}>
          {[8, 18, 28].map((x) => (
            <g key={x}>
              <path d={`M${x} 16h10l-1 24h-8z`} fill="#fde2ef" stroke="#e48bb6" strokeWidth="1.6" />
              <rect x={x - 1} y="12" width="12" height="4" rx="1" fill="#e48bb6" />
            </g>
          ))}
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="8" y="8" width="32" height="32" rx="6" fill="#e5e7eb" />
        </svg>
      );
  }
}

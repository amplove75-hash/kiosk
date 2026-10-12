// 장소 아이콘: 단순한 선 그림 (가상 브랜드, 실제 로고 없음)
type P = { size?: number };
const base = (size: number) => ({
  width: size, height: size, viewBox: "0 0 32 32", fill: "none",
  stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  "aria-hidden": true,
});
export const Icon = {
  cafe: ({ size = 30 }: P) => (
    <svg {...base(size)}><path d="M6 12h16v8a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z" /><path d="M22 14h2a3 3 0 0 1 0 6h-2" /><path d="M11 4c-1 2 1 3 0 5M16 4c-1 2 1 3 0 5" /></svg>
  ),
  burger: ({ size = 30 }: P) => (
    <svg {...base(size)}><path d="M6 14a10 7 0 0 1 20 0z" /><path d="M5 18h22" /><path d="M6 22h20a3 3 0 0 1-3 4H9a3 3 0 0 1-3-4z" /></svg>
  ),
  mart: ({ size = 30 }: P) => (
    <svg {...base(size)}><path d="M3 5h4l3 14h14l3-10H9" /><circle cx="12" cy="25" r="2" /><circle cx="22" cy="25" r="2" /></svg>
  ),
  train: ({ size = 30 }: P) => (
    <svg {...base(size)}><rect x="7" y="4" width="18" height="19" rx="5" /><path d="M7 14h18" /><circle cx="12" cy="18.5" r="1" /><circle cx="20" cy="18.5" r="1" /><path d="M11 23l-3 5M21 23l3 5" /></svg>
  ),
  movie: ({ size = 30 }: P) => (
    <svg {...base(size)}><rect x="4" y="9" width="24" height="17" rx="2" /><path d="M4 9l3-5 5 5M12 9l3-5 5 5M20 9l3-5 5 5" /></svg>
  ),
  hospital: ({ size = 30 }: P) => (
    <svg {...base(size)}><rect x="5" y="5" width="22" height="22" rx="5" /><path d="M16 10v12M10 16h12" /></svg>
  ),
  civil: ({ size = 30 }: P) => (
    <svg {...base(size)}><path d="M4 12l12-7 12 7" /><path d="M7 12v11M13 12v11M19 12v11M25 12v11" /><path d="M4 27h24" /></svg>
  ),
  parking: ({ size = 30 }: P) => (
    <svg {...base(size)}><rect x="5" y="4" width="22" height="24" rx="5" /><path d="M12 22V10h5a4 4 0 0 1 0 8h-5" /></svg>
  ),
};

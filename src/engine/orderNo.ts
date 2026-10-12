import { load, save } from "../lib/storage";
// 주문번호: A-001 형식. 기기 안에서 하나씩 늘어난다.
export function nextOrderNo(prefix = "A") {
  const s = load<{ n: number }>("kx.orderNo", { n: Math.floor(Math.random() * 40) });
  const n = (s.n % 999) + 1;
  save("kx.orderNo", { n });
  return `${prefix}-${String(n).padStart(3, "0")}`;
}
export function nowText() {
  const d = new Date();
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

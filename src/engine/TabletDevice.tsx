import type { ReactNode } from "react";

/** 식당 테이블 위에 놓인 가로형 주문 태블릿 */
export function TabletDevice({ children }: { children: ReactNode }) {
  return (
    <div className="ktablet">
      <div className="kt-screen kscreen" data-guide="screen">
        {children}
      </div>
      <span className="kt-cam" aria-hidden />
      <span className="kt-stand" aria-hidden />
    </div>
  );
}

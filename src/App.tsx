import { useEffect } from "react";
import { HashRouter, Route, Routes, useParams } from "react-router-dom";
import { TopBar } from "./components/TopBar";
import { Toast } from "./components/Toast";
import { Home } from "./pages/Home";
import { KioskPage } from "./pages/KioskPage";
import { PrintPage } from "./pages/PrintPage";
import { CameraTest } from "./pages/CameraTest";

/** 다른 키오스크로 옮기면 체험 화면을 처음부터 새로 시작한다 */
function KioskRoute() {
  const { id } = useParams();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  return <KioskPage key={id} />;
}

export function App() {
  return (
    <HashRouter>
      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/kiosk/:id" element={<KioskRoute />} />
        <Route path="/print" element={<PrintPage />} />
        <Route path="/print/cards" element={<PrintPage section="cards" />} />
        <Route path="/print/products" element={<PrintPage section="products" />} />
        <Route path="/camera-test" element={<CameraTest />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <footer className="footer no-print">
        <div className="wrap">
          교육자료: 에제르코칭 「디지털 전환 교육 — 키오스크야! 내 주문을 받아줘!」 · 이 사이트의 상호와 결제는 모두 연습용이에요.
        </div>
      </footer>
      <Toast />
    </HashRouter>
  );
}

import { HashRouter, Route, Routes } from "react-router-dom";
import { TopBar } from "./components/TopBar";
import { Toast } from "./components/Toast";
import { Home } from "./pages/Home";
import { KioskPage } from "./pages/KioskPage";
import { PrintPage } from "./pages/PrintPage";
import { CameraTest } from "./pages/CameraTest";

export function App() {
  return (
    <HashRouter>
      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/kiosk/:id" element={<KioskPage />} />
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

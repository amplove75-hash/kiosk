import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarcodeScanner } from "../scanner/BarcodeScanner";
import { getDecoder } from "../scanner/decoder";
import { KIND_LABEL, type Scanned } from "../scanner/codes";

export function CameraTest() {
  const [engine, setEngine] = useState<string>("확인 중…");
  const [log, setLog] = useState<Scanned[]>([]);
  useEffect(() => {
    getDecoder()
      .then((d) => setEngine(d.engine === "native" ? "브라우저 내장 인식기" : "자바스크립트 인식기(ZXing)"))
      .catch(() => setEngine("불러오지 못함"));
  }, []);
  const secure = window.isSecureContext;
  const hasCam = !!navigator.mediaDevices?.getUserMedia;
  return (
    <main className="wrap practice camtest">
      <div className="practice-head">
        <h1>카메라 점검</h1>
        <Link className="btn" to="/print">연습용 카드 인쇄</Link>
      </div>
      <div className="guide-area">
        <div className="panel">
          <h2>수업 전에 확인해요</h2>
          <ul className="checks">
            <li className={secure ? "ok" : "bad"}><b>{secure ? "✓" : "✕"}</b> 안전한 주소(https)로 열었어요{!secure && " — 카메라를 쓰려면 https 주소나 localhost로 열어야 해요"}</li>
            <li className={hasCam ? "ok" : "bad"}><b>{hasCam ? "✓" : "✕"}</b> 이 브라우저가 카메라를 지원해요</li>
            <li className="ok"><b>✓</b> 바코드 인식 방식: {engine}</li>
          </ul>
          <p>오른쪽(또는 아래) 카메라 화면에 인쇄한 체험카드를 비춰보세요. 어떤 카드든 인식되면 아래에 나와요.</p>
        </div>
        <div className="panel">
          <h2>인식된 카드</h2>
          {log.length === 0 ? (
            <p className="muted-note">아직 인식된 카드가 없어요.</p>
          ) : (
            <ul className="scan-log">
              {log.map((x, i) => (
                <li key={i}><b>{x.label}</b> <span>{x.kind !== "invalid" ? KIND_LABEL[x.kind] : ""} · {x.code}</span></li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="device-area">
        <div className="panel" style={{ width: "100%" }}>
          <BarcodeScanner
            accept={["card", "member", "coupon", "patient", "id", "parking", "discount", "rail", "product"]}
            prompt="체험카드나 상품 바코드를 비춰주세요"
            onScan={(x) => setLog((l) => [x, ...l].slice(0, 12))}
          />
        </div>
      </div>
    </main>
  );
}

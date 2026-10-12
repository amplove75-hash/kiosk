import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

/** 바코드(Code128/EAN-13) 또는 QR 코드를 SVG로 그린다 */
export function Barcode({ value, format, height = 56, big = false }: { value: string; format: "CODE128" | "EAN13" | "QR"; height?: number; big?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const [qr, setQr] = useState("");
  useEffect(() => {
    if (format === "QR") {
      QRCode.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M" }).then(setQr).catch(() => setQr(""));
      return;
    }
    if (!ref.current) return;
    try {
      JsBarcode(ref.current, value, {
        format,
        displayValue: format === "EAN13",
        height: big ? height * 2.2 : height,
        width: big ? 4 : 2,
        margin: big ? 16 : 4,
        fontSize: big ? 28 : 14,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch {
      /* 잘못된 값 */
    }
  }, [value, format, height, big]);
  if (format === "QR")
    return <span className={`qr ${big ? "big" : ""}`} aria-label={`QR 코드 ${value}`} dangerouslySetInnerHTML={{ __html: qr }} />;
  return <svg ref={ref} className="bc" role="img" aria-label={`바코드 ${value}`} />;
}

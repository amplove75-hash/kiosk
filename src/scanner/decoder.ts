// 바코드 해독기: 브라우저 내장 BarcodeDetector가 있으면 쓰고, 없으면 ZXing(자바스크립트)로 대신한다.
export type Decoder = { engine: "native" | "zxing"; decode: (c: HTMLCanvasElement) => Promise<string | null> };

let cached: Promise<Decoder> | null = null;

export function getDecoder(): Promise<Decoder> {
  cached ??= make();
  return cached;
}

async function make(): Promise<Decoder> {
  const BD = (window as any).BarcodeDetector;
  if (BD) {
    try {
      const supported: string[] = await BD.getSupportedFormats();
      const want = ["code_128", "ean_13", "qr_code"].filter((f) => supported.includes(f));
      if (want.length === 3) {
        const det = new BD({ formats: want });
        return {
          engine: "native",
          decode: async (c) => {
            const r = await det.detect(c);
            return r[0]?.rawValue ?? null;
          },
        };
      }
    } catch {
      /* ZXing으로 */
    }
  }
  const [{ BrowserMultiFormatReader }, lib] = await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
  const hints = new Map();
  hints.set(lib.DecodeHintType.POSSIBLE_FORMATS, [lib.BarcodeFormat.CODE_128, lib.BarcodeFormat.EAN_13, lib.BarcodeFormat.QR_CODE]);
  hints.set(lib.DecodeHintType.TRY_HARDER, true);
  const reader = new BrowserMultiFormatReader(hints);
  return {
    engine: "zxing",
    decode: async (c) => {
      try {
        return reader.decodeFromCanvas(c).getText();
      } catch {
        return null;
      }
    },
  };
}

/** 사진 파일에서 바코드 읽기 (카메라를 못 쓰는 환경용) */
export async function decodeImageFile(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const dec = await getDecoder();
    for (const max of [1600, 1000, 640]) {
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * s);
      c.height = Math.round(img.naturalHeight * s);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      const r = await dec.decode(c);
      if (r) return r;
    }
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

import { useCallback, useEffect, useRef, useState } from "react";
import { getDecoder, decodeImageFile } from "./decoder";
import { KIND_LABEL, parseCode, type ScanKind, type Scanned } from "./codes";
import { useSettings } from "../settings";
import { sounds } from "../lib/sound";

type Status = "off" | "starting" | "live" | "denied" | "nocamera" | "insecure" | "error";

const STATUS_TEXT: Record<Exclude<Status, "live">, string> = {
  off: "카메라가 꺼져 있어요.",
  starting: "카메라를 켜는 중이에요…",
  denied: "카메라를 쓸 수 없어요. 아래 다른 방법으로 연습해 주세요.",
  nocamera: "이 기기에서 카메라를 찾지 못했어요.",
  insecure: "카메라는 https 주소에서만 켜져요.",
  error: "카메라를 켜지 못했어요. 다시 켜 보세요.",
};

/**
 * 연습용 바코드 인식기.
 * - 카메라 영상은 이 기기 안에서만 처리하고 어디에도 저장·전송하지 않는다.
 * - 카메라를 못 쓰면 사진 올리기 또는 연습 버튼으로 대신 진행한다.
 */
export function BarcodeScanner(props: {
  accept: ScanKind[];
  prompt: string;
  onScan: (s: Scanned) => void;
  /** 카메라 없이 진행하는 버튼 (예: "체험카드로 결제하기") */
  fallback?: { label: string; onClick: () => void };
  /** 같은 종류라도 거절할지 판단 (예: 마트 회원카드를 카페에서) */
  reject?: (s: Scanned) => string | null;
  compact?: boolean;
  guideId?: string;
}) {
  // 키오스크 화면 안(compact)에서는 버튼 없이 항상 카메라를 켠다
  const camSetting = useSettings((s) => s.camera);
  const camOn = props.compact ? true : camSetting;
  const setSettings = useSettings((s) => s.set);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>(camOn ? "starting" : "off");
  const [mirror, setMirror] = useState(true);
  const [msg, setMsg] = useState<{ tone: "ok" | "bad" | "info"; text: string } | null>(null);
  const [flash, setFlash] = useState(false);
  const last = useRef({ code: "", t: 0 });
  const startedAt = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  const handle = useCallback((raw: string) => {
    const now = Date.now();
    if (raw === last.current.code && now - last.current.t < 1500) return;
    last.current = { code: raw, t: now };
    const p = propsRef.current;
    const s = parseCode(raw);
    if (s.kind === "invalid") {
      sounds.warn();
      setMsg({ tone: "bad", text: "연습용 카드가 아니에요. 인쇄한 체험카드를 비춰주세요." });
      return;
    }
    if (!p.accept.includes(s.kind)) {
      sounds.warn();
      const want = p.accept.map((k) => KIND_LABEL[k]).join(" 또는 ");
      setMsg({ tone: "bad", text: `이건 '${s.label}'이에요. ${want}를 비춰주세요.` });
      return;
    }
    const why = p.reject?.(s);
    if (why) {
      sounds.warn();
      setMsg({ tone: "bad", text: why });
      return;
    }
    sounds.ok();
    try { navigator.vibrate?.(80); } catch { /* noop */ }
    setFlash(true);
    setTimeout(() => setFlash(false), 500);
    setMsg({ tone: "ok", text: `${s.label} 인식 완료!` });
    p.onScan(s);
  }, []);

  // 카메라 켜기/끄기
  useEffect(() => {
    if (!camOn) {
      setStatus("off");
      return;
    }
    if (!window.isSecureContext) {
      setStatus("insecure");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("nocamera");
      return;
    }
    let cancelled = false;
    setStatus("starting");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then(async (stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const facing = stream.getVideoTracks()[0]?.getSettings().facingMode;
        setMirror(facing !== "environment");
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play().catch(() => {});
        startedAt.current = Date.now();
        setStatus("live");
      })
      .catch((e: DOMException) => {
        if (cancelled) return;
        setStatus(e?.name === "NotAllowedError" || e?.name === "SecurityError" ? "denied" : e?.name === "NotFoundError" || e?.name === "OverconstrainedError" ? "nocamera" : "error");
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [camOn]);

  // 인식 반복
  useEffect(() => {
    if (status !== "live") return;
    let stop = false;
    let hinted = false;
    const canvas = document.createElement("canvas");
    (async () => {
      const dec = await getDecoder();
      while (!stop) {
        const v = videoRef.current;
        if (v && v.readyState >= 2 && v.videoWidth) {
          const s = Math.min(1, 960 / v.videoWidth);
          canvas.width = Math.round(v.videoWidth * s);
          canvas.height = Math.round(v.videoHeight * s);
          canvas.getContext("2d", { willReadFrequently: true })!.drawImage(v, 0, 0, canvas.width, canvas.height);
          const r = await dec.decode(canvas).catch(() => null);
          if (r) handle(r);
          else if (!hinted && Date.now() - startedAt.current > 10000) {
            hinted = true;
            setMsg((m) => m ?? { tone: "info", text: "카드를 조금 더 가까이, 밝은 곳에서 비춰보세요." });
          }
        }
        await new Promise((r) => setTimeout(r, 200));
      }
    })();
    return () => {
      stop = true;
    };
  }, [status, handle]);

  const onFile = async (f?: File) => {
    if (!f) return;
    setMsg({ tone: "info", text: "사진에서 바코드를 찾는 중이에요…" });
    const r = await decodeImageFile(f).catch(() => null);
    if (r) {
      last.current = { code: "", t: 0 };
      handle(r);
    } else {
      sounds.warn();
      setMsg({ tone: "bad", text: "사진에서 바코드를 찾지 못했어요. 바코드가 크게 나오게 다시 찍어주세요." });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className={`scanner ${props.compact ? "compact" : ""}`} data-guide={props.guideId}>
      <div className={`sc-view ${flash ? "flash" : ""}`}>
        <video ref={videoRef} muted playsInline aria-label="카메라 화면" style={{ transform: mirror ? "scaleX(-1)" : undefined }} hidden={status !== "live"} />
        {status === "live" ? (
          <div className="sc-frame" aria-hidden>
            <i /><i /><i /><i /><b />
          </div>
        ) : (
          <div className="sc-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M4 7h3l2-3h6l2 3h3v12H4z" /><circle cx="12" cy="13" r="3.5" />
            </svg>
            <span>{STATUS_TEXT[status as Exclude<Status, "live">]}</span>
          </div>
        )}
      </div>
      <p className="sc-prompt">{props.prompt}</p>
      {msg && <p className={`sc-msg ${msg.tone}`} role="status">{msg.text}</p>}
      {(props.fallback || !props.compact) && <div className="sc-actions">
        {props.fallback && (
          <button type="button" className="sc-btn main" onClick={props.fallback.onClick} data-guide="scan-fallback">
            {props.fallback.label}
          </button>
        )}
        {!props.compact && (
          <>
            <button type="button" className="sc-btn" onClick={() => fileRef.current?.click()}>
              사진으로 인식하기
            </button>
            <button type="button" className="sc-btn" onClick={() => setSettings({ camera: !camOn })}>
              {camOn ? "카메라 끄기" : "카메라 켜기"}
            </button>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>}
      {!props.compact && <p className="sc-privacy">카메라 화면은 이 기기 안에서만 쓰고, 저장하거나 보내지 않아요.</p>}
    </div>
  );
}

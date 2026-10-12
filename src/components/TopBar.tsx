import { Link } from "react-router-dom";
import { useSettings, type FontScale } from "../settings";
import { stopSpeaking, speak } from "../lib/speech";

const SIZES: { v: FontScale; label: string; px: string }[] = [
  { v: 1, label: "보통", px: "0.95rem" },
  { v: 1.15, label: "크게", px: "1.15rem" },
  { v: 1.3, label: "아주 크게", px: "1.35rem" },
];

export function TopBar() {
  const s = useSettings();
  return (
    <header className="topbar no-print">
      <div className="wrap">
        <Link to="/" className="brand" aria-label="처음 화면으로">
          <span className="brand-mark" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <rect x="5" y="2.5" width="14" height="19" rx="2.5" /><path d="M9 17.5h6" />
            </svg>
          </span>
          키오스크 연습장
        </Link>
        <div className="tools">
          <div className="seg" role="group" aria-label="글자 크기">
            {SIZES.map((z) => (
              <button
                key={z.v}
                aria-pressed={s.fontScale === z.v}
                aria-label={`글자 ${z.label}`}
                title={`글자 ${z.label}`}
                onClick={() => s.set({ fontScale: z.v })}
                style={{ fontSize: z.px }}
              >
                가
              </button>
            ))}
          </div>
          <button className="toggle" aria-pressed={s.contrast} onClick={() => s.set({ contrast: !s.contrast })}>
            <span className="dot" aria-hidden /> 선명하게
          </button>
          <button
            className="toggle"
            aria-pressed={s.voice}
            onClick={() => {
              const v = !s.voice;
              s.set({ voice: v });
              if (v) speak("음성 안내를 켰어요.");
              else stopSpeaking();
            }}
          >
            <span className="dot" aria-hidden /> 음성 안내
          </button>
        </div>
      </div>
    </header>
  );
}

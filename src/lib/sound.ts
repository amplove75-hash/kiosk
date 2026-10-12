// 키오스크 효과음. 사용자가 화면을 누른 뒤에만 소리가 난다(브라우저 정책).
let ctx: AudioContext | null = null;
function ac() {
  try {
    ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctx;
  } catch {
    return null;
  }
}
export function beep(freq = 880, ms = 90, gain = 0.06) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.frequency.value = freq;
  o.type = "sine";
  g.gain.value = gain;
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + ms / 1000);
}
export const sounds = {
  ok: () => { beep(988, 80); setTimeout(() => beep(1319, 120), 90); },
  soft: () => beep(660, 60, 0.04),
  warn: () => beep(330, 160, 0.05),
};

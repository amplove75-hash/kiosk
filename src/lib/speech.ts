// 음성 안내 (Web Speech API). 지원하지 않는 브라우저에서는 조용히 넘어간다.
export function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[\[\]]/g, ""));
    u.lang = "ko-KR";
    u.rate = 0.9;
    synth.speak(u);
  } catch {
    /* noop */
  }
}
export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* noop */
  }
}

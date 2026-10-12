import { create } from "zustand";
import { load, save } from "./lib/storage";

export type FontScale = 1 | 1.15 | 1.3;
type Settings = { fontScale: FontScale; contrast: boolean; voice: boolean; sound: boolean; camera: boolean };
type Store = Settings & {
  set: (patch: Partial<Settings>) => void;
};

const KEY = "kx.settings";
const initial = load<Settings>(KEY, { fontScale: 1, contrast: false, voice: false, sound: true, camera: true });

export const useSettings = create<Store>((set, get) => ({
  ...initial,
  set: (patch) => {
    set(patch);
    const { fontScale, contrast, voice, sound, camera } = get();
    save(KEY, { fontScale, contrast, voice, sound, camera });
    apply(get());
  },
}));

export function apply(s: Settings) {
  const root = document.documentElement;
  root.style.setProperty("--scale", String(s.fontScale));
  if (s.contrast) root.setAttribute("data-contrast", "high");
  else root.removeAttribute("data-contrast");
}
apply(initial);

// 진행 기록: 키오스크별로 몇 번 완주했는지
const PKEY = "kx.progress";
export type Progress = Record<string, { guide?: number; practice?: number }>;
export function getProgress(): Progress {
  return load<Progress>(PKEY, {});
}
export function addProgress(kioskId: string, mode: "guide" | "practice") {
  const p = getProgress();
  const row = p[kioskId] ?? {};
  row[mode] = (row[mode] ?? 0) + 1;
  p[kioskId] = row;
  save(PKEY, p);
}

import { useEffect, useState } from "react";
import { create } from "zustand";

type T = { msg: string; id: number; show: (m: string) => void };
export const useToast = create<T>((set) => ({
  msg: "",
  id: 0,
  show: (msg) => set((s) => ({ msg, id: s.id + 1 })),
}));

export function Toast() {
  const { msg, id } = useToast();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!id) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, [id]);
  if (!visible || !msg) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {msg}
    </div>
  );
}

'use client';

import { useEffect } from "react";

export default function UrgentAlert({ count }: { count: number }) {
  useEffect(() => {
    if (count === 0) return;
    try {
      const ctx = new AudioContext();
      const beep = (offset: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + offset);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.18);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.18);
      };
      // 삐-삐-삐 세 번: 높음→높음→낮음 (독촉 느낌)
      beep(0,    880);
      beep(0.22, 880);
      beep(0.44, 660);
    } catch {
      // 브라우저 자동재생 차단 시 조용히 무시
    }
  }, []);

  return null;
}

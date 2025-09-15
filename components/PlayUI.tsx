"use client";

import { useEffect, useRef, useState } from "react";

type GameState = {
  gameId: string;
  step: number;
  currentTargetId: string;
  currentTargetTitle: string;
  totalScore: number;
};

type AnswerResult = {
  valid: boolean;
  p: number;
  rarity: number;
  stepScore: number;
  nextTargetId: string | null;
  nextTargetTitle?: string | null;
  end_reason?: string | null;
};

export default function PlayUI() {
  const [state, setState] = useState<GameState | null>(null);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const t0Ref = useRef<number>(0);

  useEffect(() => {
    const boot = async () => {
      const res = await fetch("/api/game/new", { method: "POST" });
      if (!res.ok) { setLog(l => [`خطا در ساخت بازی: ${res.status}`, ...l]); return; }
      const data = await res.json();
      setState({
        gameId: data.game_id,
        step: data.step,
        currentTargetId: data.target_id,
        currentTargetTitle: data.target_title,
        totalScore: 0
      });
      t0Ref.current = performance.now();
    };
    boot();
  }, []);

  const submit = async () => {
    if (!state || busy) return;
    setBusy(true);
    const time_ms = Math.max(0, Math.round(performance.now() - t0Ref.current));
    const payload = {
      game_id: state.gameId,
      target_id: state.currentTargetId,
      answer_text: input.trim(),
      step: state.step,
      time_ms
    };
    const res = await fetch("/api/play/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setBusy(false);
    if (!res.ok) { setLog(l=>[`خطا در ارسال پاسخ (${res.status})`, ...l]); return; }
    const data: AnswerResult = await res.json();

    const entries: string[] = [];
    if (data.valid) {
      entries.push(`✅ معتبر! امتیاز این گام: ${data.stepScore} | کمیابی: ${data.rarity.toFixed(2)} | p=${(data.p*100).toFixed(2)}%`);
      if (data.p < 0.01) entries.push("🌟 تو خاصی!");
      const nextTitle = data.nextTargetTitle || "؟";
      entries.push(`🎯 هدف بعدی: ${nextTitle}`);
      setState(s => s ? ({
        ...s,
        step: s.step + 1,
        currentTargetId: data.nextTargetId || s.currentTargetId,
        currentTargetTitle: nextTitle,
        totalScore: s.totalScore + data.stepScore
      }) : s);
      t0Ref.current = performance.now();
    } else {
      entries.push(`⛔ پایان بازی: ${data.end_reason || "پاسخ نامعتبر/ممنوع/دیر"}`);
    }
    setLog(l => [...entries, ...l]);
    setInput("");
  };

  if (!state) return <div className="card">در حال آماده‌سازی…</div>;

  return (
    <div className="card">
      <div className="row" style={{justifyContent:"space-between"}}>
        <div>گام <b>{state.step}</b> — هدف: <b>{state.currentTargetTitle}</b></div>
        <div>امتیاز کل: <b>{state.totalScore}</b></div>
      </div>
      <hr />
      <div className="row">
        <input
          placeholder={`«${state.currentTargetTitle}» را با چی نابود می‌کنی؟ (۱–۲ واژه)`}
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          onKeyDown={(e)=>{ if(e.key==='Enter'){ submit(); } }}
        />
        <button disabled={busy || !input.trim()} onClick={submit}>ثبت</button>
        <span className="small">تا ۵ ثانیه برای پاداش سرعت ⏱️</span>
      </div>
      <hr />
      <div className="small mono">
        {log.map((l, i)=>(<div key={i}>{l}</div>))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTheme } from "@/components/theme-provider";

export function WelcomeModal({ onComplete }: { onComplete: () => void }) {
  const [name, setName] = useState("");
  const { updateDisplayName } = useTheme();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await updateDisplayName(trimmed);
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="glass-card rounded-3xl p-8 max-w-sm w-full mx-4 text-center space-y-6">
        <h2 className="font-cursive text-5xl text-theme-text">Kaylee</h2>
        <p className="font-serif text-theme-text-muted">
          Welcome! What should we call you?
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-center font-serif text-lg bg-theme-bg border border-theme-accent/30 text-theme-text placeholder:text-theme-text-muted/50 focus:outline-none focus:border-theme-accent"
            placeholder="Your name"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full glass rounded-xl px-6 py-3 font-serif text-sm font-medium shadow-glass text-theme-text hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTheme } from "@/components/theme-provider";

const styles = {
  overlay:
    "fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm",
  card: "glass-card mx-4 w-full max-w-sm space-y-6 rounded-3xl p-8 text-center",
  title: "font-cursive text-6xl text-theme-text",
  subtitle: "font-serif text-theme-text-muted",
  form: "space-y-4",
  input:
    "w-full rounded-xl border border-theme-accent/30 bg-theme-bg px-4 py-3 text-center font-serif text-card-title text-theme-text placeholder:text-theme-text-muted/50 focus:border-theme-accent focus:outline-none",
  submit:
    "glass w-full rounded-xl px-6 py-3 font-serif text-body font-medium text-theme-text shadow-glass transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100",
};

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
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h2 className={styles.title}>Kaylee</h2>
        <p className={styles.subtitle}>
          Welcome! What should we call you?
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            placeholder="Your name"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className={styles.submit}
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

interface PointsToastProps {
  amount: number;
  onDone: () => void;
}

const styles = {
  root:
    "fixed top-6 right-16 z-[200] pointer-events-none transition-all duration-[400ms] ease-out",
  card: "glass-card flex items-center gap-2 rounded-xl px-5 py-2.5 shadow-glass",
  coinIcon: "h-5 w-5",
  label: "font-serif text-lg font-medium text-theme-text",
};

export function PointsToast({ amount, onDone }: PointsToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={styles.root}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-12px)",
      }}
    >
      <div className={styles.card}>
        <svg className={styles.coinIcon} viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" fill="var(--color-accent-yellow)" opacity="0.8" />
          <text x="10" y="14" textAnchor="middle" fontSize="10" fill="var(--color-text)" fontWeight="bold">$</text>
        </svg>
        <span className={styles.label}>
          +{amount} coins!
        </span>
      </div>
    </div>
  );
}

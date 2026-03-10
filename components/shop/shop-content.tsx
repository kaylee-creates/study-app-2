"use client";

import { useTheme } from "@/components/theme-provider";
import { THEMES } from "@/lib/themes";

export function ShopContent() {
  const { settings, purchaseTheme, switchTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="inline-block">
          <h1 className="font-serif text-3xl text-theme-text">Theme Shop</h1>
          <svg className="mt-0.5" width="130" height="8" viewBox="0 0 130 8" fill="none">
            <path d="M2,4 C14,1 28,7 42,4 C56,1 70,7 84,4 C98,1 112,7 128,4" stroke="var(--color-accent-yellow)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <div className="glass rounded-full px-4 py-1.5 shadow-glass">
          <span className="text-sm font-medium text-theme-text">
            {settings.totalPoints} coins
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {THEMES.map((theme) => {
          const owned = settings.purchasedThemeIds.includes(theme.id);
          const active = settings.activeThemeId === theme.id;
          const canAfford = settings.totalPoints >= theme.cost;

          return (
            <div
              key={theme.id}
              className={`glass-card rounded-2xl p-4 space-y-3 transition-all ${
                active ? "ring-2 ring-theme-accent" : ""
              }`}
            >
              {/* Color swatches */}
              <div className="flex gap-1.5">
                {theme.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-lg shadow-sm"
                    style={{ background: color }}
                  />
                ))}
              </div>

              {/* Theme name and cost */}
              <div>
                <h3 className="font-serif text-lg font-medium text-theme-text">
                  {theme.name}
                </h3>
                <p className="text-sm text-theme-text-muted">
                  {theme.cost === 0 ? "Free" : `${theme.cost} coins`}
                </p>
              </div>

              {/* Action button */}
              {active ? (
                <div className="text-sm font-medium text-theme-accent px-3 py-1.5 rounded-xl bg-theme-accent/10 text-center">
                  Active
                </div>
              ) : owned ? (
                <button
                  onClick={() => switchTheme(theme.id)}
                  className="w-full glass rounded-xl px-4 py-2 shadow-glass text-sm font-medium text-theme-text hover:scale-[1.01] transition-transform"
                >
                  Apply
                </button>
              ) : (
                <button
                  onClick={async () => {
                    const success = await purchaseTheme(theme.id);
                    if (success) await switchTheme(theme.id);
                  }}
                  disabled={!canAfford}
                  className="w-full glass rounded-xl px-4 py-2 shadow-glass text-sm font-medium text-theme-text hover:scale-[1.01] transition-transform disabled:opacity-40 disabled:hover:scale-100"
                >
                  {canAfford ? `Buy for ${theme.cost} coins` : `Need ${theme.cost - settings.totalPoints} more coins`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

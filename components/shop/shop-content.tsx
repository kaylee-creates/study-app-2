"use client";

import { useTheme } from "@/components/theme-provider";
import { THEMES } from "@/lib/themes";

const styles = {
  root: "space-y-6",
  headerRow: "flex items-center justify-between",
  titleWrap: "inline-block",
  title: "font-serif text-page-title text-theme-text",
  titleUnderline: "mt-0.5",
  balancePill: "glass rounded-full px-4 py-1.5 shadow-glass",
  balanceText: "text-small font-medium text-theme-text",
  grid: "grid grid-cols-1 gap-4 sm:grid-cols-2",
  themeCard: "glass-card space-y-3 rounded-2xl p-4 transition-all",
  themeCardActive: "ring-2 ring-theme-accent",
  swatches: "flex gap-1.5",
  swatch: "h-8 w-8 rounded-lg shadow-sm",
  themeName: "font-serif text-card-title font-medium text-theme-text",
  themeCost: "text-small text-theme-text-muted",
  activeBadge:
    "rounded-xl bg-theme-accent/10 px-3 py-1.5 text-center text-small font-medium text-theme-accent",
  applyButton:
    "glass w-full rounded-xl px-4 py-2 text-small font-medium text-theme-text shadow-glass transition-transform hover:scale-[1.01]",
  buyButton:
    "glass w-full rounded-xl px-4 py-2 text-small font-medium text-theme-text shadow-glass transition-transform hover:scale-[1.01] disabled:opacity-40 disabled:hover:scale-100",
};

export function ShopContent() {
  const { settings, purchaseTheme, switchTheme } = useTheme();

  return (
    <div className={styles.root}>
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <h1 className={styles.title}>Theme Shop</h1>
          <svg className={styles.titleUnderline} width="130" height="8" viewBox="0 0 130 8" fill="none">
            <path d="M2,4 C14,1 28,7 42,4 C56,1 70,7 84,4 C98,1 112,7 128,4" stroke="var(--color-accent-yellow)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <div className={styles.balancePill}>
          <span className={styles.balanceText}>
            {settings.totalPoints} coins
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        {THEMES.map((theme) => {
          const owned = settings.purchasedThemeIds.includes(theme.id);
          const active = settings.activeThemeId === theme.id;
          const canAfford = settings.totalPoints >= theme.cost;

          return (
            <div
              key={theme.id}
              className={`${styles.themeCard} ${active ? styles.themeCardActive : ""}`}
            >
              {/* Color swatches */}
              <div className={styles.swatches}>
                {theme.colors.map((color, i) => (
                  <div
                    key={i}
                    className={styles.swatch}
                    style={{ background: color }}
                  />
                ))}
              </div>

              {/* Theme name and cost */}
              <div>
                <h3 className={styles.themeName}>
                  {theme.name}
                </h3>
                <p className={styles.themeCost}>
                  {theme.cost === 0 ? "Free" : `${theme.cost} coins`}
                </p>
              </div>

              {/* Action button */}
              {active ? (
                <div className={styles.activeBadge}>
                  Active
                </div>
              ) : owned ? (
                <button
                  onClick={() => switchTheme(theme.id)}
                  className={styles.applyButton}
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
                  className={styles.buyButton}
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

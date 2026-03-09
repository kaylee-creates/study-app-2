"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/pomodoro", label: "Pomodoro", icon: TimerIcon },
  { href: "/study-guide", label: "Study", icon: BookIcon },
  { href: "/flashcards", label: "Cards", icon: CardsIcon },
  { href: "/planner", label: "Calendar", icon: CalendarIcon },
  { href: "/scrapbook", label: "Scrapbook", icon: ScissorsIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    settings,
    toggleDarkMode,
    toggleBackgroundMusic,
    updateDisplayName,
  } = useTheme();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(settings.displayName);

  useEffect(() => {
    setNameInput(settings.displayName);
  }, [settings.displayName]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Corner menu button */}
      <div className="fixed top-4 right-4 z-50" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={cn(
            "glass w-10 h-10 rounded-full flex items-center justify-center",
            "shadow-glass transition-all hover:scale-105"
          )}
          aria-label="Menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="3" r="1.5" fill="currentColor" />
            <circle cx="9" cy="9" r="1.5" fill="currentColor" />
            <circle cx="9" cy="15" r="1.5" fill="currentColor" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 w-64 glass-card rounded-xl p-4 space-y-3 z-50">
            {/* Profile */}
            <div className="pb-2 border-b border-theme-accent/20">
              {editingName ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateDisplayName(nameInput.trim());
                    setEditingName(false);
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="flex-1 rounded-lg px-2 py-1 text-sm bg-theme-bg border border-theme-accent/30 text-theme-text"
                    autoFocus
                    placeholder="Your name"
                  />
                  <button
                    type="submit"
                    className="text-xs px-2 py-1 rounded-lg bg-theme-accent text-white"
                  >
                    Save
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="flex items-center gap-2 w-full text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-theme-accent/20 flex items-center justify-center text-theme-accent font-serif text-sm">
                    {settings.displayName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="font-serif text-sm text-theme-text">
                      {settings.displayName || "Set your name"}
                    </p>
                    <p className="text-xs text-theme-text-muted">
                      {settings.totalPoints} coins
                    </p>
                  </div>
                  <PencilIcon className="w-3.5 h-3.5 text-theme-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <ToggleRow
                label="Dark Mode"
                enabled={settings.darkModeEnabled}
                onToggle={toggleDarkMode}
              />
              <ToggleRow
                label="Background Music"
                enabled={settings.backgroundMusicEnabled}
                onToggle={toggleBackgroundMusic}
              />
            </div>

            {/* Links */}
            <div className="pt-2 border-t border-theme-accent/20 space-y-1">
              <MenuLink
                href="/shop"
                label="Theme Shop"
                onClick={() => setMenuOpen(false)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav">
        <div className="flex items-center justify-around max-w-lg mx-auto py-2 px-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-[3.5rem]",
                  isActive
                    ? "text-theme-accent scale-105"
                    : "text-theme-text-muted hover:text-theme-accent"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full py-1.5 px-1 rounded-lg hover:bg-theme-accent/5 transition-colors"
    >
      <span className="text-sm text-theme-text">{label}</span>
      <div
        className={cn(
          "w-9 h-5 rounded-full transition-colors relative",
          enabled ? "bg-theme-accent" : "bg-theme-text-muted/30"
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
            enabled ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </div>
    </button>
  );
}

function MenuLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between py-1.5 px-1 rounded-lg hover:bg-theme-accent/5 transition-colors text-sm text-theme-text"
    >
      {label}
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        className="text-theme-text-muted"
      >
        <path
          d="M4.5 2.5L8 6L4.5 9.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

/* ===== Inline SVG Icons ===== */

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function TimerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5" />
      <path d="M9 2h6" />
      <path d="M12 2v2" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function CardsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="16" height="16" rx="2" />
      <path d="M6 2h12a2 2 0 012 2v12" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
    </svg>
  );
}

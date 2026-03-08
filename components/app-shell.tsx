"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/pomodoro", label: "Pomodoro" },
  { href: "/notes", label: "Notes & AI" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/planner", label: "Planner" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <header className="md:w-52 md:min-h-screen border-b md:border-b-0 md:border-r border-cozy-grid bg-cozy-paper/80 shrink-0">
        <div className="p-4">
          <Link href="/" className="font-handwritten text-2xl text-cozy-ink hover:text-cozy-clover">
            Kaylee
          </Link>
        </div>
        <nav className="p-2 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              isActive={pathname === item.href}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-cozy-grid text-cozy-ink"
          : "text-cozy-muted hover:bg-cozy-grid/60 hover:text-cozy-ink"
      )}
    >
      {children}
    </Link>
  );
}

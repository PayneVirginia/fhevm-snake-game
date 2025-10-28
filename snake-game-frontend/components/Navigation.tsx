"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/game", label: "Play Game", icon: "🎮" },
    { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
    { href: "/history", label: "My History", icon: "📊" },
    { href: "/profile", label: "My Profile", icon: "👤" },
  ];

  return (
    <nav className="glass rounded-lg p-4 mb-6">
      <div className="flex flex-wrap gap-2 justify-center">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              pathname === item.href
                ? "bg-primary text-white shadow-lg"
                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
            }`}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}


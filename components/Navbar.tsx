"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Coffee, ShoppingCart, Utensils, History, LayoutDashboard, Clock } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      name: "Kasir (POS)",
      href: "/",
      icon: ShoppingCart,
    },
    {
      name: "Kelola Menu",
      href: "/menu",
      icon: Utensils,
    },
    {
      name: "Riwayat",
      href: "/riwayat",
      icon: History,
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
  ];

  return (
    <header className="sticky top-0 z-40 glass-header text-stone-100 border-b border-amber-950/60 shadow-lg no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Coffee Badge */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-amber-100 shadow-md group-hover:scale-105 group-hover:from-amber-500 group-hover:to-amber-700 transition-all duration-300 border border-amber-500/30">
              <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-stone-100 leading-none block">
                KASIR
              </span>
              <span className="text-[11px] text-stone-400 tracking-wide font-medium block mt-0.5">
                Coffee Shop
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center bg-stone-900/60 p-1.5 rounded-2xl border border-stone-800/80 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 relative ${
                    isActive
                      ? "bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-md shadow-amber-950/40 border border-amber-600/40"
                      : "text-stone-300 hover:text-stone-100 hover:bg-stone-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-amber-300" : "text-stone-400"}`} />
                  <span className="hidden md:inline">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Clock */}
          <div className="hidden lg:flex items-center gap-3">
            {currentTime && (
              <div className="flex items-center gap-1.5 text-xs text-stone-300 font-mono bg-stone-900/80 px-3 py-1.5 rounded-xl border border-stone-800">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentTime}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

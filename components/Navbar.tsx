"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Coffee,
  ShoppingCart,
  Utensils,
  History,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Tag,
  Users,
  Settings,
  Package
} from "lucide-react";
import { getCurrentUserAction, logoutAction } from "@/app/actions/authActions";

export interface NavbarUser {
  id: number;
  nama: string;
  username: string;
  role: "karyawan" | "admin" | "super_admin";
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<NavbarUser | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Fetch session user on mount and pathname change
    const fetchUser = async () => {
      const sessionUser = await getCurrentUserAction();
      setUser(sessionUser);
    };
    fetchUser();
  }, [pathname]);

  // Don't render Navbar on login page
  if (pathname === "/login") return null;

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      setUser(null);
      router.push("/login");
      router.refresh();
    });
  };

  // Role-based Navigation Links
  const allNavItems = [
    {
      name: "Kasir (POS)",
      href: "/",
      icon: ShoppingCart,
      roles: ["karyawan", "admin", "super_admin"],
    },
    {
      name: "Kelola Menu",
      href: "/menu",
      icon: Utensils,
      roles: ["admin", "super_admin"],
    },
    {
      name: "Stok & Resep",
      href: "/stok",
      icon: Package,
      roles: ["admin", "super_admin"],
    },
    {
      name: "Promo & Diskon",
      href: "/promo",
      icon: Tag,
      roles: ["admin", "super_admin"],
    },
    {
      name: "Riwayat",
      href: "/riwayat",
      icon: History,
      roles: ["karyawan", "admin", "super_admin"],
    },
    {
      name: "Kelola Akun",
      href: "/users",
      icon: Users,
      roles: ["admin", "super_admin"],
    },
    {
      name: "Pengaturan & Audit",
      href: "/pengaturan",
      icon: Settings,
      roles: ["super_admin"],
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "super_admin"],
    },
  ];

  const currentRole = user?.role || "karyawan";
  const navItems = allNavItems.filter((item) => item.roles.includes(currentRole));

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "super_admin":
        return { label: "Super Admin", color: "bg-purple-950/80 text-purple-300 border-purple-800/80" };
      case "admin":
        return { label: "Admin Store", color: "bg-emerald-950/80 text-emerald-300 border-emerald-800/80" };
      default:
        return { label: "Kasir / Karyawan", color: "bg-amber-950/80 text-amber-300 border-amber-800/80" };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-50 bg-stone-950/95 backdrop-blur-md text-stone-100 border-b border-stone-800/80 shadow-xl no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Brand Logo */}
          <Link href="/" prefetch={true} className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-amber-100 shadow-md group-hover:scale-105 group-hover:from-amber-500 group-hover:to-amber-700 transition-all duration-300 border border-amber-500/30">
              <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="hidden xs:block">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-stone-100 leading-none block">
                KASIR
              </span>
              <span className="text-[10px] sm:text-[11px] text-amber-400 font-serif italic block mt-0.5">
                Coffee Shop
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center bg-stone-900/90 p-1 sm:p-1.5 rounded-2xl border border-stone-800 shadow-inner overflow-x-auto max-w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/40 border border-amber-500/40"
                      : "text-stone-300 hover:text-stone-100 hover:bg-stone-800/80"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? "text-amber-200" : "text-stone-400"}`} />
                  <span className="inline">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Badge & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user && (
              <div className="flex items-center gap-2 bg-stone-900/90 p-1.5 sm:p-2 rounded-2xl border border-stone-800 shadow-sm">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-900/60 text-amber-300 flex items-center justify-center border border-amber-700/40 font-bold text-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="hidden md:block text-left pr-1">
                  <div className="text-xs font-bold text-stone-100 leading-tight">
                    {user.nama}
                  </div>
                  <span
                    className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isPending}
                  title="Keluar / Logout"
                  className="p-1.5 sm:p-2 text-stone-400 hover:text-red-400 hover:bg-red-950/40 rounded-xl transition-all border border-transparent hover:border-red-900/50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

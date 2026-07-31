"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/authActions";
import { Coffee, Lock, User as UserIcon, LogIn, Sparkles, ShieldCheck, UserCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim() || !password) {
      setErrorMsg("Username dan password wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await loginAction({ username, password });
      if (res.success) {
        router.push("/");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Gagal melakukan login");
      }
    });
  };

  const fillDemoAccount = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 px-4 py-8 relative overflow-hidden selection:bg-amber-500 selection:text-stone-950">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-800/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-800 text-stone-950 shadow-xl shadow-amber-950/50 border border-amber-400/30">
            <Coffee className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
              KASIR <span className="text-amber-500 font-serif italic">Coffee Shop</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 font-medium mt-1">
              Sistem Kasir & Point of Sale Terintegrasi
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-amber-500" />
              Masuk Akun Kasir
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Silakan masukkan kredensial untuk mengakses sistem POS.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-950/60 border border-red-800/60 rounded-2xl text-red-200 text-xs font-semibold animate-in fade-in duration-200">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-stone-950 font-extrabold text-sm rounded-xl transition-all duration-300 shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses Login...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Aplikasi</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Badges */}
          <div className="pt-2 border-t border-stone-800/80 space-y-2">
            <p className="text-[11px] font-bold text-stone-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Demo Quick Login (Klik untuk mengisi):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount("budi", "kasir123")}
                className="px-2 py-1.5 bg-stone-800/80 hover:bg-amber-900/40 border border-stone-700/60 rounded-xl text-[11px] font-bold text-amber-200 text-left transition-all flex flex-col cursor-pointer"
              >
                <span className="flex items-center gap-1 text-amber-400">
                  <UserCheck className="w-3 h-3" /> Kasir
                </span>
                <span className="text-stone-400 font-mono text-[10px]">budi</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount("admin", "admin123")}
                className="px-2 py-1.5 bg-stone-800/80 hover:bg-amber-900/40 border border-stone-700/60 rounded-xl text-[11px] font-bold text-emerald-200 text-left transition-all flex flex-col cursor-pointer"
              >
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
                <span className="text-stone-400 font-mono text-[10px]">admin</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount("superadmin", "admin123")}
                className="px-2 py-1.5 bg-stone-800/80 hover:bg-amber-900/40 border border-stone-700/60 rounded-xl text-[11px] font-bold text-purple-200 text-left transition-all flex flex-col cursor-pointer"
              >
                <span className="flex items-center gap-1 text-purple-400">
                  <Sparkles className="w-3 h-3" /> Super Admin
                </span>
                <span className="text-stone-400 font-mono text-[10px]">superadmin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

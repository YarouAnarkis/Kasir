"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/authActions";
import { Coffee, Lock, User as UserIcon, LogIn } from "lucide-react";

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

  return (
    <div className="fixed inset-0 min-h-screen w-full flex items-center justify-center bg-stone-950 px-4 py-8 overflow-y-auto selection:bg-amber-500 selection:text-stone-950 font-sans z-50">
      {/* Background Image with Dark Vignette Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&q=80"
          alt="Coffee Shop Ambience"
          className="w-full h-full object-cover opacity-35 filter brightness-75 contrast-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-stone-950/60" />
      </div>

      {/* Ambient Lighting Glow Effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-amber-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-900/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10 my-auto">
        {/* Branding Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-700 to-amber-900 text-stone-950 shadow-2xl shadow-amber-950/80 border border-amber-400/40">
            <Coffee className="w-9 h-9 sm:w-11 sm:h-11" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-100 tracking-tight">
              KASIR <span className="text-amber-500 font-serif italic">Coffee Shop</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 font-medium mt-1">
              Sistem Point of Sale & Manajemen Terpadu
            </p>
          </div>
        </div>

        {/* Login Card Glassmorphism */}
        <div className="bg-stone-900/85 border border-stone-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-amber-500" />
              Masuk Akun Kasir
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Masukkan kredensial akun untuk memulai transaksi.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-950/80 border border-red-800/80 rounded-2xl text-red-200 text-xs font-semibold animate-in fade-in duration-200">
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
                  className="w-full pl-10 pr-4 py-3 bg-stone-950/80 border border-stone-800 rounded-xl text-stone-100 text-sm placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
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
                  className="w-full pl-10 pr-4 py-3 bg-stone-950/80 border border-stone-800 rounded-xl text-stone-100 text-sm placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-extrabold text-sm rounded-xl transition-all duration-300 shadow-xl shadow-amber-950/60 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
        </div>
      </div>
    </div>
  );
}

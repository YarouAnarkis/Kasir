"use client";

import { useState, useTransition } from "react";
import {
  Users,
  UserPlus,
  Search,
  Award,
  Phone,
  Mail,
  Trash2,
  Edit,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  History,
  Send
} from "lucide-react";
import {
  createMemberAction,
  updateMemberAction,
  deleteMemberAction,
  getMemberListAction,
} from "@/app/actions/memberActions";

export interface MemberItem {
  id: number;
  nama: string;
  nomorHp: string;
  email?: string | null;
  poin: number;
  tipeMember: string;
  createdAt: Date | string;
  _count?: {
    transaksiList: number;
  };
}

interface MemberManagementProps {
  initialMembers: MemberItem[];
  userRole?: string;
}

export default function MemberManagement({
  initialMembers,
  userRole = "karyawan",
}: MemberManagementProps) {
  const [members, setMembers] = useState<MemberItem[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberItem | null>(null);
  const [inputNama, setInputNama] = useState("");
  const [inputHp, setInputHp] = useState("");
  const [inputEmail, setInputEmail] = useState("");

  // Feedback State
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isAdminOrSuper = userRole === "admin" || userRole === "super_admin";

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    startTransition(async () => {
      const res = await getMemberListAction(q);
      if (res.success && res.data) {
        setMembers(res.data as MemberItem[]);
      }
    });
  };

  const openAddModal = () => {
    setEditingMember(null);
    setInputNama("");
    setInputHp("");
    setInputEmail("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (m: MemberItem) => {
    setEditingMember(m);
    setInputNama(m.nama);
    setInputHp(m.nomorHp);
    setInputEmail(m.email || "");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!inputNama.trim()) {
      setErrorMsg("Nama member wajib diisi!");
      return;
    }

    if (!inputHp.trim()) {
      setErrorMsg("Nomor HP / WhatsApp wajib diisi!");
      return;
    }

    startTransition(async () => {
      let res;
      if (editingMember) {
        res = await updateMemberAction(editingMember.id, {
          nama: inputNama,
          nomorHp: inputHp,
          email: inputEmail,
        });
      } else {
        res = await createMemberAction({
          nama: inputNama,
          nomorHp: inputHp,
          email: inputEmail,
        });
      }

      if (res.success) {
        setSuccessMsg(editingMember ? "Data member berhasil diperbarui!" : "Member baru berhasil terdaftar!");
        setIsModalOpen(false);
        setTimeout(() => setSuccessMsg(""), 4000);
        // Refresh list
        const updatedList = await getMemberListAction(searchQuery);
        if (updatedList.success && updatedList.data) {
          setMembers(updatedList.data as MemberItem[]);
        }
      } else {
        setErrorMsg(res.error || "Gagal menyimpan data member");
      }
    });
  };

  const handleDelete = (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus member ${nama}?`)) return;

    startTransition(async () => {
      const res = await deleteMemberAction(id);
      if (res.success) {
        setSuccessMsg(`Member ${nama} telah dihapus!`);
        setTimeout(() => setSuccessMsg(""), 4000);
        setMembers((prev) => prev.filter((m) => m.id !== id));
      } else {
        alert(res.error || "Gagal menghapus member");
      }
    });
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case "PLATINUM":
        return { label: "PLATINUM", badge: "💎 PLATINUM", style: "bg-cyan-100 text-cyan-900 border-cyan-300 font-extrabold" };
      case "GOLD":
        return { label: "GOLD", badge: "🥇 GOLD", style: "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" };
      case "SILVER":
        return { label: "SILVER", badge: "🥈 SILVER", style: "bg-slate-200 text-slate-900 border-slate-300 font-bold" };
      default:
        return { label: "BRONZE", badge: "🏆 BRONZE", style: "bg-orange-100 text-orange-900 border-orange-300 font-bold" };
    }
  };

  const totalPoints = members.reduce((acc, m) => acc + m.poin, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-900/40 coffee-card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/30 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-stone-100">
              Kelola Member Pelanggan
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
            Sistem loyalitas pelanggan: kumpulkan poin tiap transaksi (Rp 10.000 = 1 Poin), tingkatkan tier member (Bronze, Silver, Gold, Platinum), & kirim struk belanja ke WhatsApp!
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-5 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-950/40 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] border border-amber-500/40 shrink-0"
        >
          <UserPlus className="w-4 h-4 text-amber-200" />
          <span>Daftar Member Baru</span>
        </button>
      </div>

      {/* Alert Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm coffee-card-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-stone-500 font-bold uppercase tracking-wider">Total Member</div>
            <div className="text-2xl font-black text-stone-900">{members.length} Orang</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm coffee-card-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-stone-500 font-bold uppercase tracking-wider">Total Poin Aktif</div>
            <div className="text-2xl font-black text-emerald-700">{totalPoints.toLocaleString("id-ID")} Poin</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm coffee-card-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-900 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-stone-500 font-bold uppercase tracking-wider">Member Premium</div>
            <div className="text-2xl font-black text-cyan-900">
              {members.filter((m) => m.tipeMember === "GOLD" || m.tipeMember === "PLATINUM").length} Orang
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm coffee-card-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-stone-500 font-bold uppercase tracking-wider">Rasio Poin / Rp</div>
            <div className="text-xs font-bold text-purple-950 mt-1">1 Poin = Rp 10.000</div>
          </div>
        </div>
      </div>

      {/* Filter & Table Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-stone-200 space-y-4 coffee-card-shadow">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Cari member berdasarkan nama, No HP, atau email..."
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl text-xs sm:text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-600"
          />
        </div>

        {/* Member Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.length === 0 ? (
            <div className="col-span-full py-12 text-center text-stone-400 space-y-2">
              <Users className="w-12 h-12 mx-auto stroke-[1.2] text-stone-300" />
              <p className="font-extrabold text-stone-600">Belum ada data member terdaftar</p>
              <p className="text-xs text-stone-400">Klik "Daftar Member Baru" untuk menambah pelanggan.</p>
            </div>
          ) : (
            members.map((m) => {
              const tierInfo = getTierInfo(m.tipeMember);
              const formattedHp = m.nomorHp.startsWith("0") ? `62${m.nomorHp.slice(1)}` : m.nomorHp;

              return (
                <div
                  key={m.id}
                  className="bg-stone-50/70 rounded-3xl p-5 border border-stone-200 space-y-3 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between coffee-card-hover"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
                          <span>{m.nama}</span>
                        </h3>
                        <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span>{m.nomorHp}</span>
                        </div>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${tierInfo.style}`}>
                        {tierInfo.badge}
                      </span>
                    </div>

                    {m.email && (
                      <div className="text-xs text-stone-500 flex items-center gap-1.5 truncate font-sans">
                        <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{m.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-stone-400 font-bold uppercase">Total Poin</div>
                      <div className="text-lg font-black text-amber-950 flex items-center gap-1">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span>{m.poin} Poin</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://api.whatsapp.com/send?phone=${formattedHp}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Chat WA Pelanggan"
                        className="p-2 rounded-xl bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </a>

                      {isAdminOrSuper && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditModal(m)}
                            title="Edit Member"
                            className="p-2 rounded-xl bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(m.id, m.nama)}
                            title="Hapus Member"
                            className="p-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 to-amber-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base">
                  {editingMember ? "Edit Data Member" : "Registrasi Member Baru"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Nama Lengkap Pelanggan</label>
                <input
                  type="text"
                  value={inputNama}
                  onChange={(e) => setInputNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">No. HP / WhatsApp Active</label>
                <input
                  type="text"
                  value={inputHp}
                  onChange={(e) => setInputHp(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-600 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Alamat Email (Opsional)</label>
                <input
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="Contoh: budi@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : editingMember ? "Simpan Perubahan" : "Daftarkan Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

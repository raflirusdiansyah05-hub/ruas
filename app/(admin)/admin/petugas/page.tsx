"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  Mail,
  MapPin,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  ShieldCheck,
} from "lucide-react";

interface PetugasProfile {
  id: string;
  full_name: string;
  email?: string | null;
  phone: string | null;
  wilayah: string | null;
  status?: string;
  created_at: string;
}

export default function ManajemenPetugasPage() {
  const [petugasList, setPetugasList] = useState<PetugasProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Form Invite Petugas State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [wilayah, setWilayah] = useState("");
  const [inviting, setInviting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchPetugas = async () => {
    try {
      const res = await fetch("/api/petugas/invite");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal memuat petugas");
      }
      setPetugasList(json.data?.petugas || []);
    } catch (err: any) {
      console.error("Gagal memuat petugas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetugas();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!fullName.trim() || !email.trim() || !wilayah.trim()) {
      setFeedback({
        type: "error",
        message: "Nama lengkap, email, dan wilayah tugas wajib diisi.",
      });
      return;
    }

    try {
      setInviting(true);
      const res = await fetch("/api/petugas/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          wilayah: wilayah.trim(),
        }),
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch (parseErr) {
        console.error("Gagal parse JSON invite response:", parseErr);
      }

      if (!res.ok || json?.success === false) {
        let errorMsg = json?.error?.message;
        const errorCode = json?.error?.code;

        if (
          res.status === 429 ||
          errorCode === "RATE_LIMIT_EXCEEDED" ||
          errorMsg?.toLowerCase().includes("rate limit")
        ) {
          errorMsg =
            "Undangan belum dapat dikirim saat ini karena batas pengiriman email sementara telah tercapai. Silakan coba lagi beberapa saat kemudian.";
        } else if (
          res.status === 409 ||
          errorCode === "EMAIL_ALREADY_EXISTS" ||
          errorMsg?.toLowerCase().includes("already registered") ||
          errorMsg?.toLowerCase().includes("already been registered")
        ) {
          errorMsg =
            "Alamat email ini sudah terdaftar di sistem RUAS. Silakan gunakan alamat email lain.";
        } else if (!errorMsg) {
          errorMsg = "Gagal memproses undangan petugas. Silakan periksa kembali data email atau coba beberapa saat lagi.";
        }
        throw new Error(errorMsg);
      }

      setFeedback({
        type: "success",
        message: `Undangan aktivasi akun berhasil dikirim ke ${email}. Petugas dapat mengatur password via tautan email.`,
      });

      // Reset form
      setFullName("");
      setEmail("");
      setWilayah("");

      // Refresh data
      await fetchPetugas();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Terjadi kesalahan saat mengundang petugas.",
      });
    } finally {
      setInviting(false);
    }
  };

  const filteredPetugas = petugasList.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      (p.phone && p.phone.toLowerCase().includes(q)) ||
      (p.wilayah && p.wilayah.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-border/80 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
          Manajemen Petugas Lapangan
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
          Kelola data penugasan personel lapangan dan kirim undangan akun baru via email dinas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Kolom Kiri: Form Undang Petugas (Desktop 1 Col) */}
        <Card className="lg:col-span-1 border-border shadow-card bg-base">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Undang Petugas Baru
            </CardTitle>
            <CardDescription className="text-xs">
              Sistem akan mengirimkan email aktivasi resmi berisi tautan aman untuk menetapkan password pertama.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feedback && (
              <div
                className={`p-3.5 mb-4 rounded-xl text-xs flex items-start gap-2.5 ${
                  feedback.type === "success"
                    ? "bg-feedback-success/10 text-feedback-success border border-feedback-success/20"
                    : "bg-feedback-error/10 text-feedback-error border border-feedback-error/20"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1.5">
                  Nama Lengkap Petugas <span className="text-feedback-error">*</span>
                </label>
                <Input
                  placeholder="Misal: Joko Widodo, S.T."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={inviting}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1.5">
                  Alamat Email Petugas <span className="text-feedback-error">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="petugas@binamarga.go.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={inviting}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1.5">
                  Wilayah / Posko Tugas <span className="text-feedback-error">*</span>
                </label>
                <Input
                  placeholder="Misal: Jakarta Timur - Sektor 2"
                  value={wilayah}
                  onChange={(e) => setWilayah(e.target.value)}
                  disabled={inviting}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={inviting}
              >
                {inviting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Mengirim Undangan...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Kirim Undangan Aktivasi
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Kolom Kanan: Tabel / List Petugas Aktif (Desktop 2 Col) */}
        <Card className="lg:col-span-2 border-border shadow-card bg-base">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Daftar Petugas Aktif
              </CardTitle>
              <CardDescription className="text-xs">
                Total {petugasList.length} personil lapangan terdaftar di instansi Anda.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                placeholder="Cari nama atau wilayah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-text-secondary flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-xs font-medium">Memuat data personil petugas...</p>
              </div>
            ) : filteredPetugas.length === 0 ? (
              <div className="p-12 text-center text-text-secondary">
                <Users className="h-10 w-10 text-border mx-auto mb-3" />
                <p className="text-sm font-semibold text-text-primary">
                  {searchQuery ? "Tidak ada petugas yang cocok" : "Belum ada personil petugas"}
                </p>
                <p className="text-xs mt-1">
                  {searchQuery
                    ? "Coba gunakan kata kunci pencarian yang lain."
                    : "Gunakan formulir di sebelah kiri untuk mengundang petugas pertama."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface border-y border-border text-text-secondary font-medium">
                      <tr>
                        <th className="py-3 px-4">Nama Petugas</th>
                        <th className="py-3 px-4">Kontak Telepon</th>
                        <th className="py-3 px-4">Wilayah Operasional</th>
                        <th className="py-3 px-4">Tanggal Bergabung</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPetugas.map((petugas) => (
                        <tr key={petugas.id} className="hover:bg-surface/50 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-text-primary">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary-soft text-primary font-bold flex items-center justify-center text-[10px] shrink-0">
                                {petugas.full_name.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate max-w-[180px]">{petugas.full_name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-text-secondary">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                              <span className="truncate max-w-[180px]">{petugas.email || petugas.phone || "Email diundang"}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-text-secondary">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate max-w-[160px]">
                                {petugas.wilayah || "Belum ditentukan"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-text-secondary">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <span>
                                {new Date(petugas.created_at).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Badge
                              variant="outline"
                              className={
                                petugas.status === "pending"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                              }
                            >
                              {petugas.status === "pending" ? "Menunggu Aktivasi" : "Aktif"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-border">
                  {filteredPetugas.map((petugas) => (
                    <div key={petugas.id} className="p-4 space-y-2">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="h-9 w-9 rounded-full bg-primary-soft text-primary font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                          {petugas.full_name.charAt(0).toUpperCase()}
                        </div>

                        {/* Content Right */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Nama + Status */}
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-text-primary leading-tight break-words">
                              {petugas.full_name}
                            </p>
                            <Badge
                              variant="outline"
                              className={`shrink-0 text-[10px] px-2 py-0.5 font-medium ${
                                petugas.status === "pending"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {petugas.status === "pending" ? "Menunggu Aktivasi" : "Aktif"}
                            </Badge>
                          </div>

                          {/* Email */}
                          <p className="text-xs text-text-secondary truncate">
                            {petugas.email || petugas.phone || "Email diundang"}
                          </p>

                          {/* Wilayah & Tanggal */}
                          <div className="pt-1 space-y-1 text-xs text-text-secondary">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate">{petugas.wilayah || "Belum ditentukan"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Calendar className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                              <span className="truncate">
                                Terdaftar{" "}
                                {new Date(petugas.created_at).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

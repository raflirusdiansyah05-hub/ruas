"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function ProfilPetugasPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [wilayah, setWilayah] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Ganti Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/petugas/profile");
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error?.message || "Profil belum dapat dimuat. Silakan coba lagi.");
        }

        const profile = json.data?.profile;
        if (profile) {
          setFullName(profile.full_name || "");
          setEmail(profile.email || "");
          setPhone(profile.phone || "");
          setWilayah(profile.wilayah || "");
        }
      } catch (err: any) {
        console.error("Gagal memuat profil petugas:", err);
        setFeedback({
          type: "error",
          message: "Profil belum dapat dimuat dari server. Silakan muat ulang halaman.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/petugas/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Perubahan profil belum berhasil disimpan. Silakan coba lagi.");
      }

      const updated = json.data?.profile;
      if (updated) {
        setFullName(updated.full_name || "");
        setPhone(updated.phone || "");
      }

      setFeedback({
        type: "success",
        message: "Data profil berhasil diperbarui.",
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Perubahan profil belum berhasil disimpan. Silakan coba lagi.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 8) {
      setPasswordFeedback({
        type: "error",
        message: "Password minimal 8 karakter.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        message: "Konfirmasi kata sandi tidak cocok.",
      });
      return;
    }

    try {
      setUpdatingPassword(true);
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordFeedback({
        type: "success",
        message: "Kata sandi akun petugas berhasil diperbarui.",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordFeedback({
        type: "error",
        message: err.message || "Gagal memperbarui kata sandi.",
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-text-secondary">
        <Loader2 className="h-7 w-7 animate-spin text-primary mb-2" />
        <p className="text-xs font-medium">Memuat profil personil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Profil */}
      <div className="bg-base border border-border rounded-2xl p-5 shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary-soft text-primary font-bold flex items-center justify-center text-base shrink-0">
            {fullName.charAt(0).toUpperCase() || "P"}
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">{fullName || "Petugas Lapangan"}</h1>
            <p className="text-xs text-text-secondary">{email}</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-accent-soft text-accent border-accent/20 text-xs">
          Personil Aktif
        </Badge>
      </div>

      {/* Form Data Diri */}
      <Card className="border-border shadow-card bg-base">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Informasi Pribadi & Penugasan
          </CardTitle>
          <CardDescription className="text-xs">
            Data kontak dan wilayah operasional penugasan lapangan.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
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

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={saving}
                  placeholder="Nama lengkap petugas"
                  className="text-xs pl-9"
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/60">
                  <User className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Alamat Email (Akun)
              </label>
              <div className="relative">
                <Input
                  value={email}
                  disabled
                  className="bg-surface text-text-secondary cursor-not-allowed text-xs pl-9"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/60">
                  <Mail className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <div className="relative">
                <Input
                  type="tel"
                  placeholder="Misal: 081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={saving}
                  className="text-xs pl-9"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/60">
                  <Phone className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Wilayah Tugas / Posko
              </label>
              <div className="relative">
                <Input
                  value={wilayah || "Belum ditentukan oleh Admin"}
                  disabled
                  className="bg-surface text-text-secondary cursor-not-allowed text-xs pl-9"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/60">
                  <MapPin className="h-4 w-4" />
                </div>
              </div>
              <span className="text-[10px] text-text-secondary mt-1 block">
                Penetapan wilayah operasional dikelola langsung oleh Admin Dinas.
              </span>
            </div>

            <Button type="submit" disabled={saving} className="w-full text-xs font-semibold mt-2">
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Menyimpan Profil...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Simpan Perubahan Profil
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Form Ganti Password */}
      <Card className="border-border shadow-card bg-base">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Keamanan Sandi Akun
          </CardTitle>
          <CardDescription className="text-xs">
            Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan data dinas.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {passwordFeedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                passwordFeedback.type === "success"
                  ? "bg-feedback-success/10 text-feedback-success border border-feedback-success/20"
                  : "bg-feedback-error/10 text-feedback-error border border-feedback-error/20"
              }`}
            >
              {passwordFeedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <span>{passwordFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={updatingPassword}
                  className="text-xs pl-9"
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/60">
                  <Lock className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={updatingPassword}
                  className="text-xs pl-9"
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/60">
                  <Lock className="h-4 w-4" />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="outline"
              disabled={updatingPassword || !newPassword}
              className="w-full text-xs font-semibold mt-2"
            >
              {updatingPassword ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Memperbarui Sandi...
                </>
              ) : (
                "Perbarui Kata Sandi"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

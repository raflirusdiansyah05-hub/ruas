"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";

export default function PengaturanAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<{
    id: string;
    email: string;
    full_name: string;
    nip: string | null;
    instansi: string | null;
    role: string;
  } | null>(null);

  const [fullName, setFullName] = useState("");
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
    const fetchAdminProfile = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("id, full_name, nip, instansi, role")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (profileData) {
          setProfile({
            ...profileData,
            email: user.email || "",
          });
          setFullName(profileData.full_name || "");
        }
      } catch (err: any) {
        console.error("Gagal memuat profil admin:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setFeedback(null);

    if (!fullName.trim()) {
      setFeedback({
        type: "error",
        message: "Nama lengkap tidak boleh kosong.",
      });
      return;
    }

    try {
      setSaving(true);
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", profile.id);

      if (error) throw error;

      setFeedback({
        type: "success",
        message: "Informasi nama admin berhasil diperbarui.",
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Gagal memperbarui profil.",
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
        message: "Password baru minimal 8 karakter.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        message: "Konfirmasi password tidak cocok.",
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
        message: "Password akun dinas berhasil diperbarui.",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordFeedback({
        type: "error",
        message: err.message || "Gagal memperbarui password.",
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center text-text-secondary">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-xs font-medium">Memuat konfigurasi admin...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
          Pengaturan Akun & Instansi
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Kelola profil penanggung jawab dinas, kredensial akses, dan informasi instansi resmi.
        </p>
      </div>

      <div className="space-y-6">
        {/* Kartu 1: Info Instansi & Profil */}
        <Card className="border-border shadow-card bg-base">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between items-start gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Identitas Instansi Pemerintahan</span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Informasi resmi instansi dan verifikasi ASN yang terhubung dengan akun Anda.
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary-soft text-primary border-primary/20 text-xs shrink-0 self-start sm:self-auto font-medium">
                Admin Terverifikasi
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {feedback && (
              <div
                className={`p-3.5 mb-5 rounded-xl text-xs flex items-start gap-2.5 ${
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

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1.5">
                    Nama Instansi Dinas
                  </label>
                  <Input
                    value={profile?.instansi || "Dinas Bina Marga"}
                    disabled
                    className="bg-surface text-text-secondary cursor-not-allowed text-xs"
                  />
                  <span className="text-[10px] text-text-secondary mt-1 block">
                    Diatur sesuai master data instansi referensi.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1.5">
                    Nomor Induk Pegawai (NIP)
                  </label>
                  <Input
                    value={profile?.nip || "-"}
                    disabled
                    className="bg-surface text-text-secondary cursor-not-allowed text-xs"
                  />
                  <span className="text-[10px] text-text-secondary mt-1 block">
                    NIP 18 digit resmi ASN terdaftar.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1.5">
                    Alamat Email Kedinasan
                  </label>
                  <Input
                    value={profile?.email || "-"}
                    disabled
                    className="bg-surface text-text-secondary cursor-not-allowed text-xs"
                  />
                  <span className="text-[10px] text-text-secondary mt-1 block">
                    Email untuk notifikasi laporan sistem.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1.5">
                    Nama Penanggung Jawab Akun <span className="text-feedback-error">*</span>
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={saving}
                    className="text-xs"
                    required
                  />
                  <span className="text-[10px] text-text-secondary mt-1 block">
                    Nama pejabat/petugas administrator yang bertugas.
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving} className="text-xs">
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Kartu 2: Ganti Password */}
        <Card className="border-border shadow-card bg-base">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Keamanan & Password Akun
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Gunakan kata sandi yang kuat dengan kombinasi huruf, angka, dan karakter khusus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {passwordFeedback && (
              <div
                className={`p-3.5 mb-5 rounded-xl text-xs flex items-start gap-2.5 ${
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1.5">
                    Password Baru
                  </label>
                  <Input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={updatingPassword}
                    className="text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1.5">
                    Konfirmasi Password Baru
                  </label>
                  <Input
                    type="password"
                    placeholder="Ulangi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={updatingPassword}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={updatingPassword || !newPassword}
                  variant="outline"
                  className="text-xs"
                >
                  {updatingPassword ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Memperbarui...
                    </>
                  ) : (
                    "Perbarui Password"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

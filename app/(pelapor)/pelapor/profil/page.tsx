"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function ProfilPelaporPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nik, setNik] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Password update state
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
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setEmail(user.email || "");
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone, nik")
            .eq("id", user.id)
            .single();

          const nameFromData =
            profile?.full_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "";
          const phoneFromData =
            profile?.phone ||
            user.user_metadata?.phone ||
            user.user_metadata?.phone_number ||
            "";
          const nikFromData =
            profile?.nik ||
            user.user_metadata?.nik ||
            "";

          setFullName(nameFromData);
          setPhone(phoneFromData);
          setNik(nikFromData);
        }
      } catch (err: any) {
        console.error("Gagal memuat profil pelapor:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            nik: nik.trim() || null,
          })
          .eq("id", user.id);

        if (error) throw error;

        setFeedback({
          type: "success",
          message: "Data profil berhasil diperbarui.",
        });
      }
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
        message: "Kata sandi baru minimal 8 karakter.",
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
        message: "Kata sandi berhasil diperbarui.",
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
      <div className="min-h-screen bg-surface py-12 flex flex-col items-center justify-center text-text-secondary">
        <Loader2 className="h-7 w-7 animate-spin text-primary mb-2" />
        <p className="text-xs font-medium">Memuat profil pengguna...</p>
      </div>
    );
  }

  const initialLetter = (fullName || email || "P").charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Identity Overview Header Card */}
        <div className="bg-base border border-border rounded-2xl p-5 shadow-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-12 w-12 rounded-full bg-primary-soft text-primary font-bold flex items-center justify-center text-base shrink-0 shadow-sm">
              {initialLetter}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-text-primary truncate">
                {fullName || "Pelapor Warga"}
              </h2>
              <p className="text-xs text-text-secondary truncate mt-0.5">{email}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary-soft text-primary border-primary/20 text-xs shrink-0 font-medium">
            Warga Aktif
          </Badge>
        </div>

        {/* Form Informasi Pribadi */}
        <Card className="border-border shadow-card bg-base">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-text-primary">
              <User className="h-4 w-4 text-primary" />
              Informasi Pribadi & Kontak
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary">
              Perbarui identitas, kontak WhatsApp, dan Nomor Induk Kependudukan (NIK).
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

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1.5">
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
                <span className="text-[10px] text-text-secondary mt-1 block">
                  Email akun login bersifat permanen dan tidak dapat diubah.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={saving}
                    placeholder="Nama lengkap sesuai KTP"
                    className="text-xs pl-9"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/60">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1.5">
                  Nomor Induk Kependudukan (NIK)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                    disabled={saving}
                    placeholder="16 digit NIK (misal: 3201123456780001)"
                    className="text-xs pl-9"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/60">
                    <CreditCard className="h-4 w-4" />
                  </div>
                </div>
                <span className="text-[10px] text-text-secondary mt-1 block">
                  Digunakan untuk validasi laporan infrastruktur jalan warga.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1.5">
                  Nomor Telepon / WhatsApp
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={saving}
                    placeholder="Misal: 081234567890"
                    className="text-xs pl-9"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/60">
                    <Phone className="h-4 w-4" />
                  </div>
                </div>
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

        {/* Form Perbarui Kata Sandi */}
        <Card className="border-border shadow-card bg-base">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-text-primary">
              <Lock className="h-4 w-4 text-primary" />
              Keamanan Sandi Akun
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary">
              Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan data.
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
                <label className="text-xs font-semibold text-text-primary block mb-1.5">
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
                <label className="text-xs font-semibold text-text-primary block mb-1.5">
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

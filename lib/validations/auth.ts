import { z } from "zod";

export const verifyNipSchema = z.object({
  nip: z
    .string()
    .min(18, "NIP minimal harus 18 karakter")
    .max(18, "NIP maksimal harus 18 karakter"),
  instansi: z
    .string()
    .min(3, "Nama instansi minimal 3 karakter"),
});

export const signUpSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  full_name: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  role: z.enum(["pelapor", "admin", "petugas"]),
  phone: z.string().optional(),
  nip: z.string().optional(),
  instansi: z.string().optional(),
  wilayah: z.string().optional(),
});

export const invitePetugasSchema = z.object({
  full_name: z.string().min(2, "Nama petugas minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  wilayah: z.string().min(2, "Wilayah kerja minimal 2 karakter"),
});

export const setPasswordSchema = z.object({
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

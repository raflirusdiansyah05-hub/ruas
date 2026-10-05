import { z } from "zod";

export const updateAssignmentStatusSchema = z.object({
  status: z.enum(["dikerjakan", "selesai"], {
    errorMap: () => ({ message: "Status harus 'dikerjakan' atau 'selesai'" }),
  }),
  proof_photo_url: z.string().url("URL bukti foto tidak valid").optional(),
  note: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
});

export type UpdateAssignmentStatusInput = z.infer<typeof updateAssignmentStatusSchema>;

export const updatePetugasProfileSchema = z.object({
  full_name: z
    .string({ required_error: "Nama lengkap wajib diisi" })
    .trim()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  phone: z
    .string()
    .trim()
    .max(20, "Nomor telepon maksimal 20 karakter")
    .optional()
    .nullable(),
});

export type UpdatePetugasProfileInput = z.infer<typeof updatePetugasProfileSchema>;

import { z } from "zod";

export const createReportSchema = z.object({
  photo_url: z.string().url("URL foto laporan tidak valid"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address_text: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  fungsi_jalan: z.enum(["arteri", "kolektor", "lokal", "lingkungan"], {
    required_error: "Fungsi jalan wajib dipilih",
    invalid_type_error: "Pilihan fungsi jalan tidak valid",
  }),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

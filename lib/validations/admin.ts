import { z } from "zod";

export const verifyReportSchema = z.object({
  action: z.enum(["verify", "reject"]),
  reason: z.string().optional(),
});

export const assignReportSchema = z.object({
  petugas_id: z.string().uuid("ID petugas harus berupa UUID valid"),
});

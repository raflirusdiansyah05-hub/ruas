import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { updateAssignmentStatusSchema } from "@/lib/validations/petugas";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { message: "Sesi tidak valid", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const { id: assignmentId } = params;
    const body = await request.json();
    const parseResult = updateAssignmentStatusSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            message: "Format payload status tidak valid",
            code: "VALIDATION_ERROR",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { status, proof_photo_url, note } = parseResult.data;

    const adminClient = createAdminClient();

    // 1. Ambil data assignment & pastikan petugas yang login adalah pemilik tugas
    const { data: assignment, error: fetchErr } = await adminClient
      .from("assignments")
      .select("id, report_id, petugas_id, status")
      .eq("id", assignmentId)
      .single();

    if (fetchErr || !assignment) {
      return NextResponse.json(
        { error: { message: "Data penugasan tidak ditemukan", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    if (assignment.petugas_id !== user.id) {
      return NextResponse.json(
        {
          error: {
            message: "Anda tidak memiliki wewenang untuk mengubah tugas ini",
            code: "FORBIDDEN",
          },
        },
        { status: 403 }
      );
    }

    // 2. Jika status selesai, bukti foto wajib ada
    if (status === "selesai" && !proof_photo_url) {
      return NextResponse.json(
        {
          error: {
            message: "Bukti foto perbaikan wajib diunggah sebelum menandai tugas selesai",
            code: "PROOF_PHOTO_REQUIRED",
          },
        },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    // 3. Update tabel assignments
    const updatePayload: any = {
      status,
    };
    if (status === "selesai") {
      updatePayload.completed_at = nowIso;
      updatePayload.proof_photo_url = proof_photo_url;
    }

    const { error: updateAssignErr } = await adminClient
      .from("assignments")
      .update(updatePayload)
      .eq("id", assignmentId);

    if (updateAssignErr) throw updateAssignErr;

    // 4. Update tabel reports status
    const reportStatusTo = status === "selesai" ? "selesai" : "dikerjakan";
    const { error: updateReportErr } = await adminClient
      .from("reports")
      .update({
        status: reportStatusTo,
        updated_at: nowIso,
      })
      .eq("id", assignment.report_id);

    if (updateReportErr) throw updateReportErr;

    // 5. Catat ke status_history
    await adminClient.from("status_history").insert({
      report_id: assignment.report_id,
      status_from: assignment.status,
      status_to: reportStatusTo,
      changed_by: user.id,
      note: note || (status === "selesai" ? "Pekerjaan perbaikan selesai dikerjakan petugas" : "Petugas mulai menangani perbaikan di lokasi"),
      changed_at: nowIso,
    });

    // 6. Buat notifikasi ke Pelapor
    const { data: rep } = await adminClient
      .from("reports")
      .select("reporter_id, address_text")
      .eq("id", assignment.report_id)
      .single();

    if (rep?.reporter_id) {
      if (status === "selesai") {
        await adminClient.from("notifications").insert({
          user_id: rep.reporter_id,
          title: "Perbaikan Jalan Selesai",
          message: `Laporan perbaikan jalan Anda di ${rep.address_text || "lokasi"} telah selesai ditangani oleh petugas lapangan. Anda dapat melihat foto bukti perbaikan di aplikasi.`,
          related_report_id: assignment.report_id,
        });
      } else if (status === "dikerjakan") {
        await adminClient.from("notifications").insert({
          user_id: rep.reporter_id,
          title: "Perbaikan Sedang Dikerjakan",
          message: `Tim teknis telah tiba di lokasi ${rep.address_text || ""} dan sedang melaksanakan perbaikan jalan.`,
          related_report_id: assignment.report_id,
        });
      }
    }

    return NextResponse.json({
      data: {
        success: true,
        message:
          status === "selesai"
            ? "Pekerjaan berhasil diselesaikan dan bukti foto terverifikasi"
            : "Status penugasan diperbarui menjadi 'dikerjakan'",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          message: err.message || "Gagal memperbarui status tugas",
          code: "INTERNAL_SERVER_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

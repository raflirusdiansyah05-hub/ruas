import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { invitePetugasSchema } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/petugas/invite
 * Mengambil daftar seluruh personil petugas lapangan (khusus Admin Dinas).
 * Menggunakan adminClient (service role) agar terhindar dari RLS recursion di tabel profiles.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: {
            message: "Sesi tidak valid atau telah berakhir",
            code: "UNAUTHORIZED",
          },
        },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        {
          error: {
            message: "Hanya Admin Dinas yang berwenang melihat manajemen petugas",
            code: "FORBIDDEN",
          },
        },
        { status: 403 }
      );
    }

    // Ambil seluruh personil petugas dari tabel profiles
    const { data: petugasList, error: queryError } = await adminClient
      .from("profiles")
      .select("id, full_name, phone, wilayah, status, created_at")
      .eq("role", "petugas")
      .order("created_at", { ascending: false });

    if (queryError) {
      console.error("[GET /api/petugas/invite] Query error:", queryError);
      return NextResponse.json(
        {
          error: {
            message: "Gagal memuat daftar petugas lapangan",
            code: "DATABASE_ERROR",
          },
        },
        { status: 500 }
      );
    }

    // Sambungkan alamat email dari auth.users
    const { data: authUsers } = await adminClient.auth.admin.listUsers();
    const emailMap = new Map(authUsers?.users?.map((u) => [u.id, u.email]) || []);

    const enrichedPetugas = (petugasList || []).map((p) => ({
      ...p,
      email: emailMap.get(p.id) || null,
    }));

    return NextResponse.json({
      data: {
        petugas: enrichedPetugas,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/petugas/invite] Internal error:", err?.message || err);
    return NextResponse.json(
      {
        error: {
          message: "Terjadi kesalahan internal pada server",
          code: "INTERNAL_SERVER_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/petugas/invite
 * Mengundang petugas baru via email (khusus Admin Dinas).
 * Memvalidasi input, lalu menggunakan auth.admin.inviteUserByEmail dengan redirect ke /set-password.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verifikasi otorisasi Admin yang memanggil endpoint
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Sesi tidak valid atau telah berakhir",
            code: "UNAUTHORIZED",
          },
        },
        { status: 401 }
      );
    }

    // Gunakan adminClient untuk verifikasi role agar bebas dari RLS recursion di tabel profiles
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Hanya Admin Dinas yang berwenang mengundang akun Petugas",
            code: "FORBIDDEN",
          },
        },
        { status: 403 }
      );
    }

    // 2. Validasi input
    const body = await request.json();
    const parseResult = invitePetugasSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Data petugas tidak lengkap atau tidak valid",
            code: "VALIDATION_ERROR",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { full_name, email, wilayah } = parseResult.data;
    // Sanitasi base URL agar aman dari trailing slash dan mendukung VERCEL_URL bila NEXT_PUBLIC_SITE_URL tidak diset
    const rawSiteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const siteUrl = rawSiteUrl.replace(/\/+$/, "");
    const redirectTo = `${siteUrl}/set-password`;

    // 3. Gunakan Service Role Admin Client untuk mengundang user
    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          role: "petugas",
          full_name,
          wilayah,
        },
        redirectTo,
      });

    if (inviteError) {
      console.warn("[POST /api/petugas/invite] inviteUserByEmail error:", {
        code: inviteError.code,
        status: (inviteError as any).status,
        message: inviteError.message,
      });

      // 1. Rate Limit Error
      if (
        inviteError.code === "over_email_send_rate_limit" ||
        (inviteError as any).status === 429 ||
        inviteError.message?.toLowerCase().includes("rate limit")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message:
                "Undangan belum dapat dikirim saat ini karena batas pengiriman email sementara telah tercapai. Silakan coba lagi beberapa saat kemudian.",
            },
          },
          { status: 429 }
        );
      }

      // 2. Email Already Exists Error
      if (
        inviteError.code === "email_exists" ||
        (inviteError as any).status === 422 ||
        inviteError.message?.toLowerCase().includes("already been registered") ||
        inviteError.message?.toLowerCase().includes("already registered")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "EMAIL_ALREADY_EXISTS",
              message:
                "Alamat email ini sudah terdaftar di sistem RUAS. Silakan gunakan alamat email lain.",
            },
          },
          { status: 409 }
        );
      }

      // 3. Error lainnya (fallback aman tanpa expose raw technical error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVITE_FAILED",
            message:
              "Gagal mengirimkan undangan email ke petugas. Silakan periksa kembali data email atau coba beberapa saat lagi.",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        success: true,
        message: "Undangan aktivasi akun berhasil dikirim ke email petugas",
        user_id: inviteData.user?.id,
      },
    });
  } catch (err: any) {
    console.error("[POST /api/petugas/invite] Internal error:", err?.message || err);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Terjadi kesalahan internal pada server",
          code: "INTERNAL_SERVER_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/petugas/invite
 * Mengaktifkan profil petugas (status: pending -> active) setelah kata sandi berhasil ditetapkan di /set-password.
 */
export async function PATCH(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    let user = null;

    // 1. Cek Authorization Bearer header
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const { data: userData } = await adminClient.auth.getUser(token);
      user = userData?.user || null;
    }

    // 2. Fallback cek cookie session
    if (!user) {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      user = data?.user || null;
    }

    if (!user) {
      return NextResponse.json(
        {
          error: {
            message: "Sesi tidak valid atau telah berakhir",
            code: "UNAUTHORIZED",
          },
        },
        { status: 401 }
      );
    }

    // Pastikan user memiliki status profil petugas
    const { data: profile, error: profErr } = await adminClient
      .from("profiles")
      .select("id, role, status")
      .eq("id", user.id)
      .single();

    if (profErr || !profile) {
      return NextResponse.json(
        {
          error: {
            message: "Profil pengguna tidak ditemukan",
            code: "NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    if (profile.role !== "petugas") {
      return NextResponse.json(
        {
          error: {
            message: "Hanya akun Petugas yang dapat diaktifkan melalui endpoint ini",
            code: "FORBIDDEN",
          },
        },
        { status: 403 }
      );
    }

    // Update status menjadi active via service role
    const { error: updateErr } = await adminClient
      .from("profiles")
      .update({ status: "active" })
      .eq("id", user.id);

    if (updateErr) {
      console.error("[PATCH /api/petugas/invite] Update status error:", updateErr);
      return NextResponse.json(
        {
          error: {
            message: "Gagal memperbarui status akun menjadi aktif",
            code: "DATABASE_ERROR",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        success: true,
        message: "Akun petugas berhasil diaktifkan",
      },
    });
  } catch (err: any) {
    console.error("[PATCH /api/petugas/invite] Internal error:", err?.message || err);
    return NextResponse.json(
      {
        error: {
          message: err.message || "Terjadi kesalahan internal pada server",
          code: "INTERNAL_SERVER_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

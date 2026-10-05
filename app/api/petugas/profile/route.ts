import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { updatePetugasProfileSchema } from "@/lib/validations/petugas";

export const dynamic = "force-dynamic";

/**
 * GET /api/petugas/profile
 * Mengambil profil petugas yang sedang login secara aman via server-side client,
 * terhindar dari RLS infinite recursion pada tabel profiles.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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
    const { data: profile, error: queryError } = await adminClient
      .from("profiles")
      .select("id, full_name, phone, wilayah, role, status, created_at")
      .eq("id", user.id)
      .single();

    if (queryError || !profile) {
      return NextResponse.json(
        {
          error: {
            message: "Data profil petugas tidak ditemukan",
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
            message: "Hanya akun Petugas Lapangan yang dapat mengakses endpoint ini",
            code: "FORBIDDEN",
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      data: {
        profile: {
          id: profile.id,
          full_name: profile.full_name,
          email: user.email,
          phone: profile.phone,
          wilayah: profile.wilayah,
          role: profile.role,
          status: profile.status,
        },
      },
    });
  } catch (err: any) {
    console.error("[GET /api/petugas/profile] Internal error:", err?.message || err);
    return NextResponse.json(
      {
        error: {
          message: "Gagal memuat profil petugas. Silakan coba beberapa saat lagi.",
          code: "INTERNAL_SERVER_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/petugas/profile
 * Memperbarui data diri petugas lapangan (hanya full_name & phone).
 * Field role, status, wilayah, dan id DILARANG diubah oleh Petugas.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // 1. Verifikasi otorisasi role akun
    const { data: currentProfile, error: profileFetchErr } = await adminClient
      .from("profiles")
      .select("id, role, status")
      .eq("id", user.id)
      .single();

    if (profileFetchErr || !currentProfile) {
      return NextResponse.json(
        {
          error: {
            message: "Data profil tidak ditemukan",
            code: "NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    if (currentProfile.role !== "petugas") {
      return NextResponse.json(
        {
          error: {
            message: "Hanya akun Petugas Lapangan yang berwenang mengubah profil ini",
            code: "FORBIDDEN",
          },
        },
        { status: 403 }
      );
    }

    // 2. Validasi input
    const body = await request.json();
    const parseResult = updatePetugasProfileSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            message: "Data input tidak valid",
            code: "VALIDATION_ERROR",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { full_name, phone } = parseResult.data;

    // 3. Update HANYA field yang diizinkan (full_name & phone) pada profil milik user sendiri
    const { data: updatedProfile, error: updateError } = await adminClient
      .from("profiles")
      .update({
        full_name,
        phone: phone || null,
      })
      .eq("id", user.id)
      .select("id, full_name, phone, wilayah, role, status")
      .single();

    if (updateError || !updatedProfile) {
      console.error("[PATCH /api/petugas/profile] Update error:", updateError);
      return NextResponse.json(
        {
          error: {
            message: "Gagal memperbarui data profil",
            code: "DATABASE_ERROR",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        success: true,
        message: "Data profil berhasil diperbarui",
        profile: {
          ...updatedProfile,
          email: user.email,
        },
      },
    });
  } catch (err: any) {
    console.error("[PATCH /api/petugas/profile] Internal error:", err?.message || err);
    return NextResponse.json(
      {
        error: {
          message: "Terjadi kesalahan server saat memperbarui profil",
          code: "INTERNAL_SERVER_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

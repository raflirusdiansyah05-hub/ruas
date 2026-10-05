import { runScoringTests } from "@/lib/scoring/scoring.test";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    runScoringTests();
    return NextResponse.json({
      success: true,
      message: "Unit test lib/scoring/ berhasil 100%",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

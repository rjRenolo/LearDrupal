/**
 * Public curriculum API
 * GET /api/curriculum
 * Returns full curriculum in the Phase[] shape
 */

import { getCurriculumFromDB } from "@/lib/curriculum-db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const curriculum = await getCurriculumFromDB();
    return NextResponse.json(curriculum);
  } catch (error) {
    console.error("Error fetching curriculum:", error);
    return NextResponse.json(
      { error: "Failed to fetch curriculum" },
      { status: 500 }
    );
  }
}

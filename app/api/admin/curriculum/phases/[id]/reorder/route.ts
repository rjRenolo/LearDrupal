/**
 * Reorder phase
 * POST /api/admin/curriculum/phases/[id]/reorder
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const phaseId = parseInt(params.id);
  if (isNaN(phaseId)) {
    return NextResponse.json({ error: "Invalid phase ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { direction } = body;

    if (direction !== "up" && direction !== "down") {
      return NextResponse.json(
        { error: "Direction must be 'up' or 'down'" },
        { status: 400 }
      );
    }

    // Get the phase to move
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
    });

    if (!phase) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 });
    }

    // Find the adjacent phase to swap with
    const targetOrder = direction === "up" ? phase.order - 1 : phase.order + 1;
    const adjacentPhase = await prisma.phase.findFirst({
      where: { order: targetOrder },
    });

    if (!adjacentPhase) {
      return NextResponse.json(
        { error: "Cannot move phase in that direction" },
        { status: 400 }
      );
    }

    // Swap order values in a transaction
    await prisma.$transaction([
      prisma.phase.update({
        where: { id: phaseId },
        data: { order: targetOrder },
      }),
      prisma.phase.update({
        where: { id: adjacentPhase.id },
        data: { order: phase.order },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering phase:", error);
    return NextResponse.json(
      { error: "Failed to reorder phase" },
      { status: 500 }
    );
  }
}

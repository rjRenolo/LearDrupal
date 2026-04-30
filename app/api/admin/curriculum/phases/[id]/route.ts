/**
 * Delete phase
 * DELETE /api/admin/curriculum/phases/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function DELETE(
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
    // Check if phase exists
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
      include: {
        weeks: {
          include: {
            days: true,
          },
        },
      },
    });

    if (!phase) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 });
    }

    // Delete the phase (cascade will delete weeks and days)
    await prisma.phase.delete({
      where: { id: phaseId },
    });

    return NextResponse.json(
      {
        message: "Phase deleted successfully",
        deletedWeeks: phase.weeks.length,
        deletedDays: phase.weeks.reduce((sum, w) => sum + w.days.length, 0),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting phase:", error);
    return NextResponse.json(
      { error: "Failed to delete phase" },
      { status: 500 }
    );
  }
}

/**
 * Reorder week
 * POST /api/admin/curriculum/weeks/[id]/reorder
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

  const weekId = parseInt(params.id);
  if (isNaN(weekId)) {
    return NextResponse.json({ error: "Invalid week ID" }, { status: 400 });
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

    // Get the week to move
    const week = await prisma.week.findUnique({
      where: { id: weekId },
    });

    if (!week) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }

    // Find the adjacent week within the same phase to swap with
    const targetOrder = direction === "up" ? week.order - 1 : week.order + 1;
    const adjacentWeek = await prisma.week.findFirst({
      where: {
        phaseId: week.phaseId,
        order: targetOrder,
      },
    });

    if (!adjacentWeek) {
      return NextResponse.json(
        { error: "Cannot move week in that direction" },
        { status: 400 }
      );
    }

    // Swap order values in a transaction
    await prisma.$transaction([
      prisma.week.update({
        where: { id: weekId },
        data: { order: targetOrder },
      }),
      prisma.week.update({
        where: { id: adjacentWeek.id },
        data: { order: week.order },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering week:", error);
    return NextResponse.json(
      { error: "Failed to reorder week" },
      { status: 500 }
    );
  }
}

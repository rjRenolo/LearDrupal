/**
 * Reorder day
 * POST /api/admin/curriculum/days/[id]/reorder
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

  const dayId = parseInt(params.id);
  if (isNaN(dayId)) {
    return NextResponse.json({ error: "Invalid day ID" }, { status: 400 });
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

    // Get the day to move
    const day = await prisma.day.findUnique({
      where: { id: dayId },
    });

    if (!day) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    // Find the adjacent day within the same week to swap with
    const targetOrder = direction === "up" ? day.order - 1 : day.order + 1;
    const adjacentDay = await prisma.day.findFirst({
      where: {
        weekId: day.weekId,
        order: targetOrder,
      },
    });

    if (!adjacentDay) {
      return NextResponse.json(
        { error: "Cannot move day in that direction" },
        { status: 400 }
      );
    }

    // Swap order values in a transaction
    await prisma.$transaction([
      prisma.day.update({
        where: { id: dayId },
        data: { order: targetOrder },
      }),
      prisma.day.update({
        where: { id: adjacentDay.id },
        data: { order: day.order },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering day:", error);
    return NextResponse.json(
      { error: "Failed to reorder day" },
      { status: 500 }
    );
  }
}

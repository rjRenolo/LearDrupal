import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { Day, db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const dayId = parseInt(id);
  if (isNaN(dayId)) {
    return NextResponse.json({ error: "Invalid day ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { direction } = body;

    if (direction !== "up" && direction !== "down") {
      return NextResponse.json({ error: "Direction must be 'up' or 'down'" }, { status: 400 });
    }

    const day = await Day.findOne({ where: { id: dayId } });
    if (!day) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    const targetOrder = direction === "up" ? day.order - 1 : day.order + 1;
    const adjacentDay = await Day.findOne({ where: { weekId: day.weekId, order: targetOrder } });
    if (!adjacentDay) {
      return NextResponse.json({ error: "Cannot move day in that direction" }, { status: 400 });
    }

    await db.transaction(async () => {
      await Day.update({ order: targetOrder }, { where: { id: dayId } });
      await Day.update({ order: day.order }, { where: { id: adjacentDay.id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering day:", error);
    return NextResponse.json({ error: "Failed to reorder day" }, { status: 500 });
  }
}

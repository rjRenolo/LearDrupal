import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { Week, db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const weekId = parseInt(id);
  if (isNaN(weekId)) {
    return NextResponse.json({ error: "Invalid week ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { direction } = body;

    if (direction !== "up" && direction !== "down") {
      return NextResponse.json({ error: "Direction must be 'up' or 'down'" }, { status: 400 });
    }

    const week = Week.findOne({ where: { id: weekId } });
    if (!week) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }

    const targetOrder = direction === "up" ? week.order - 1 : week.order + 1;
    const adjacentWeek = Week.findOne({ where: { phaseId: week.phaseId, order: targetOrder } });
    if (!adjacentWeek) {
      return NextResponse.json({ error: "Cannot move week in that direction" }, { status: 400 });
    }

    await db.transaction(async () => {
      Week.update({ order: targetOrder }, { where: { id: weekId } });
      Week.update({ order: week.order }, { where: { id: adjacentWeek.id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering week:", error);
    return NextResponse.json({ error: "Failed to reorder week" }, { status: 500 });
  }
}

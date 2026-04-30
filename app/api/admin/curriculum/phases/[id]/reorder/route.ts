import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { Phase, db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const phaseId = parseInt(id);
  if (isNaN(phaseId)) {
    return NextResponse.json({ error: "Invalid phase ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { direction } = body;

    if (direction !== "up" && direction !== "down") {
      return NextResponse.json({ error: "Direction must be 'up' or 'down'" }, { status: 400 });
    }

    const phase = await Phase.findOne({ where: { id: phaseId } });
    if (!phase) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 });
    }

    const targetOrder = direction === "up" ? phase.order - 1 : phase.order + 1;
    const adjacentPhase = await Phase.findOne({ where: { order: targetOrder } });
    if (!adjacentPhase) {
      return NextResponse.json({ error: "Cannot move phase in that direction" }, { status: 400 });
    }

    await db.transaction(async () => {
      await Phase.update({ order: targetOrder }, { where: { id: phaseId } });
      await Phase.update({ order: phase.order }, { where: { id: adjacentPhase.id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering phase:", error);
    return NextResponse.json({ error: "Failed to reorder phase" }, { status: 500 });
  }
}

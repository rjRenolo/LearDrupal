import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { Phase, Week, Day } from "@/lib/db";

export async function DELETE(
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
    const phase = await Phase.findOne({ where: { id: phaseId } });
    if (!phase) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 });
    }

    const weeks = await Week.findAll({ where: { phaseId } });
    const dayCounts = await Promise.all(weeks.map(w => Day.findAll({ where: { weekId: w.id } })));
    const deletedDays = dayCounts.reduce((sum, days) => sum + days.length, 0);

    await Phase.destroy({ where: { id: phaseId } });

    return NextResponse.json({
      message: "Phase deleted successfully",
      deletedWeeks: weeks.length,
      deletedDays,
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting phase:", error);
    return NextResponse.json({ error: "Failed to delete phase" }, { status: 500 });
  }
}

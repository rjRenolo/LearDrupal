import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { Week, Day } from "@/lib/db";

export async function DELETE(
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
    const week = await Week.findOne({ where: { id: weekId } });
    if (!week) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }

    const days = await Day.findAll({ where: { weekId } });
    await Week.destroy({ where: { id: weekId } });

    return NextResponse.json({ message: "Week deleted successfully", deletedDays: days.length }, { status: 200 });
  } catch (error) {
    console.error("Error deleting week:", error);
    return NextResponse.json({ error: "Failed to delete week" }, { status: 500 });
  }
}

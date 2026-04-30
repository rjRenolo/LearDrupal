/**
 * Delete week
 * DELETE /api/admin/curriculum/weeks/[id]
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

  const weekId = parseInt(params.id);
  if (isNaN(weekId)) {
    return NextResponse.json({ error: "Invalid week ID" }, { status: 400 });
  }

  try {
    // Check if week exists
    const week = await prisma.week.findUnique({
      where: { id: weekId },
      include: {
        days: true,
      },
    });

    if (!week) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }

    // Delete the week (cascade will delete days)
    await prisma.week.delete({
      where: { id: weekId },
    });

    return NextResponse.json(
      {
        message: "Week deleted successfully",
        deletedDays: week.days.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting week:", error);
    return NextResponse.json(
      { error: "Failed to delete week" },
      { status: 500 }
    );
  }
}

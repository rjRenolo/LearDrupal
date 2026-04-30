/**
 * Create new week
 * POST /api/admin/curriculum/weeks
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { Phase, Week } from "@/lib/db";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { phaseId, label, name } = body;

    if (!phaseId || !label || !name) {
      return NextResponse.json(
        { error: "Missing required fields: phaseId, label, name" },
        { status: 400 }
      );
    }

    // Verify phase exists
    const phase = await Phase.findOne({
      where: { id: phaseId },
    });

    if (!phase) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 });
    }

    // Get the max order value within this phase and add 1
    const maxWeek = await Week.findOne({
      where: { phaseId },
      order: [['order', 'DESC']],
      attributes: ['order'],
    });
    const nextOrder = maxWeek ? maxWeek.order + 1 : 0;

    const week = await Week.create({
      phaseId,
      order: nextOrder,
      label,
      name,
    });

    return NextResponse.json(week, { status: 201 });
  } catch (error) {
    console.error("Error creating week:", error);
    return NextResponse.json(
      { error: "Failed to create week" },
      { status: 500 }
    );
  }
}

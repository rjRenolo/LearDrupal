/**
 * Create new week
 * POST /api/admin/curriculum/weeks
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

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
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
    });

    if (!phase) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 });
    }

    // Get the max order value within this phase and add 1
    const maxWeek = await prisma.week.findFirst({
      where: { phaseId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const nextOrder = maxWeek ? maxWeek.order + 1 : 0;

    const week = await prisma.week.create({
      data: {
        phaseId,
        order: nextOrder,
        label,
        name,
      },
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

/**
 * Create new day
 * POST /api/admin/curriculum/days
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { Week, Day } from "@/lib/db";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { weekId, dayLabel, title, goal, activityType } = body;

    if (!weekId || !dayLabel || !title || !goal || !activityType) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: weekId, dayLabel, title, goal, activityType",
        },
        { status: 400 }
      );
    }

    // Verify week exists
    const week = await Week.findOne({
      where: { id: weekId },
    });

    if (!week) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }

    // Get the max order value within this week and add 1
    const maxDay = await Day.findOne({
      where: { weekId },
      order: [['order', 'DESC']],
      attributes: ['order'],
    });
    const nextOrder = maxDay ? maxDay.order + 1 : 0;

    const day = await Day.create({
      weekId,
      order: nextOrder,
      dayLabel,
      title,
      goal,
      activityType,
      // Optional fields default to null
      activityTitle: null,
      activityIntro: null,
      aiPrompt: null,
      aiCheckGoal: null,
    });

    return NextResponse.json(day, { status: 201 });
  } catch (error) {
    console.error("Error creating day:", error);
    return NextResponse.json(
      { error: "Failed to create day" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/curriculum/days/[id]
 * Fetch a single day with all nested data for editing
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function GET(
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
    const day = await prisma.day.findUnique({
      where: { id: dayId },
      include: {
        week: {
          include: {
            phase: true,
          },
        },
        reading: { orderBy: { order: "asc" } },
        questions: { orderBy: { order: "asc" } },
        steps: { orderBy: { order: "asc" } },
        aiCheck: true,
      },
    });

    if (!day) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    // Transform for easier editing
    const transformed = {
      id: day.id,
      weekId: day.weekId,
      order: day.order,
      dayLabel: day.dayLabel,
      title: day.title,
      goal: day.goal,
      activityType: day.activityType,
      activityTitle: day.activityTitle,
      activityIntro: day.activityIntro,
      aiPrompt: day.aiPrompt,
      aiCheckGoal: day.aiCheckGoal,
      phase: {
        id: day.week.phase.id,
        label: day.week.phase.label,
        name: day.week.phase.name,
      },
      week: {
        id: day.week.id,
        label: day.week.label,
        name: day.week.name,
      },
      reading: day.reading.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        link: r.link,
      })),
      questions: day.questions.map((q) => ({
        id: q.id,
        q: q.q,
        options: JSON.parse(q.options),
        answer: q.answer,
        explanation: q.explanation,
      })),
      steps: day.steps.map((s) => ({
        id: s.id,
        n: s.n,
        title: s.title,
        body: s.body,
        code: s.code,
      })),
      aiCheck: day.aiCheck
        ? {
            id: day.aiCheck.id,
            prompt: day.aiCheck.prompt,
            checkGoal: day.aiCheck.checkGoal,
          }
        : null,
    };

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Error fetching day:", error);
    return NextResponse.json(
      { error: "Failed to fetch day" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/curriculum/days/[id]
 * Update a day and all its nested data
 */
export async function PUT(
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

    // Use a transaction to update all related data atomically
    await prisma.$transaction(async (tx) => {
      // Update day
      await tx.day.update({
        where: { id: dayId },
        data: {
          dayLabel: body.dayLabel,
          title: body.title,
          goal: body.goal,
          activityType: body.activityType,
          activityTitle: body.activityTitle || null,
          activityIntro: body.activityIntro || null,
          aiPrompt: body.aiPrompt || null,
          aiCheckGoal: body.aiCheckGoal || null,
        },
      });

      // Delete and recreate reading items
      await tx.readingItem.deleteMany({ where: { dayId } });
      if (body.reading && body.reading.length > 0) {
        await tx.readingItem.createMany({
          data: body.reading.map((r: any, idx: number) => ({
            dayId,
            order: idx,
            title: r.title,
            body: r.body,
            link: r.link || null,
          })),
        });
      }

      // Delete and recreate quiz questions
      await tx.quizQuestion.deleteMany({ where: { dayId } });
      if (body.questions && body.questions.length > 0) {
        await tx.quizQuestion.createMany({
          data: body.questions.map((q: any, idx: number) => ({
            dayId,
            order: idx,
            q: q.q,
            options: JSON.stringify(q.options),
            answer: q.answer,
            explanation: q.explanation,
          })),
        });
      }

      // Delete and recreate hands-on steps
      await tx.handsOnStep.deleteMany({ where: { dayId } });
      if (body.steps && body.steps.length > 0) {
        await tx.handsOnStep.createMany({
          data: body.steps.map((s: any, idx: number) => ({
            dayId,
            order: idx,
            n: s.n,
            title: s.title,
            body: s.body || null,
            code: s.code || null,
          })),
        });
      }

      // Handle AI Check
      await tx.aiCheck.deleteMany({ where: { dayId } });
      if (body.aiCheck && body.aiCheck.prompt && body.aiCheck.checkGoal) {
        await tx.aiCheck.create({
          data: {
            dayId,
            prompt: body.aiCheck.prompt,
            checkGoal: body.aiCheck.checkGoal,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating day:", error);
    return NextResponse.json(
      { error: "Failed to update day" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/curriculum/days/[id]
 * Delete a day and all its nested data
 */
export async function DELETE(
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
    // Check if day exists
    const day = await prisma.day.findUnique({
      where: { id: dayId },
      include: {
        reading: true,
        questions: true,
        steps: true,
        aiCheck: true,
      },
    });

    if (!day) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    // Delete the day (cascade will delete all nested items)
    await prisma.day.delete({
      where: { id: dayId },
    });

    return NextResponse.json(
      {
        message: "Day deleted successfully",
        deletedReadings: day.reading.length,
        deletedQuestions: day.questions.length,
        deletedSteps: day.steps.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting day:", error);
    return NextResponse.json(
      { error: "Failed to delete day" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { Day, Week, Phase, ReadingItem, QuizQuestion, HandsOnStep, AiCheck, db } from "@/lib/db";

export async function GET(
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
    const day = await Day.findOne({ where: { id: dayId } });
    if (!day) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    const [week, reading, questions, steps, aiCheck] = await Promise.all([
      Week.findOne({ where: { id: day.weekId } }),
      ReadingItem.findAll({ where: { dayId }, order: [['order', 'ASC']] }),
      QuizQuestion.findAll({ where: { dayId }, order: [['order', 'ASC']] }),
      HandsOnStep.findAll({ where: { dayId }, order: [['order', 'ASC']] }),
      AiCheck.findOne({ where: { dayId } }),
    ]);

    const phase = week ? await Phase.findOne({ where: { id: week.phaseId } }) : null;

    return NextResponse.json({
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
      phase: phase ? { id: phase.id, label: phase.label, name: phase.name } : null,
      week: week ? { id: week.id, label: week.label, name: week.name } : null,
      reading: reading.map((r) => ({ id: r.id, title: r.title, body: r.body, link: r.link })),
      questions: questions.map((q) => ({
        id: q.id, q: q.q, options: JSON.parse(q.options), answer: q.answer, explanation: q.explanation,
      })),
      steps: steps.map((s) => ({ id: s.id, n: s.n, title: s.title, body: s.body, code: s.code })),
      aiCheck: aiCheck ? { id: aiCheck.id, prompt: aiCheck.prompt, checkGoal: aiCheck.checkGoal } : null,
    });
  } catch (error) {
    console.error("Error fetching day:", error);
    return NextResponse.json({ error: "Failed to fetch day" }, { status: 500 });
  }
}

export async function PUT(
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

    await db.transaction(async () => {
      await Day.update(
        {
          dayLabel: body.dayLabel,
          title: body.title,
          goal: body.goal,
          activityType: body.activityType,
          activityTitle: body.activityTitle || null,
          activityIntro: body.activityIntro || null,
          aiPrompt: body.aiPrompt || null,
          aiCheckGoal: body.aiCheckGoal || null,
        },
        { where: { id: dayId } }
      );

      await ReadingItem.destroy({ where: { dayId } });
      if (body.reading && body.reading.length > 0) {
        for (let idx = 0; idx < body.reading.length; idx++) {
          const r = body.reading[idx];
          await ReadingItem.create({ dayId, order: idx, title: r.title, body: r.body, link: r.link || null });
        }
      }

      await QuizQuestion.destroy({ where: { dayId } });
      if (body.questions && body.questions.length > 0) {
        for (let idx = 0; idx < body.questions.length; idx++) {
          const q = body.questions[idx];
          await QuizQuestion.create({
            dayId, order: idx, q: q.q, options: JSON.stringify(q.options), answer: q.answer, explanation: q.explanation,
          });
        }
      }

      await HandsOnStep.destroy({ where: { dayId } });
      if (body.steps && body.steps.length > 0) {
        for (let idx = 0; idx < body.steps.length; idx++) {
          const s = body.steps[idx];
          await HandsOnStep.create({ dayId, order: idx, n: s.n, title: s.title, body: s.body || null, code: s.code || null });
        }
      }

      await AiCheck.destroy({ where: { dayId } });
      if (body.aiCheck && body.aiCheck.prompt && body.aiCheck.checkGoal) {
        await AiCheck.create({ dayId, prompt: body.aiCheck.prompt, checkGoal: body.aiCheck.checkGoal });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating day:", error);
    return NextResponse.json({ error: "Failed to update day" }, { status: 500 });
  }
}

export async function DELETE(
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
    const day = await Day.findOne({ where: { id: dayId } });
    if (!day) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    const [readings, questions, steps] = await Promise.all([
      ReadingItem.findAll({ where: { dayId } }),
      QuizQuestion.findAll({ where: { dayId } }),
      HandsOnStep.findAll({ where: { dayId } }),
    ]);

    await Day.destroy({ where: { id: dayId } });

    return NextResponse.json({
      message: "Day deleted successfully",
      deletedReadings: readings.length,
      deletedQuestions: questions.length,
      deletedSteps: steps.length,
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting day:", error);
    return NextResponse.json({ error: "Failed to delete day" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { Phase, Week, Day, ReadingItem, QuizQuestion, HandsOnStep, AiCheck } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const phases = await Phase.findAll({ order: [['order', 'ASC']] });

    const transformed = await Promise.all(phases.map(async (phase) => {
      const weeks = await Week.findAll({ where: { phaseId: phase.id }, order: [['order', 'ASC']] });

      return {
        dbId: phase.id,
        id: phase.order,
        label: phase.label,
        name: phase.name,
        color: phase.color,
        bg: phase.bg,
        weeks: await Promise.all(weeks.map(async (week) => {
          const days = await Day.findAll({ where: { weekId: week.id }, order: [['order', 'ASC']] });

          return {
            dbId: week.id,
            label: week.label,
            name: week.name,
            days: await Promise.all(days.map(async (day) => {
              const [reading, questions, steps, aiCheck] = await Promise.all([
                ReadingItem.findAll({ where: { dayId: day.id }, order: [['order', 'ASC']] }),
                QuizQuestion.findAll({ where: { dayId: day.id }, order: [['order', 'ASC']] }),
                HandsOnStep.findAll({ where: { dayId: day.id }, order: [['order', 'ASC']] }),
                AiCheck.findOne({ where: { dayId: day.id } }),
              ]);

              return {
                dbId: day.id,
                day: day.dayLabel,
                title: day.title,
                goal: day.goal,
                reading: reading.map((r) => ({ title: r.title, body: r.body, link: r.link })),
                activity: {
                  type: day.activityType,
                  questions: questions.map((q) => ({
                    q: q.q,
                    options: JSON.parse(q.options),
                    answer: q.answer,
                    explanation: q.explanation,
                  })),
                  steps: steps.map((s) => ({ n: s.n, title: s.title, body: s.body, code: s.code })),
                  title: day.activityTitle,
                  intro: day.activityIntro,
                  prompt: day.aiPrompt,
                  checkGoal: day.aiCheckGoal,
                  aiCheck: aiCheck ? { prompt: aiCheck.prompt, checkGoal: aiCheck.checkGoal } : undefined,
                },
              };
            })),
          };
        })),
      };
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Error fetching admin curriculum:", error);
    return NextResponse.json({ error: "Failed to fetch curriculum" }, { status: 500 });
  }
}

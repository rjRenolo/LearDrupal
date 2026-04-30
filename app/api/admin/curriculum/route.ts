/**
 * Admin curriculum API with database IDs
 * GET /api/admin/curriculum
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const phases = await prisma.phase.findMany({
      orderBy: { order: "asc" },
      include: {
        weeks: {
          orderBy: { order: "asc" },
          include: {
            days: {
              orderBy: { order: "asc" },
              include: {
                reading: { orderBy: { order: "asc" } },
                questions: { orderBy: { order: "asc" } },
                steps: { orderBy: { order: "asc" } },
                aiCheck: true,
              },
            },
          },
        },
      },
    });

    // Transform but keep IDs
    const transformed = phases.map((phase) => ({
      dbId: phase.id,
      id: phase.order,
      label: phase.label,
      name: phase.name,
      color: phase.color,
      bg: phase.bg,
      weeks: phase.weeks.map((week) => ({
        dbId: week.id,
        label: week.label,
        name: week.name,
        days: week.days.map((day) => ({
          dbId: day.id,
          day: day.dayLabel,
          title: day.title,
          goal: day.goal,
          reading: day.reading.map((r) => ({
            title: r.title,
            body: r.body,
            link: r.link,
          })),
          activity: {
            type: day.activityType,
            questions: day.questions.map((q) => ({
              q: q.q,
              options: JSON.parse(q.options),
              answer: q.answer,
              explanation: q.explanation,
            })),
            steps: day.steps.map((s) => ({
              n: s.n,
              title: s.title,
              body: s.body,
              code: s.code,
            })),
            title: day.activityTitle,
            intro: day.activityIntro,
            prompt: day.aiPrompt,
            checkGoal: day.aiCheckGoal,
            aiCheck: day.aiCheck
              ? {
                  prompt: day.aiCheck.prompt,
                  checkGoal: day.aiCheck.checkGoal,
                }
              : undefined,
          },
        })),
      })),
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Error fetching admin curriculum:", error);
    return NextResponse.json(
      { error: "Failed to fetch curriculum" },
      { status: 500 }
    );
  }
}

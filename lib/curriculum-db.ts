/**
 * Query curriculum from database and transform to Phase[] shape
 * This keeps the API and learn page in sync
 */

import { prisma } from "./db";
import type {
  Phase,
  Week,
  Day,
  Activity,
  ReadingItem,
  QuizQuestion,
  HandsOnStep,
  AiCheck,
} from "./curriculum";

/**
 * Fetch full curriculum from database
 * Returns the same Phase[] shape as the static TypeScript files
 */
export async function getCurriculumFromDB(): Promise<Phase[]> {
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

  return phases.map(transformPhase);
}

/**
 * Transform a Prisma Phase result to the Phase interface
 */
function transformPhase(phaseData: any): Phase {
  return {
    id: phaseData.order, // Use order as the id for backward compatibility
    label: phaseData.label,
    name: phaseData.name,
    color: phaseData.color,
    bg: phaseData.bg,
    weeks: phaseData.weeks.map(transformWeek),
  };
}

/**
 * Transform a Prisma Week result to the Week interface
 */
function transformWeek(weekData: any): Week {
  return {
    label: weekData.label,
    name: weekData.name,
    days: weekData.days.map(transformDay),
  };
}

/**
 * Transform a Prisma Day result to the Day interface
 */
function transformDay(dayData: any): Day {
  return {
    day: dayData.dayLabel,
    title: dayData.title,
    goal: dayData.goal,
    reading: dayData.reading.map(transformReadingItem),
    activity: transformActivity(dayData),
  };
}

/**
 * Transform reading item (already matches interface)
 */
function transformReadingItem(item: any): ReadingItem {
  return {
    title: item.title,
    body: item.body,
    link: item.link ?? undefined,
  };
}

/**
 * Reconstruct Activity object from flat Day fields + nested relations
 */
function transformActivity(dayData: any): Activity {
  const activity: Activity = {
    type: dayData.activityType,
  };

  // Quiz questions (quiz + combined)
  if (dayData.questions && dayData.questions.length > 0) {
    activity.questions = dayData.questions.map(transformQuizQuestion);
  }

  // Hands-on steps (hands_on + combined)
  if (dayData.steps && dayData.steps.length > 0) {
    activity.title = dayData.activityTitle ?? undefined;
    activity.intro = dayData.activityIntro ?? undefined;
    activity.steps = dayData.steps.map(transformHandsOnStep);

    // AiCheck (hands_on + combined)
    if (dayData.aiCheck) {
      activity.aiCheck = transformAiCheck(dayData.aiCheck);
    }
  }

  // ai_open type
  if (dayData.activityType === "ai_open") {
    activity.prompt = dayData.aiPrompt ?? undefined;
    activity.checkGoal = dayData.aiCheckGoal ?? undefined;
  }

  return activity;
}

/**
 * Transform quiz question — parse JSON options
 */
function transformQuizQuestion(q: any): QuizQuestion {
  return {
    q: q.q,
    options: JSON.parse(q.options), // Parse JSON string back to array
    answer: q.answer,
    explanation: q.explanation,
  };
}

/**
 * Transform hands-on step (already matches interface)
 */
function transformHandsOnStep(step: any): HandsOnStep {
  return {
    n: step.n,
    title: step.title,
    body: step.body ?? undefined,
    code: step.code ?? undefined,
  };
}

/**
 * Transform AI check (already matches interface)
 */
function transformAiCheck(check: any): AiCheck {
  return {
    prompt: check.prompt,
    checkGoal: check.checkGoal,
  };
}

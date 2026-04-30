import { Phase as PhaseModel, Week as WeekModel, Day as DayModel, ReadingItem as ReadingItemModel, QuizQuestion as QuizQuestionModel, HandsOnStep as HandsOnStepModel, AiCheck as AiCheckModel } from "./db";
import type { Phase, Week, Day, Activity, ReadingItem, QuizQuestion, HandsOnStep, AiCheck } from "./curriculum";

export async function getCurriculumFromDB(): Promise<Phase[]> {
  const phases = await PhaseModel.findAll({ order: [['order', 'ASC']] });

  return Promise.all(phases.map(async phaseData => {
    const weeks = await WeekModel.findAll({ where: { phaseId: phaseData.id }, order: [['order', 'ASC']] });

    return transformPhase({
      ...phaseData,
      weeks: await Promise.all(weeks.map(async weekData => {
        const days = await DayModel.findAll({ where: { weekId: weekData.id }, order: [['order', 'ASC']] });

        return {
          ...weekData,
          days: await Promise.all(days.map(async dayData => {
            const [reading, questions, steps, aiCheck] = await Promise.all([
              ReadingItemModel.findAll({ where: { dayId: dayData.id }, order: [['order', 'ASC']] }),
              QuizQuestionModel.findAll({ where: { dayId: dayData.id }, order: [['order', 'ASC']] }),
              HandsOnStepModel.findAll({ where: { dayId: dayData.id }, order: [['order', 'ASC']] }),
              AiCheckModel.findOne({ where: { dayId: dayData.id } }),
            ]);
            return { ...dayData, reading, questions, steps, aiCheck };
          })),
        };
      })),
    });
  }));
}

function transformPhase(phaseData: any): Phase {
  return {
    id: phaseData.order,
    label: phaseData.label,
    name: phaseData.name,
    color: phaseData.color,
    bg: phaseData.bg,
    weeks: phaseData.weeks.map(transformWeek),
  };
}

function transformWeek(weekData: any): Week {
  return {
    label: weekData.label,
    name: weekData.name,
    days: weekData.days.map(transformDay),
  };
}

function transformDay(dayData: any): Day {
  return {
    day: dayData.dayLabel,
    title: dayData.title,
    goal: dayData.goal,
    reading: dayData.reading.map(transformReadingItem),
    activity: transformActivity(dayData),
  };
}

function transformReadingItem(item: any): ReadingItem {
  return {
    title: item.title,
    body: item.body,
    link: item.link ?? undefined,
  };
}

function transformActivity(dayData: any): Activity {
  const activity: Activity = { type: dayData.activityType };

  if (dayData.questions && dayData.questions.length > 0) {
    activity.questions = dayData.questions.map(transformQuizQuestion);
  }

  if (dayData.steps && dayData.steps.length > 0) {
    activity.title = dayData.activityTitle ?? undefined;
    activity.intro = dayData.activityIntro ?? undefined;
    activity.steps = dayData.steps.map(transformHandsOnStep);
    if (dayData.aiCheck) {
      activity.aiCheck = transformAiCheck(dayData.aiCheck);
    }
  }

  if (dayData.activityType === "ai_open") {
    activity.prompt = dayData.aiPrompt ?? undefined;
    activity.checkGoal = dayData.aiCheckGoal ?? undefined;
  }

  return activity;
}

function transformQuizQuestion(q: any): QuizQuestion {
  return {
    q: q.q,
    options: JSON.parse(q.options),
    answer: q.answer,
    explanation: q.explanation,
  };
}

function transformHandsOnStep(step: any): HandsOnStep {
  return {
    n: step.n,
    title: step.title,
    body: step.body ?? undefined,
    code: step.code ?? undefined,
  };
}

function transformAiCheck(check: any): AiCheck {
  return {
    prompt: check.prompt,
    checkGoal: check.checkGoal,
  };
}

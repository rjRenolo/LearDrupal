export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface ReadingItem {
  title: string;
  body: string;
  link?: string | null;
}

export interface HandsOnStep {
  n: number;
  title: string;
  body?: string;
  code?: string;
}

export interface AiCheck {
  prompt: string;
  checkGoal: string;
}

export type ActivityType = "quiz" | "hands_on" | "ai_open" | "combined";

export interface Activity {
  type: ActivityType;
  // quiz / combined
  questions?: QuizQuestion[];
  // hands_on / combined
  title?: string;
  intro?: string;
  steps?: HandsOnStep[];
  aiCheck?: AiCheck;
  // ai_open
  prompt?: string;
  checkGoal?: string;
}

export interface Day {
  day: string;
  title: string;
  goal: string;
  reading: ReadingItem[];
  activity: Activity;
}

export interface Week {
  label: string;
  name: string;
  days: Day[];
}

export interface Phase {
  id: number;
  label: string;
  name: string;
  color: string;
  bg: string;
  weeks: Week[];
}

export function getTotalDays(phases: Phase[]): number {
  return phases.reduce(
    (a, p) => a + p.weeks.reduce((b, w) => b + w.days.length, 0),
    0
  );
}

export function getDayKey(phase: number, week: number, day: number): string {
  return `${phase}-${week}-${day}`;
}

export function getPhaseColor(phases: Phase[], phaseIdx: number) {
  return phases[phaseIdx]?.color ?? "#7c6cf5";
}

export function getFirstIncompleteDay(
  phases: Phase[],
  completedSet: Set<string>
): { phase: number; week: number; day: number } {
  for (let pi = 0; pi < phases.length; pi++) {
    for (let wi = 0; wi < phases[pi].weeks.length; wi++) {
      for (let di = 0; di < phases[pi].weeks[wi].days.length; di++) {
        if (!completedSet.has(getDayKey(pi, wi, di))) {
          return { phase: pi, week: wi, day: di };
        }
      }
    }
  }
  return { phase: 0, week: 0, day: 0 };
}

export function isDayLocked(
  phases: Phase[],
  completedSet: Set<string>,
  pi: number,
  wi: number,
  di: number
): boolean {
  // First day of all time is never locked
  if (pi === 0 && wi === 0 && di === 0) return false;
  // Find the previous day
  let prevPi = pi, prevWi = wi, prevDi = di - 1;
  if (prevDi < 0) {
    prevWi = wi - 1;
    if (prevWi < 0) {
      prevPi = pi - 1;
      if (prevPi < 0) return false;
      prevWi = phases[prevPi].weeks.length - 1;
    }
    prevDi = phases[prevPi].weeks[prevWi].days.length - 1;
  }
  return !completedSet.has(getDayKey(prevPi, prevWi, prevDi));
}

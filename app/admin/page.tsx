import { Phase, Week, Day, ReadingItem, QuizQuestion, HandsOnStep, User } from "@/lib/db";
import DashboardClient from "./DashboardClient";

export default async function AdminDashboard() {
  const [
    phaseCount,
    weekCount,
    dayCount,
    readingCount,
    questionCount,
    stepCount,
    userCount,
  ] = await Promise.all([
    Phase.count(),
    Week.count(),
    Day.count(),
    ReadingItem.count(),
    QuizQuestion.count(),
    HandsOnStep.count(),
    User.count(),
  ]);

  const stats = [
    { label: "Phases", value: phaseCount, color: "#7c6cf5" },
    { label: "Weeks", value: weekCount, color: "#6bc44a" },
    { label: "Days", value: dayCount, color: "#f5a623" },
    { label: "Reading Items", value: readingCount, color: "#50e3c2" },
    { label: "Quiz Questions", value: questionCount, color: "#ff6b9d" },
    { label: "Hands-On Steps", value: stepCount, color: "#bd10e0" },
    { label: "Users", value: userCount, color: "#4a90e2" },
  ];

  return <DashboardClient stats={stats} />;
}

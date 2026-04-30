import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.progress.findMany({
    where: { userId: session.user.id },
    select: { phase: true, week: true, day: true },
  });

  return Response.json({ completed: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { phase, week, day } = await req.json();
  if (phase === undefined || week === undefined || day === undefined) {
    return Response.json({ error: "phase, week, day required" }, { status: 400 });
  }

  await prisma.progress.upsert({
    where: { userId_phase_week_day: { userId: session.user.id, phase, week, day } },
    create: { userId: session.user.id, phase, week, day },
    update: {},
  });

  return Response.json({ ok: true });
}

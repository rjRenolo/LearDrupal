import { auth } from "@/auth";
import { Progress } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await Progress.findAll({
    where: { userId: session.user.id },
    attributes: ['phase', 'week', 'day'],
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

  await Progress.upsert({
    userId: session.user.id,
    phase,
    week,
    day,
  });

  return Response.json({ ok: true });
}

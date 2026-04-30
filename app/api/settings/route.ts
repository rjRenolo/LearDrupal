import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { apiKey: true },
  });

  return Response.json({ apiKey: user?.apiKey ?? "" });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { apiKey } = await req.json();
  if (typeof apiKey !== "string") {
    return Response.json({ error: "apiKey must be a string" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { apiKey: apiKey || null },
  });

  return Response.json({ ok: true });
}

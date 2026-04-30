import { auth } from "@/auth";
import { User } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await User.findOne({
    where: { id: session.user.id },
    attributes: ['apiKey'],
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

  await User.update(
    { apiKey: apiKey || null },
    { where: { id: session.user.id } }
  );

  return Response.json({ ok: true });
}

import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { answer, checkGoal, apiKey } = await req.json();
  if (!answer || !checkGoal) {
    return Response.json({ error: "answer and checkGoal required" }, { status: 400 });
  }
  if (!apiKey?.startsWith("sk-ant-")) {
    return Response.json({ error: "NO_API_KEY" }, { status: 422 });
  }

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: `You are a Drupal expert and instructor evaluating a student's hands-on work. Task: ${checkGoal}\n\nRespond with:\n1. Score: PASS (8-10/10), PARTIAL (5-7/10), or NEEDS WORK (0-4/10) on the first line\n2. 2-3 sentences of specific constructive feedback\n3. One thing they did well\n4. One specific thing to improve\n\nBe direct, encouraging, and specific.`,
      messages: [{ role: "user", content: answer }],
    }),
  });

  if (!anthropicRes.ok) {
    const errData = await anthropicRes.json().catch(() => ({}));
    const msg = (errData as { error?: { message?: string } })?.error?.message ?? `HTTP ${anthropicRes.status}`;
    if (anthropicRes.status === 401) {
      return Response.json({ error: "INVALID_KEY", message: msg }, { status: 401 });
    }
    return Response.json({ error: msg }, { status: anthropicRes.status });
  }

  const data = await anthropicRes.json();
  const text = (data.content as { text?: string }[])?.map(c => c.text ?? "").join("") ?? "";
  return Response.json({ text });
}

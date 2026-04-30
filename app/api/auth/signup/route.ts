import { User, initDatabase } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await initDatabase();
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return Response.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await User.create({
      email,
      name: name || null,
      password: hashed,
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    return Response.json({ error: error.message || "Failed to create account." }, { status: 500 });
  }
}

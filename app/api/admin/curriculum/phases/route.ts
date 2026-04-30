/**
 * Create new phase
 * POST /api/admin/curriculum/phases
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { Phase } from "@/lib/db";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { label, name, color, bg } = body;

    if (!label || !name || !color || !bg) {
      return NextResponse.json(
        { error: "Missing required fields: label, name, color, bg" },
        { status: 400 }
      );
    }

    // Get the max order value and add 1
    const maxPhase = await Phase.findOne({
      order: [['order', 'DESC']],
      attributes: ['order'],
    });
    const nextOrder = maxPhase ? maxPhase.order + 1 : 0;

    const phase = await Phase.create({
      order: nextOrder,
      label,
      name,
      color,
      bg,
    });

    return NextResponse.json(phase, { status: 201 });
  } catch (error) {
    console.error("Error creating phase:", error);
    return NextResponse.json(
      { error: "Failed to create phase" },
      { status: 500 }
    );
  }
}

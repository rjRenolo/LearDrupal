/**
 * Admin authentication helper
 * Check if the current user has admin role
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function requireAdmin() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }
  
  const user = await prisma.user.findUnique({ 
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true }
  });
  
  if (user?.role !== "admin") {
    return null;
  }
  
  return user;
}

export async function isAdmin(): Promise<boolean> {
  const admin = await requireAdmin();
  return admin !== null;
}

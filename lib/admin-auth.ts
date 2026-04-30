/**
 * Admin authentication helper
 * Check if the current user has admin role
 */

import { auth } from "@/auth";
import { User } from "@/lib/db";

export async function requireAdmin() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }
  
  const user = await User.findOne({ 
    where: { id: session.user.id },
    attributes: ['id', 'email', 'name', 'role']
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

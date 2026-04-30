import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import AdminLayoutClient from "./AdminLayoutClient";
import "../globals.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/login");
  }

  return <AdminLayoutClient adminEmail={admin.email}>{children}</AdminLayoutClient>;
}

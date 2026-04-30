"use client";

import Link from "next/link";

export default function AdminLayoutClient({
  adminEmail,
  children,
}: {
  adminEmail: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <aside
        style={{
          width: "240px",
          background: "var(--bg2)",
          borderRight: "1px solid var(--border)",
          padding: "1.5rem 0",
          position: "fixed",
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "0 1.5rem 1.5rem",
            borderBottom: "1px solid var(--border)",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "var(--text)",
              margin: "0 0 0.5rem 0",
            }}
          >
            Admin Panel
          </h2>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text2)",
              margin: 0,
            }}
          >
            {adminEmail}
          </p>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            padding: "0 0.75rem",
          }}
        >
          <Link href="/admin" className="admin-nav-link">
            Dashboard
          </Link>
          <Link href="/admin/curriculum" className="admin-nav-link">
            Curriculum
          </Link>
          <Link href="/learn" className="admin-nav-link">
            ← Back to Learn
          </Link>
        </nav>
      </aside>

      <main
        style={{
          marginLeft: "240px",
          flex: 1,
          padding: "2rem",
          maxWidth: "1400px",
        }}
      >
        {children}
      </main>

      <style jsx>{`
        .admin-nav-link {
          padding: 0.75rem;
          color: var(--text2);
          text-decoration: none;
          border-radius: 6px;
          font-size: 0.875rem;
          transition: all 0.15s ease;
          display: block;
        }

        .admin-nav-link:hover {
          background: var(--bg3);
          color: var(--text);
        }
      `}</style>
    </div>
  );
}

"use client";

import Link from "next/link";

interface Stat {
  label: string;
  value: number;
  color: string;
}

interface DashboardClientProps {
  stats: Stat[];
}

export default function DashboardClient({ stats }: DashboardClientProps) {
  return (
    <div>
      <div className="admin-header">
        <h1>Dashboard</h1>
        <p className="admin-subtitle">Curriculum overview and statistics</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-value" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-actions">
        <Link href="/admin/curriculum" className="action-card">
          <h3>Manage Curriculum</h3>
          <p>View, edit, and organize phases, weeks, and days</p>
        </Link>
      </div>

      <style jsx>{`
        .admin-header {
          margin-bottom: 2rem;
        }

        .admin-header h1 {
          font-size: 2rem;
          font-weight: 600;
          color: var(--text);
          margin: 0 0 0.5rem 0;
        }

        .admin-subtitle {
          color: var(--text2);
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1.5rem;
          text-align: center;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          font-family: 'IBM Plex Mono', monospace;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .admin-actions {
          display: grid;
          gap: 1rem;
        }

        .admin-actions :global(.action-card) {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1.5rem;
          text-decoration: none;
          transition: all 0.15s ease;
          display: block;
        }

        .admin-actions :global(.action-card:hover) {
          border-color: var(--accent);
          background: var(--bg3);
        }

        .admin-actions :global(.action-card h3) {
          color: var(--text);
          margin: 0 0 0.5rem 0;
          font-size: 1.125rem;
        }

        .admin-actions :global(.action-card p) {
          color: var(--text2);
          margin: 0;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}

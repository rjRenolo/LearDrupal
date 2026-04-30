"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Phase = {
  dbId: number;
  label: string;
  name: string;
  weeks: Week[];
};

type Week = {
  dbId: number;
  label: string;
  name: string;
};

export default function NewDayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedWeekId = searchParams.get("weekId");

  const [loading, setLoading] = useState(false);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [formData, setFormData] = useState({
    weekId: preselectedWeekId ? parseInt(preselectedWeekId) : 0,
    dayLabel: "",
    title: "",
    goal: "",
    activityType: "quiz" as string,
  });

  useEffect(() => {
    // Fetch phases with weeks for the dropdown
    fetch("/api/admin/curriculum")
      .then((r) => r.json())
      .then((data) => {
        setPhases(data);
        if (!preselectedWeekId && data.length > 0 && data[0].weeks.length > 0) {
          setFormData((prev) => ({ ...prev, weekId: data[0].weeks[0].dbId }));
        }
      });
  }, [preselectedWeekId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/curriculum/days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const day = await response.json();
        alert("Day created successfully!");
        // Redirect to edit page to add content
        router.push(`/admin/curriculum/days/${day.id}/edit`);
      } else {
        const error = await response.json();
        alert(`Failed to create day: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating day:", error);
      alert("Failed to create day");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-header">
        <h1>Create New Day</h1>
        <button onClick={() => router.back()} className="btn btn-secondary">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label>Week *</label>
          <select
            value={formData.weekId}
            onChange={(e) => setFormData({ ...formData, weekId: parseInt(e.target.value) })}
            required
          >
            <option value={0} disabled>
              Select a week
            </option>
            {phases.map((phase) =>
              phase.weeks.map((week) => (
                <option key={week.dbId} value={week.dbId}>
                  {phase.label} → {week.label} — {week.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="form-group">
          <label>Day Label *</label>
          <input
            type="text"
            value={formData.dayLabel}
            onChange={(e) => setFormData({ ...formData, dayLabel: e.target.value })}
            placeholder="Day 1"
            required
          />
        </div>

        <div className="form-group">
          <label>Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Classes, Objects & Properties"
            required
          />
        </div>

        <div className="form-group">
          <label>Goal *</label>
          <textarea
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            placeholder="Understand how to create and use classes..."
            rows={3}
            required
          />
        </div>

        <div className="form-group">
          <label>Activity Type *</label>
          <select
            value={formData.activityType}
            onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
            required
          >
            <option value="quiz">Quiz</option>
            <option value="hands_on">Hands-On</option>
            <option value="ai_open">AI Open</option>
            <option value="combined">Combined</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading || formData.weekId === 0} className="btn btn-primary">
            {loading ? "Creating..." : "Create Day"}
          </button>
          <p className="form-note">
            After creating the day, you'll be redirected to the editor to add reading materials and activities.
          </p>
        </div>
      </form>

      <style jsx>{`
        .form-page {
          max-width: 600px;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .form-header h1 {
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--text);
          margin: 0;
        }

        .form-container {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text);
          margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.625rem;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text);
          font-size: 0.9375rem;
          font-family: inherit;
        }

        .form-group textarea {
          resize: vertical;
        }

        .form-actions {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }

        .form-note {
          margin-top: 0.75rem;
          font-size: 0.8125rem;
          color: var(--text2);
        }

        .btn {
          padding: 0.625rem 1.25rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-primary {
          background: var(--accent);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--bg2);
          color: var(--text);
          border: 1px solid var(--border);
        }

        .btn-secondary:hover {
          background: var(--bg3);
        }
      `}</style>
    </div>
  );
}

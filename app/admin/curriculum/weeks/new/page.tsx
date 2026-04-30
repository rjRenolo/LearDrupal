"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Phase = {
  dbId: number;
  label: string;
  name: string;
};

export default function NewWeekPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPhaseId = searchParams.get("phaseId");

  const [loading, setLoading] = useState(false);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [formData, setFormData] = useState({
    phaseId: preselectedPhaseId ? parseInt(preselectedPhaseId) : 0,
    label: "",
    name: "",
  });

  useEffect(() => {
    // Fetch phases for the dropdown
    fetch("/api/admin/curriculum")
      .then((r) => r.json())
      .then((data) => {
        setPhases(data);
        if (data.length > 0 && !preselectedPhaseId) {
          setFormData((prev) => ({ ...prev, phaseId: data[0].dbId }));
        }
      });
  }, [preselectedPhaseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/curriculum/weeks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Week created successfully!");
        router.push("/admin/curriculum");
      } else {
        const error = await response.json();
        alert(`Failed to create week: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating week:", error);
      alert("Failed to create week");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-header">
        <h1>Create New Week</h1>
        <button onClick={() => router.back()} className="btn btn-secondary">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label>Phase *</label>
          <select
            value={formData.phaseId}
            onChange={(e) => setFormData({ ...formData, phaseId: parseInt(e.target.value) })}
            required
          >
            <option value={0} disabled>
              Select a phase
            </option>
            {phases.map((phase) => (
              <option key={phase.dbId} value={phase.dbId}>
                {phase.label} — {phase.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Label *</label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder="Week 1"
            required
          />
        </div>

        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="PHP OOP Essentials"
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading || formData.phaseId === 0} className="btn btn-primary">
            {loading ? "Creating..." : "Create Week"}
          </button>
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
        .form-group select {
          width: 100%;
          padding: 0.625rem;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text);
          font-size: 0.9375rem;
          font-family: inherit;
        }

        .form-actions {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
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

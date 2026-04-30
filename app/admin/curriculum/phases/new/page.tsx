"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPhasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: "",
    name: "",
    color: "#6bc44a",
    bg: "#14200d",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/curriculum/phases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Phase created successfully!");
        router.push("/admin/curriculum");
      } else {
        const error = await response.json();
        alert(`Failed to create phase: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating phase:", error);
      alert("Failed to create phase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-header">
        <h1>Create New Phase</h1>
        <button onClick={() => router.back()} className="btn btn-secondary">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label>Label *</label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder="Phase 0"
            required
          />
        </div>

        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="PHP Foundations"
            required
          />
        </div>

        <div className="form-group">
          <label>Text Color *</label>
          <div className="color-picker">
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              required
            />
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="#6bc44a"
              pattern="^#[0-9a-fA-F]{6}$"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Background Color *</label>
          <div className="color-picker">
            <input
              type="color"
              value={formData.bg}
              onChange={(e) => setFormData({ ...formData, bg: e.target.value })}
              required
            />
            <input
              type="text"
              value={formData.bg}
              onChange={(e) => setFormData({ ...formData, bg: e.target.value })}
              placeholder="#14200d"
              pattern="^#[0-9a-fA-F]{6}$"
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Creating..." : "Create Phase"}
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

        .form-group input[type="text"],
        .form-group input[type="number"] {
          width: 100%;
          padding: 0.625rem;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text);
          font-size: 0.9375rem;
          font-family: inherit;
        }

        .color-picker {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .color-picker input[type="color"] {
          width: 60px;
          height: 40px;
          border: 1px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
        }

        .color-picker input[type="text"] {
          flex: 1;
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

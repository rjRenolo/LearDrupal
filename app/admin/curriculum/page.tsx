"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Edit, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import type { Phase } from "@/lib/curriculum";

// Admin version includes database IDs
type AdminDay = Phase["weeks"][0]["days"][0] & { dbId: number };
type AdminWeek = Omit<Phase["weeks"][0], "days"> & { dbId: number; days: AdminDay[] };
type AdminPhase = Omit<Phase, "weeks"> & { dbId: number; weeks: AdminWeek[] };

export default function CurriculumPage() {
  const [phases, setPhases] = useState<AdminPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([0]));
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set(["0-0"]));

  useEffect(() => {
    fetch("/api/admin/curriculum")
      .then((r) => r.json())
      .then((data) => {
        setPhases(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load curriculum:", err);
        setLoading(false);
      });
  }, []);

  const togglePhase = (phaseIdx: number) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseIdx)) {
        next.delete(phaseIdx);
      } else {
        next.add(phaseIdx);
      }
      return next;
    });
  };

  const toggleWeek = (weekKey: string) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekKey)) {
        next.delete(weekKey);
      } else {
        next.add(weekKey);
      }
      return next;
    });
  };

  const getActivityBadge = (type: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      quiz: { label: "Quiz", color: "#ff6b9d" },
      hands_on: { label: "Hands-On", color: "#bd10e0" },
      ai_open: { label: "AI Open", color: "#50e3c2" },
      combined: { label: "Combined", color: "#f5a623" },
    };
    return badges[type] || { label: type, color: "#7c6cf5" };
  };

  const refreshCurriculum = () => {
    setLoading(true);
    fetch("/api/admin/curriculum")
      .then((r) => r.json())
      .then((data) => {
        setPhases(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load curriculum:", err);
        setLoading(false);
      });
  };

  const handleDeletePhase = async (phaseId: number, phaseName: string) => {
    if (!confirm(`Are you sure you want to delete "${phaseName}" and all its weeks and days? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/curriculum/phases/${phaseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Phase deleted successfully");
        refreshCurriculum();
      } else {
        const error = await response.json();
        alert(`Failed to delete phase: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting phase:", error);
      alert("Failed to delete phase");
    }
  };

  const handleDeleteWeek = async (weekId: number, weekName: string) => {
    if (!confirm(`Are you sure you want to delete "${weekName}" and all its days? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/curriculum/weeks/${weekId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Week deleted successfully");
        refreshCurriculum();
      } else {
        const error = await response.json();
        alert(`Failed to delete week: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting week:", error);
      alert("Failed to delete week");
    }
  };

  const handleDeleteDay = async (dayId: number, dayTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${dayTitle}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/curriculum/days/${dayId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Day deleted successfully");
        refreshCurriculum();
      } else {
        const error = await response.json();
        alert(`Failed to delete day: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting day:", error);
      alert("Failed to delete day");
    }
  };

  const handleReorderPhase = async (phaseId: number, direction: "up" | "down") => {
    try {
      const response = await fetch(`/api/admin/curriculum/phases/${phaseId}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });

      if (response.ok) {
        refreshCurriculum();
      } else {
        const error = await response.json();
        alert(`Failed to reorder phase: ${error.error}`);
      }
    } catch (error) {
      console.error("Error reordering phase:", error);
      alert("Failed to reorder phase");
    }
  };

  const handleReorderWeek = async (weekId: number, direction: "up" | "down") => {
    try {
      const response = await fetch(`/api/admin/curriculum/weeks/${weekId}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });

      if (response.ok) {
        refreshCurriculum();
      } else {
        const error = await response.json();
        alert(`Failed to reorder week: ${error.error}`);
      }
    } catch (error) {
      console.error("Error reordering week:", error);
      alert("Failed to reorder week");
    }
  };

  const handleReorderDay = async (dayId: number, direction: "up" | "down") => {
    try {
      const response = await fetch(`/api/admin/curriculum/days/${dayId}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });

      if (response.ok) {
        refreshCurriculum();
      } else {
        const error = await response.json();
        alert(`Failed to reorder day: ${error.error}`);
      }
    } catch (error) {
      console.error("Error reordering day:", error);
      alert("Failed to reorder day");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", color: "var(--text2)" }}>
        Loading curriculum...
      </div>
    );
  }

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>Curriculum Management</h1>
          <p className="admin-subtitle">
            View and manage all phases, weeks, and days
          </p>
        </div>
        <Link href="/admin/curriculum/phases/new" className="btn btn-primary">
          <Plus size={16} /> New Phase
        </Link>
      </div>

      <div className="curriculum-tree">
        {phases.map((phase, pi) => {
          const isExpanded = expandedPhases.has(pi);
          const totalDays = phase.weeks.reduce((sum, w) => sum + w.days.length, 0);

          return (
            <div key={pi} className="phase-node">
              <button
                className="node-header phase-header"
                onClick={() => togglePhase(pi)}
                style={{
                  borderLeftColor: phase.color,
                }}
              >
                <span className="node-toggle">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                <span className="phase-badge" style={{ background: phase.bg, color: phase.color }}>
                  {phase.label}
                </span>
                <span className="node-title">{phase.name}</span>
                <span className="node-meta">
                  {phase.weeks.length} weeks • {totalDays} days
                </span>
              </button>
              <div className="node-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReorderPhase(phase.dbId, "up");
                  }}
                  className="action-btn"
                  title="Move up"
                  disabled={pi === 0}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReorderPhase(phase.dbId, "down");
                  }}
                  className="action-btn"
                  title="Move down"
                  disabled={pi === phases.length - 1}
                >
                  <ArrowDown size={14} />
                </button>
                <Link
                  href={`/admin/curriculum/weeks/new?phaseId=${phase.dbId}`}
                  className="action-btn"
                  title="Add week"
                >
                  <Plus size={14} />
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhase(phase.dbId, phase.name);
                  }}
                  className="action-btn delete-btn"
                  title="Delete phase"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {isExpanded && (
                <div className="node-children">
                  {phase.weeks.map((week, wi) => {
                    const weekKey = `${pi}-${wi}`;
                    const weekExpanded = expandedWeeks.has(weekKey);

                    return (
                      <div key={wi} className="week-node">
                        <button
                          className="node-header week-header"
                          onClick={() => toggleWeek(weekKey)}
                        >
                          <span className="node-toggle">
                            {weekExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </span>
                          <span className="node-title">
                            {week.label}: {week.name}
                          </span>
                          <span className="node-meta">{week.days.length} days</span>
                        </button>
                        <div className="node-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorderWeek(week.dbId, "up");
                            }}
                            className="action-btn"
                            title="Move up"
                            disabled={wi === 0}
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorderWeek(week.dbId, "down");
                            }}
                            className="action-btn"
                            title="Move down"
                            disabled={wi === phase.weeks.length - 1}
                          >
                            <ArrowDown size={14} />
                          </button>
                          <Link
                            href={`/admin/curriculum/days/new?weekId=${week.dbId}`}
                            className="action-btn"
                            title="Add day"
                          >
                            <Plus size={14} />
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWeek(week.dbId, week.name);
                            }}
                            className="action-btn delete-btn"
                            title="Delete week"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {weekExpanded && (
                          <div className="node-children">
                            {week.days.map((day, di) => {
                              const badge = getActivityBadge(day.activity.type);
                              return (
                                <div key={di} className="day-node">
                                  <div className="day-header">
                                    <span className="day-label">{day.day}</span>
                                    <span className="day-title">{day.title}</span>
                                    <span
                                      className="activity-badge"
                                      style={{ background: badge.color + "20", color: badge.color }}
                                    >
                                      {badge.label}
                                    </span>
                                    <span className="day-counts">
                                      {day.reading.length}📖
                                      {day.activity.questions && ` ${day.activity.questions.length}❓`}
                                      {day.activity.steps && ` ${day.activity.steps.length}🔧`}
                                    </span>
                                    <div className="day-actions">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReorderDay(day.dbId, "up");
                                        }}
                                        className="day-action-btn"
                                        title="Move up"
                                        disabled={di === 0}
                                      >
                                        <ArrowUp size={14} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReorderDay(day.dbId, "down");
                                        }}
                                        className="day-action-btn"
                                        title="Move down"
                                        disabled={di === week.days.length - 1}
                                      >
                                        <ArrowDown size={14} />
                                      </button>
                                      <Link
                                        href={`/admin/curriculum/days/${day.dbId}/edit`}
                                        className="day-action-btn"
                                        title="Edit day"
                                      >
                                        <Edit size={14} />
                                      </Link>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteDay(day.dbId, day.title);
                                        }}
                                        className="day-action-btn delete-btn"
                                        title="Delete day"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
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

        .curriculum-tree {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }

        .phase-node,
        .week-node {
          border-bottom: 1px solid var(--border);
        }

        .phase-node:last-child {
          border-bottom: none;
        }

        .node-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text);
          font-size: 0.9375rem;
          text-align: left;
          transition: background 0.15s ease;
        }

        .node-header:hover {
          background: var(--bg3);
        }

        .phase-header {
          font-weight: 600;
          border-left: 3px solid;
        }

        .week-header {
          font-size: 0.875rem;
          padding-left: 2.5rem;
        }

        .node-toggle {
          display: flex;
          align-items: center;
          color: var(--text2);
        }

        .phase-badge {
          padding: 0.25rem 0.625rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          font-family: 'IBM Plex Mono', monospace;
        }

        .node-title {
          flex: 1;
        }

        .node-meta {
          font-size: 0.75rem;
          color: var(--text2);
          font-family: 'IBM Plex Mono', monospace;
        }

        .node-children {
          background: var(--bg);
        }

        .day-node {
          border-bottom: 1px solid var(--border);
        }

        .day-node:last-child {
          border-bottom: none;
        }

        .day-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.25rem 0.75rem 4rem;
          font-size: 0.8125rem;
        }

        .day-label {
          font-weight: 600;
          color: var(--text2);
          font-family: 'IBM Plex Mono', monospace;
          min-width: 4rem;
        }

        .day-title {
          flex: 1;
          color: var(--text);
        }

        .activity-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .day-counts {
          font-size: 0.75rem;
          color: var(--text2);
          font-family: 'IBM Plex Mono', monospace;
        }

        .phase-node,
        .week-node {
          position: relative;
        }

        .node-actions {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.15s ease;
          pointer-events: none;
        }

        .phase-node:hover .node-actions,
        .week-node:hover > .node-actions {
          opacity: 1;
          pointer-events: auto;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          padding: 0;
          background: var(--bg);
          color: var(--text2);
          border: 1px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-btn:hover:not(:disabled) {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }

        .action-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .action-btn.delete-btn:hover:not(:disabled) {
          background: var(--danger);
          border-color: var(--danger);
        }

        .day-actions {
          display: flex;
          gap: 0.375rem;
          margin-left: auto;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .day-node:hover .day-actions {
          opacity: 1;
        }

        .day-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.375rem;
          background: var(--bg2);
          color: var(--text2);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .day-action-btn:hover:not(:disabled) {
          background: var(--accent);
          color: white;
        }

        .day-action-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .day-action-btn.delete-btn:hover:not(:disabled) {
          background: var(--danger);
          color: white;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .btn-primary {
          background: var(--accent);
          color: white;
        }

        .btn-primary:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";

type ReadingItem = {
  id?: number;
  title: string;
  body: string;
  link: string | null;
};

type QuizQuestion = {
  id?: number;
  q: string;
  options: string[];
  answer: number;
  explanation: string;
};

type HandsOnStep = {
  id?: number;
  n: number;
  title: string;
  body: string | null;
  code: string | null;
};

type AiCheck = {
  id?: number;
  prompt: string;
  checkGoal: string;
} | null;

type DayData = {
  id: number;
  weekId: number;
  order: number;
  dayLabel: string;
  title: string;
  goal: string;
  activityType: string;
  activityTitle: string | null;
  activityIntro: string | null;
  aiPrompt: string | null;
  aiCheckGoal: string | null;
  phase: { id: number; label: string; name: string };
  week: { id: number; label: string; name: string };
  reading: ReadingItem[];
  questions: QuizQuestion[];
  steps: HandsOnStep[];
  aiCheck: AiCheck;
};

export default function EditDayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [day, setDay] = useState<DayData | null>(null);

  useEffect(() => {
    fetch(`/api/admin/curriculum/days/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setDay(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load day:", err);
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    if (!day) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/curriculum/days/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(day),
      });

      if (response.ok) {
        alert("Day saved successfully!");
        router.push("/admin/curriculum");
      } else {
        alert("Failed to save day");
      }
    } catch (error) {
      console.error("Error saving day:", error);
      alert("Failed to save day");
    } finally {
      setSaving(false);
    }
  };

  const addReading = () => {
    if (!day) return;
    setDay({
      ...day,
      reading: [...day.reading, { title: "", body: "", link: null }],
    });
  };

  const removeReading = (idx: number) => {
    if (!day) return;
    setDay({
      ...day,
      reading: day.reading.filter((_, i) => i !== idx),
    });
  };

  const addQuestion = () => {
    if (!day) return;
    setDay({
      ...day,
      questions: [
        ...day.questions,
        { q: "", options: ["", "", "", ""], answer: 0, explanation: "" },
      ],
    });
  };

  const removeQuestion = (idx: number) => {
    if (!day) return;
    setDay({
      ...day,
      questions: day.questions.filter((_, i) => i !== idx),
    });
  };

  const addStep = () => {
    if (!day) return;
    const nextN = day.steps.length > 0 ? Math.max(...day.steps.map((s) => s.n)) + 1 : 1;
    setDay({
      ...day,
      steps: [...day.steps, { n: nextN, title: "", body: null, code: null }],
    });
  };

  const removeStep = (idx: number) => {
    if (!day) return;
    setDay({
      ...day,
      steps: day.steps.filter((_, i) => i !== idx),
    });
  };

  if (loading) {
    return <div style={{ padding: "2rem", color: "var(--text2)" }}>Loading...</div>;
  }

  if (!day) {
    return <div style={{ padding: "2rem", color: "var(--text2)" }}>Day not found</div>;
  }

  const showQuestions = day.activityType === "quiz" || day.activityType === "combined";
  const showSteps = day.activityType === "hands_on" || day.activityType === "combined";
  const showAiOpen = day.activityType === "ai_open";

  return (
    <div className="day-editor">
      <div className="editor-header">
        <div>
          <h1>Edit Day</h1>
          <p className="breadcrumb">
            {day.phase.label} → {day.week.label} → {day.dayLabel}
          </p>
        </div>
        <div className="editor-actions">
          <button onClick={() => router.back()} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="editor-sections">
        {/* Basic Info */}
        <section className="editor-section">
          <h2>Basic Information</h2>
          <div className="form-group">
            <label>Day Label</label>
            <input
              type="text"
              value={day.dayLabel}
              onChange={(e) => setDay({ ...day, dayLabel: e.target.value })}
              placeholder="Day 1"
            />
          </div>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={day.title}
              onChange={(e) => setDay({ ...day, title: e.target.value })}
              placeholder="Day title"
            />
          </div>
          <div className="form-group">
            <label>Goal</label>
            <textarea
              value={day.goal}
              onChange={(e) => setDay({ ...day, goal: e.target.value })}
              placeholder="Learning goal for this day"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Activity Type</label>
            <select
              value={day.activityType}
              onChange={(e) => setDay({ ...day, activityType: e.target.value })}
            >
              <option value="quiz">Quiz</option>
              <option value="hands_on">Hands-On</option>
              <option value="ai_open">AI Open</option>
              <option value="combined">Combined</option>
            </select>
          </div>
        </section>

        {/* Reading Items */}
        <section className="editor-section">
          <div className="section-header">
            <h2>Reading Material</h2>
            <button onClick={addReading} className="btn btn-small">
              <Plus size={14} /> Add Reading
            </button>
          </div>
          {day.reading.map((item, idx) => (
            <div key={idx} className="item-card">
              <div className="item-header">
                <span>Reading {idx + 1}</span>
                <button onClick={() => removeReading(idx)} className="btn-icon">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => {
                    const updated = [...day.reading];
                    updated[idx].title = e.target.value;
                    setDay({ ...day, reading: updated });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Body</label>
                <textarea
                  value={item.body}
                  onChange={(e) => {
                    const updated = [...day.reading];
                    updated[idx].body = e.target.value;
                    setDay({ ...day, reading: updated });
                  }}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Link (optional)</label>
                <input
                  type="text"
                  value={item.link || ""}
                  onChange={(e) => {
                    const updated = [...day.reading];
                    updated[idx].link = e.target.value || null;
                    setDay({ ...day, reading: updated });
                  }}
                  placeholder="https://..."
                />
              </div>
            </div>
          ))}
        </section>

        {/* Activity-specific sections */}
        {(showSteps || showQuestions) && (
          <section className="editor-section">
            <h2>Activity Details</h2>
            <div className="form-group">
              <label>Activity Title</label>
              <input
                type="text"
                value={day.activityTitle || ""}
                onChange={(e) => setDay({ ...day, activityTitle: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Activity Intro</label>
              <textarea
                value={day.activityIntro || ""}
                onChange={(e) => setDay({ ...day, activityIntro: e.target.value })}
                rows={3}
              />
            </div>
          </section>
        )}

        {/* Quiz Questions */}
        {showQuestions && (
          <section className="editor-section">
            <div className="section-header">
              <h2>Quiz Questions</h2>
              <button onClick={addQuestion} className="btn btn-small">
                <Plus size={14} /> Add Question
              </button>
            </div>
            {day.questions.map((q, idx) => (
              <div key={idx} className="item-card">
                <div className="item-header">
                  <span>Question {idx + 1}</span>
                  <button onClick={() => removeQuestion(idx)} className="btn-icon">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="form-group">
                  <label>Question</label>
                  <textarea
                    value={q.q}
                    onChange={(e) => {
                      const updated = [...day.questions];
                      updated[idx].q = e.target.value;
                      setDay({ ...day, questions: updated });
                    }}
                    rows={3}
                  />
                </div>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="form-group">
                    <label>Option {oi + 1}</label>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const updated = [...day.questions];
                        updated[idx].options[oi] = e.target.value;
                        setDay({ ...day, questions: updated });
                      }}
                    />
                  </div>
                ))}
                <div className="form-group">
                  <label>Correct Answer (0-3)</label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={q.answer}
                    onChange={(e) => {
                      const updated = [...day.questions];
                      updated[idx].answer = parseInt(e.target.value);
                      setDay({ ...day, questions: updated });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Explanation</label>
                  <textarea
                    value={q.explanation}
                    onChange={(e) => {
                      const updated = [...day.questions];
                      updated[idx].explanation = e.target.value;
                      setDay({ ...day, questions: updated });
                    }}
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Hands-On Steps */}
        {showSteps && (
          <section className="editor-section">
            <div className="section-header">
              <h2>Hands-On Steps</h2>
              <button onClick={addStep} className="btn btn-small">
                <Plus size={14} /> Add Step
              </button>
            </div>
            {day.steps.map((step, idx) => (
              <div key={idx} className="item-card">
                <div className="item-header">
                  <span>Step {step.n}</span>
                  <button onClick={() => removeStep(idx)} className="btn-icon">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => {
                      const updated = [...day.steps];
                      updated[idx].title = e.target.value;
                      setDay({ ...day, steps: updated });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Body (optional)</label>
                  <textarea
                    value={step.body || ""}
                    onChange={(e) => {
                      const updated = [...day.steps];
                      updated[idx].body = e.target.value || null;
                      setDay({ ...day, steps: updated });
                    }}
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>Code (optional)</label>
                  <textarea
                    value={step.code || ""}
                    onChange={(e) => {
                      const updated = [...day.steps];
                      updated[idx].code = e.target.value || null;
                      setDay({ ...day, steps: updated });
                    }}
                    rows={4}
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.875rem" }}
                  />
                </div>
              </div>
            ))}

            {/* AI Check */}
            {day.steps.length > 0 && (
              <div className="item-card">
                <h3>AI Check</h3>
                <div className="form-group">
                  <label>Prompt</label>
                  <textarea
                    value={day.aiCheck?.prompt || ""}
                    onChange={(e) =>
                      setDay({
                        ...day,
                        aiCheck: { ...day.aiCheck, prompt: e.target.value, checkGoal: day.aiCheck?.checkGoal || "" },
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Check Goal</label>
                  <textarea
                    value={day.aiCheck?.checkGoal || ""}
                    onChange={(e) =>
                      setDay({
                        ...day,
                        aiCheck: { ...day.aiCheck, prompt: day.aiCheck?.prompt || "", checkGoal: e.target.value },
                      })
                    }
                    rows={3}
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {/* AI Open */}
        {showAiOpen && (
          <section className="editor-section">
            <h2>AI Open Response</h2>
            <div className="form-group">
              <label>Prompt</label>
              <textarea
                value={day.aiPrompt || ""}
                onChange={(e) => setDay({ ...day, aiPrompt: e.target.value })}
                rows={4}
              />
            </div>
            <div className="form-group">
              <label>Check Goal</label>
              <textarea
                value={day.aiCheckGoal || ""}
                onChange={(e) => setDay({ ...day, aiCheckGoal: e.target.value })}
                rows={4}
              />
            </div>
          </section>
        )}
      </div>

      <style jsx>{`
        .day-editor {
          max-width: 900px;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .editor-header h1 {
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--text);
          margin: 0 0 0.5rem 0;
        }

        .breadcrumb {
          font-size: 0.875rem;
          color: var(--text2);
          margin: 0;
        }

        .editor-actions {
          display: flex;
          gap: 0.75rem;
        }

        .editor-sections {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .editor-section {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .editor-section h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text);
          margin: 0 0 1.5rem 0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-header h2 {
          margin: 0;
        }

        .form-group {
          margin-bottom: 1.25rem;
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
        .form-group textarea,
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

        .form-group textarea {
          resize: vertical;
        }

        .item-card {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 1.25rem;
          margin-bottom: 1rem;
        }

        .item-card:last-child {
          margin-bottom: 0;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          font-weight: 600;
          color: var(--text);
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

        .btn-small {
          padding: 0.5rem 0.875rem;
          font-size: 0.8125rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          background: var(--bg);
          color: var(--text);
          border: 1px solid var(--border);
        }

        .btn-small:hover {
          background: var(--bg3);
        }

        .btn-icon {
          padding: 0.375rem;
          background: transparent;
          border: none;
          color: var(--text2);
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.15s ease;
        }

        .btn-icon:hover {
          background: var(--bg2);
          color: var(--danger);
        }
      `}</style>
    </div>
  );
}

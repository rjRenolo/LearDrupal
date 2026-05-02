"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Brain,
  BookOpen,
  Wrench,
  PenLine,
  KeyRound,
  Lock,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  getDayKey,
  getFirstIncompleteDay,
  getTotalDays,
  isDayLocked,
} from "@/lib/curriculum";
import type { Activity, QuizQuestion, HandsOnStep, Phase } from "@/lib/curriculum";

const LS_API_KEY = "drupal_learn_apiKey";
const LS_RESULTS = "drupal_learn_results";

type AiResultShape = { scoreClass: string; scoreIcon: "pass" | "partial" | "fail"; body: string };

type DayResults = {
  quizAnswers?: (number | null)[];
  quizScore?: string;
  aiResponse?: string;
  aiAnswer?: string;
  handsonAiResponse?: string;
  handsonAnswer?: string;
};

function loadApiKeyLS(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LS_API_KEY) ?? "";
}

function saveApiKeyLS(key: string) {
  if (key) localStorage.setItem(LS_API_KEY, key);
  else localStorage.removeItem(LS_API_KEY);
}

function mergeResult(dayKey: string, data: Partial<DayResults>) {
  try {
    const all: Record<string, DayResults> = JSON.parse(
      localStorage.getItem(LS_RESULTS) ?? "{}"
    );
    all[dayKey] = { ...all[dayKey], ...data };
    localStorage.setItem(LS_RESULTS, JSON.stringify(all));
  } catch {}
}

function loadDayResults(dayKey: string): DayResults {
  try {
    const all: Record<string, DayResults> = JSON.parse(
      localStorage.getItem(LS_RESULTS) ?? "{}"
    );
    return all[dayKey] ?? {};
  } catch {
    return {};
  }
}

function parseAiResult(text: string): AiResultShape {
  const firstLine = text.split("\n")[0];
  let scoreClass = "score-partial";
  let scoreIcon: "pass" | "partial" | "fail" = "partial";
  if (/PASS/i.test(firstLine)) { scoreClass = "score-pass"; scoreIcon = "pass"; }
  else if (/NEEDS WORK/i.test(firstLine)) { scoreClass = "score-fail"; scoreIcon = "fail"; }
  const body = text.split("\n").slice(1).join("\n").trim();
  return { scoreClass, scoreIcon, body };
}

// ── API key modal ─────────────────────────────────────────────
function ApiKeyModal({
  current,
  onSave,
  onClose,
}: {
  current: string;
  onSave: (key: string) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(current);
  const [err, setErr] = useState(false);

  function save() {
    if (!val.trim().startsWith("sk-ant-")) { setErr(true); return; }
    onSave(val.trim());
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h3>Anthropic API key</h3>
        <p>Your API key is used for AI feedback on activities. It is <strong>stored only in your browser&apos;s local storage</strong> — it is never sent to our servers or saved in any database.</p>
        <p className="note">For full transparency, you can review the source code on our GitHub repo. Get a key at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">console.anthropic.com</a> → API Keys.</p>
        <input
          className="modal-input"
          type="password"
          placeholder="sk-ant-..."
          value={val}
          onChange={e => { setVal(e.target.value); setErr(false); }}
          onKeyDown={e => e.key === "Enter" && save()}
          autoFocus
        />
        <div className={`modal-error${err ? " show" : ""}`}>Key must start with sk-ant-</div>
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Cancel</button>
          <button className="modal-save" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Quiz ─────────────────────────────────────────────────────
interface QuizState {
  idx: number;
  answers: (number | null)[];
  submitted: boolean[];
}

function Quiz({
  questions,
  color,
  onAllDone,
  onSaveResults,
  initialAnswers,
}: {
  questions: QuizQuestion[];
  color: string;
  onAllDone?: () => void;
  onSaveResults?: (answers: (number | null)[], score: string) => void;
  initialAnswers?: (number | null)[];
}) {
  // If answers were previously saved (quiz was completed), restore fully submitted state.
  const wasCompleted = !!initialAnswers;
  const [state, setState] = useState<QuizState>({
    idx: 0,
    answers: initialAnswers ?? new Array(questions.length).fill(null),
    submitted: wasCompleted
      ? new Array(questions.length).fill(true)
      : new Array(questions.length).fill(false),
  });
  const doneFiredRef = useRef(wasCompleted);

  // Fire save + completion when all questions become submitted (moved out of setState to avoid Strict Mode double-invoke)
  useEffect(() => {
    if (state.submitted.every(Boolean) && !doneFiredRef.current) {
      doneFiredRef.current = true;
      const correct = state.answers.filter((a, i) => a === questions[i].answer).length;
      const score = `${correct}/${questions.length}`;
      onSaveResults?.(state.answers, score);
      onAllDone?.();
    }
  }, [state.submitted]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = questions[state.idx];

  function select(oi: number) {
    if (state.submitted[state.idx]) return;
    setState(s => {
      const answers = [...s.answers];
      answers[s.idx] = oi;
      return { ...s, answers };
    });
  }

  function submit() {
    setState(s => {
      const submitted = [...s.submitted];
      submitted[s.idx] = true;
      return { ...s, submitted };
    });
  }

  function goQ(idx: number) {
    setState(s => ({ ...s, idx }));
  }

  const ans = state.answers[state.idx];
  const submitted = state.submitted[state.idx];

  return (
    <div id="qbody">
      <div className="quiz-q">{q.q}</div>
      <div className="quiz-options">
        {q.options.map((opt, oi) => {
          let cls = "quiz-opt";
          if (submitted) {
            if (oi === q.answer) cls += " correct";
            else if (oi === ans) cls += " wrong";
          } else if (oi === ans) {
            cls += " selected";
          }
          return (
            <button
              key={oi}
              className={cls}
              disabled={submitted}
              onClick={() => select(oi)}
            >
              <strong style={{ color, marginRight: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                {String.fromCharCode(65 + oi)}.
              </strong>
              {opt}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          className="quiz-submit"
          disabled={ans === null || submitted}
          onClick={submit}
        >
          Check answer
        </button>
        <div className="quiz-nav">
          {state.idx > 0 && (
            <button className="qnav-btn" onClick={() => goQ(state.idx - 1)}><ArrowLeft size={12} /> Prev</button>
          )}
          {state.idx < questions.length - 1 && (
            <button className="qnav-btn" onClick={() => goQ(state.idx + 1)}>Next <ArrowRight size={12} /></button>
          )}
          <span className="quiz-counter">{state.idx + 1}/{questions.length}</span>
        </div>
      </div>
      {submitted && (
        <div className={`quiz-feedback show ${ans === q.answer ? "pass" : "fail"}`}>
          {ans === q.answer
            ? <><CheckCircle2 size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }} />Correct! </>
            : <><XCircle size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }} />Not quite. </>
          }
          {q.explanation}
        </div>
      )}
    </div>
  );
}

// ── AI check ─────────────────────────────────────────────────
function AiCheck({
  prompt,
  checkGoal,
  apiKey,
  onNeedKey,
  onDone,
  onSaveResult,
  onSaveAnswer,
  multiLine = false,
  initialAnswer,
  initialResult,
}: {
  prompt: string;
  checkGoal: string;
  apiKey: string;
  onNeedKey: () => void;
  onDone?: () => void;
  onSaveResult?: (text: string) => void;
  onSaveAnswer?: (answer: string) => void;
  multiLine?: boolean;
  initialAnswer?: string;
  initialResult?: AiResultShape | null;
}) {
  const [answer, setAnswer] = useState(initialAnswer ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResultShape | null>(initialResult ?? null);
  const [errMsg, setErrMsg] = useState("");

  async function run() {
    if (!answer.trim()) return;
    if (!apiKey) { onNeedKey(); return; }
    // Persist the typed answer before sending so it survives navigation
    onSaveAnswer?.(answer);
    setLoading(true);
    setErrMsg("");
    setResult(null);

    const res = await fetch("/api/ai-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, checkGoal, apiKey }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      if (data.error === "NO_API_KEY" || data.error === "INVALID_KEY") {
        if (data.error === "INVALID_KEY") saveApiKeyLS("");
        onNeedKey();
        return;
      }
      setErrMsg(data.error ?? "Request failed.");
      return;
    }

    const data = await res.json();
    const text: string = data.text ?? "";
    const firstLine = text.split("\n")[0];
    let scoreClass = "score-partial";
    let scoreIcon: "pass" | "partial" | "fail" = "partial";
    if (/PASS/i.test(firstLine)) { scoreClass = "score-pass"; scoreIcon = "pass"; }
    else if (/NEEDS WORK/i.test(firstLine)) { scoreClass = "score-fail"; scoreIcon = "fail"; }
    const body = text.split("\n").slice(1).join("\n").trim();
    setResult({ scoreClass, scoreIcon, body });
    onSaveResult?.(text);
    onDone?.();
  }

  return (
    <div className="ai-check-area">
      <p className="ai-prompt">{prompt}</p>
      <textarea
        className="ai-input"
        placeholder="Paste your output or answer here..."
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        onBlur={() => { if (answer.trim()) onSaveAnswer?.(answer); }}
        style={multiLine ? { minHeight: 120 } : undefined}
      />
      <button className="ai-submit" disabled={loading || !answer.trim()} onClick={run}>
        {loading ? (
          <>
            <span className="loading-dots"><span /><span /><span /></span>
            Checking…
          </>
        ) : (
          "Check with AI"
        )}
      </button>
      {errMsg && (
        <div className="ai-response show" style={{ color: "var(--red)" }}>{errMsg}</div>
      )}
      {result && (
        <div className="ai-response show">
          <div className={`ai-score ${result.scoreClass}`}>
            {result.scoreIcon === "pass" && <CheckCircle2 size={12} />}
            {result.scoreIcon === "partial" && <MinusCircle size={12} />}
            {result.scoreIcon === "fail" && <AlertTriangle size={12} />}
            {result.scoreIcon === "pass" ? "PASS" : result.scoreIcon === "fail" ? "Needs Work" : "Partial"}
          </div>
          <div>{result.body}</div>
        </div>
      )}
    </div>
  );
}

// ── Step with collapsible code ────────────────────────────────
function ActivityStep({ s, bg, color }: { s: HandsOnStep; bg: string; color: string }) {
  const [showCode, setShowCode] = useState(false);
  return (
    <div className="activity-step">
      <div className="step-num" style={{ background: bg, color, border: `1px solid ${color}40` }}>{s.n}</div>
      <div className="step-content">
        <h4>{s.title}</h4>
        {s.body && <p>{s.body}</p>}
        {s.code && (
          <>
            <button className="show-code-btn" onClick={() => setShowCode(v => !v)}>
              {showCode ? <><ChevronDown size={11} /> Hide code</> : <><ChevronRight size={11} /> Show code</>}
            </button>
            {showCode && <div className="code-block">{s.code}</div>}
          </>
        )}
      </div>
    </div>
  );
}

// ── Activity renderer ─────────────────────────────────────────
function ActivityCard({
  activity,
  color,
  bg,
  apiKey,
  onNeedKey,
  onDone,
  dayKey,
}: {
  activity: Activity;
  color: string;
  bg: string;
  apiKey: string;
  onNeedKey: () => void;
  onDone?: () => void;
  dayKey: string;
}) {
  // Load any previously saved results for this day (component remounts on dayKey change)
  const saved = useMemo(() => loadDayResults(dayKey), [dayKey]);
  const savedAiResult = saved.aiResponse ? parseAiResult(saved.aiResponse) : null;
  const savedHandsonResult = saved.handsonAiResponse ? parseAiResult(saved.handsonAiResponse) : null;

  const [quizDone, setQuizDone] = useState(!!saved.quizAnswers);
  const [handsDone, setHandsDone] = useState(!!saved.handsonAiResponse);
  const combinedFiredRef = useRef(false);

  // Restore completion on mount for single-part activity types
  useEffect(() => {
    if (activity.type === "quiz" && saved.quizAnswers) onDone?.();
    else if (activity.type === "ai_open" && saved.aiResponse) onDone?.();
    else if (activity.type === "hands_on" && activity.aiCheck && saved.handsonAiResponse) onDone?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Combined: unlock when both parts done
  useEffect(() => {
    if (activity.type === "combined" && quizDone && handsDone && !combinedFiredRef.current) {
      combinedFiredRef.current = true;
      onDone?.();
    }
  }, [activity.type, quizDone, handsDone, onDone]);

  if (activity.type === "quiz" && activity.questions) {
    return (
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-icon" style={{ background: bg, color }}><Brain size={15} /></div>
          <div>
            <h3>Knowledge check</h3>
            <p>{activity.questions.length} question{activity.questions.length > 1 ? "s" : ""} — answer all to proceed</p>
          </div>
        </div>
        <div className="section-card-body">
          <Quiz
            questions={activity.questions}
            color={color}
            onAllDone={onDone}
            onSaveResults={(answers, score) =>
              mergeResult(dayKey, { quizAnswers: answers, quizScore: score })
            }
            initialAnswers={saved.quizAnswers}
          />
        </div>
      </div>
    );
  }

  if (activity.type === "combined") {
    const hasAiCheck = !!activity.aiCheck;
    return (
      <>
        {activity.questions && (
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-icon" style={{ background: bg, color }}><Brain size={15} /></div>
              <div>
                <h3>Knowledge check</h3>
                <p>{activity.questions.length} question{activity.questions.length > 1 ? "s" : ""} — answer all to proceed</p>
              </div>
            </div>
            <div className="section-card-body">
              <Quiz
                questions={activity.questions}
                color={color}
                onAllDone={() => setQuizDone(true)}
                onSaveResults={(answers, score) =>
                  mergeResult(dayKey, { quizAnswers: answers, quizScore: score })
                }
                initialAnswers={saved.quizAnswers}
              />
            </div>
          </div>
        )}
        <div className="section-card">
          <div className="section-card-header">
            <div className="section-icon" style={{ background: bg, color }}><Wrench size={15} /></div>
            <div>
              <h3>{activity.title}</h3>
              <p>{activity.intro}</p>
            </div>
          </div>
          <div className="section-card-body">
            <div className="activity-steps">
              {(activity.steps ?? []).map(s => (
                <ActivityStep key={s.n} s={s} bg={bg} color={color} />
              ))}
            </div>
            {hasAiCheck && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>AI verification check</h4>
                <AiCheck
                  prompt={activity.aiCheck!.prompt}
                  checkGoal={activity.aiCheck!.checkGoal}
                  apiKey={apiKey}
                  onNeedKey={onNeedKey}
                  onDone={() => setHandsDone(true)}
                  onSaveResult={text => mergeResult(dayKey, { handsonAiResponse: text })}
                  onSaveAnswer={ans => mergeResult(dayKey, { handsonAnswer: ans })}
                  initialAnswer={saved.handsonAnswer}
                  initialResult={savedHandsonResult}
                />
              </div>
            )}
            {!hasAiCheck && (
              <div style={{ marginTop: 16 }}>
                <button
                  className={`complete-steps-btn${handsDone ? " done" : ""}`}
                  onClick={() => setHandsDone(true)}
                  disabled={handsDone}
                >
                  {handsDone ? <><Check size={14} /> Steps marked complete</> : "Mark hands-on steps complete"}
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  if (activity.type === "hands_on") {
    const hasAiCheck = !!activity.aiCheck;
    return (
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-icon" style={{ background: bg, color }}><Wrench size={15} /></div>
          <div>
            <h3>{activity.title}</h3>
            <p>{activity.intro}</p>
          </div>
        </div>
        <div className="section-card-body">
          <div className="activity-steps">
            {(activity.steps ?? []).map(s => (
              <ActivityStep key={s.n} s={s} bg={bg} color={color} />
            ))}
          </div>
          {hasAiCheck && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>AI verification check</h4>
              <AiCheck
                prompt={activity.aiCheck!.prompt}
                checkGoal={activity.aiCheck!.checkGoal}
                apiKey={apiKey}
                onNeedKey={onNeedKey}
                onDone={onDone}
                onSaveResult={text => mergeResult(dayKey, { handsonAiResponse: text })}
                onSaveAnswer={ans => mergeResult(dayKey, { handsonAnswer: ans })}
                initialAnswer={saved.handsonAnswer}
                initialResult={savedHandsonResult}
              />
            </div>
          )}
          {!hasAiCheck && (
            <div style={{ marginTop: 16 }}>
              <ManualCompleteBtn onDone={onDone} />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activity.type === "ai_open") {
    return (
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-icon" style={{ background: bg, color }}><PenLine size={15} /></div>
          <div>
            <h3>Open-ended review</h3>
            <p>Test your understanding in your own words</p>
          </div>
        </div>
        <div className="section-card-body">
          <AiCheck
            prompt={activity.prompt ?? ""}
            checkGoal={activity.checkGoal ?? ""}
            apiKey={apiKey}
            onNeedKey={onNeedKey}
            onDone={onDone}
            onSaveResult={text => mergeResult(dayKey, { aiResponse: text })}
            onSaveAnswer={ans => mergeResult(dayKey, { aiAnswer: ans })}
            initialAnswer={saved.aiAnswer}
            initialResult={savedAiResult}
            multiLine
          />
        </div>
      </div>
    );
  }

  return null;
}

// Simple manual completion button for hands_on without aiCheck
function ManualCompleteBtn({ onDone }: { onDone?: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={`complete-steps-btn${done ? " done" : ""}`}
      onClick={() => { setDone(true); onDone?.(); }}
      disabled={done}
    >
      {done ? <><Check size={14} /> Steps marked complete</> : "Mark hands-on steps complete"}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function LearnPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [phases, setPhases] = useState<Phase[]>([]);
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [pos, setPos] = useState({ phase: 0, week: 0, day: 0 });
  const [openPhases, setOpenPhases] = useState<Set<number>>(new Set([0]));
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set(["0-0"]));
  const [apiKey, setApiKey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [activityDone, setActivityDone] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Load curriculum from database
  useEffect(() => {
    fetch("/api/curriculum")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPhases(data); })
      .catch(err => console.error("Failed to load curriculum:", err));
  }, []);

  // Load progress from server + API key from localStorage
  useEffect(() => {
    if (status !== "authenticated" || phases.length === 0) return;
    setApiKey(loadApiKeyLS());

    fetch("/api/progress")
      .then(r => r.json())
      .then(progressData => {
        const set = new Set<string>();
        for (const row of progressData.completed ?? []) {
          set.add(getDayKey(row.phase, row.week, row.day));
        }
        setCompletedSet(set);

        const first = getFirstIncompleteDay(phases, set);
        setPos(first);
        setOpenPhases(new Set([first.phase]));
        setOpenWeeks(new Set([`${first.phase}-${first.week}`]));
        setActivityDone(set.has(getDayKey(first.phase, first.week, first.day)));
        setLoaded(true);
      });
  }, [status, phases]);

  const totalDays = getTotalDays(phases);
  const doneCount = completedSet.size;
  const pct = totalDays > 0 ? Math.round((doneCount / totalDays) * 100) : 0;

  const markComplete = useCallback(async () => {
    const key = getDayKey(pos.phase, pos.week, pos.day);
    if (completedSet.has(key)) return;
    setCompletedSet(prev => new Set([...prev, key]));
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: pos.phase, week: pos.week, day: pos.day }),
    });
  }, [pos, completedSet]);

  function navigateTo(phase: number, week: number, day: number) {
    const key = getDayKey(phase, week, day);
    setPos({ phase, week, day });
    setActivityDone(completedSet.has(key));
    setOpenPhases(prev => new Set([...prev, phase]));
    setOpenWeeks(prev => new Set([...prev, `${phase}-${week}`]));
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function nextDay() {
    markComplete();
    const ph = phases[pos.phase];
    const wk = ph.weeks[pos.week];
    if (pos.day < wk.days.length - 1) navigateTo(pos.phase, pos.week, pos.day + 1);
    else if (pos.week < ph.weeks.length - 1) navigateTo(pos.phase, pos.week + 1, 0);
    else if (pos.phase < phases.length - 1) navigateTo(pos.phase + 1, 0, 0);
  }

  function prevDay() {
    if (pos.day > 0) navigateTo(pos.phase, pos.week, pos.day - 1);
    else if (pos.week > 0) {
      const pw = phases[pos.phase].weeks[pos.week - 1];
      navigateTo(pos.phase, pos.week - 1, pw.days.length - 1);
    } else if (pos.phase > 0) {
      const pp = phases[pos.phase - 1];
      const lw = pp.weeks[pp.weeks.length - 1];
      navigateTo(pos.phase - 1, pp.weeks.length - 1, lw.days.length - 1);
    }
  }

  function handleSaveApiKey(key: string) {
    saveApiKeyLS(key);
    setApiKey(key);
    setShowKeyModal(false);
  }

  const handleActivityDone = useCallback(() => setActivityDone(true), []);

  if (status === "loading" || !loaded || phases.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text2)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  const phase = phases[pos.phase];
  const week = phase.weeks[pos.week];
  const day = week.days[pos.day];
  const currentKey = getDayKey(pos.phase, pos.week, pos.day);
  const isCompleted = completedSet.has(currentKey);
  const canProceed = activityDone || isCompleted;

  return (
    <div className="app">
      {/* ── Sidebar ── */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <h1>Drupal <span>// Learn</span></h1>
        </div>
        <div className="sidebar-user">
          <span>{session?.user?.email}</span>
          <button className="signout-btn" onClick={() => signOut({ callbackUrl: "/login" })}>sign out</button>
        </div>

        <div className="phase-nav">
          {phases.map((ph, pi) => (
            <div
              key={pi}
              className={`phase-group${openPhases.has(pi) ? " open" : ""}`}
            >
              <button
                className={`phase-header-btn${pos.phase === pi ? " active" : ""}`}
                onClick={() =>
                  setOpenPhases(prev => {
                    const next = new Set(prev);
                    if (next.has(pi)) next.delete(pi);
                    else next.add(pi);
                    return next;
                  })
                }
              >
                <span
                  className="phase-dot"
                  style={{
                    background: ph.bg,
                    color: ph.color,
                    border: `1px solid ${ph.color}40`,
                  }}
                >
                  {ph.id}
                </span>
                {ph.label}
              </button>

              <div className="week-items">
                {ph.weeks.map((wk, wi) => {
                  const weekKey = `${pi}-${wi}`;
                  const weekOpen = openWeeks.has(weekKey);
                  const weekLocked = isDayLocked(phases, completedSet, pi, wi, 0) && !(pi === 0 && wi === 0);
                  return (
                    <div key={wi} className={`week-group${weekOpen ? " open" : ""}`}>
                      <button
                        className={`week-group-header${pos.phase === pi && pos.week === wi ? " active" : ""}${weekLocked ? " locked" : ""}`}
                        onClick={() => {
                          setOpenWeeks(prev => {
                            const next = new Set(prev);
                            if (next.has(weekKey)) next.delete(weekKey);
                            else next.add(weekKey);
                            return next;
                          });
                        }}
                      >
                        <span className="week-toggle">{weekOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}</span>
                        {wk.label}: {wk.name}
                        {weekLocked && <span className="lock-icon"><Lock size={10} /></span>}
                      </button>
                      <div className="day-items">
                        {wk.days.map((d, di) => {
                          const dayLocked = isDayLocked(phases, completedSet, pi, wi, di);
                          const dayDone = completedSet.has(getDayKey(pi, wi, di));
                          const isActive = pos.phase === pi && pos.week === wi && pos.day === di;
                          return (
                            <button
                              key={di}
                              className={`day-btn${isActive ? " active" : ""}${dayLocked ? " locked" : ""}${dayDone && !isActive ? " done" : ""}`}
                              onClick={() => {
                                if (dayLocked) return;
                                navigateTo(pi, wi, di);
                              }}
                            >
                              {dayDone && !isActive && <Check size={10} style={{ marginRight: 4, flexShrink: 0 }} />}
                              {dayLocked && <Lock size={10} style={{ marginRight: 4, flexShrink: 0 }} />}
                              <span>{d.day}: {d.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          <button className="api-key-btn" onClick={() => setShowKeyModal(true)}>
            <KeyRound size={13} />
            <span>{apiKey ? <>API key set <Check size={11} style={{ display: "inline", verticalAlign: "middle" }} /></> : "Set API key for AI checks"}</span>
          </button>
          <div className="sp-label">
            <span>Overall progress</span>
            <span>{pct}%</span>
          </div>
          <div className="sp-bar">
            <div className="sp-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="main" ref={mainRef}>
        <div className="content">
          {/* Day header */}
          <div className="day-header">
            <div
              className="day-number"
              style={{
                background: phase.bg,
                color: phase.color,
                border: `1px solid ${phase.color}30`,
              }}
            >
              {phase.label} / {week.label} / {day.day}
            </div>
            <div className="day-meta">
              <h2>{day.title}</h2>
              <p>{day.goal}</p>
            </div>
          </div>

          {/* Reading */}
          {day.reading?.length > 0 && (
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-icon" style={{ background: phase.bg, color: phase.color }}><BookOpen size={15} /></div>
                <div>
                  <h3>What to learn</h3>
                  <p>Read through before starting the activity</p>
                </div>
              </div>
              <div className="section-card-body">
                {day.reading.map((r, ri) => (
                  <div key={ri} className="read-item">
                    <div className="read-bullet" style={{ background: `${phase.color}80` }} />
                    <div>
                      <p
                        dangerouslySetInnerHTML={{
                          __html: `<strong>${r.title}</strong> — ${r.body}`,
                        }}
                      />
                      {r.link && (
                        <a className="read-link" href={r.link} target="_blank" rel="noreferrer">
                          <ExternalLink size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                          {r.link.replace("https://", "")}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity */}
          {day.activity && (
            <ActivityCard
              key={currentKey}
              activity={day.activity}
              color={phase.color}
              bg={phase.bg}
              apiKey={apiKey}
              onNeedKey={() => setShowKeyModal(true)}
              onDone={handleActivityDone}
              dayKey={currentKey}
            />
          )}

          {/* Completion badge */}
          <div className={`day-complete${isCompleted ? " show" : ""}`}>
            <CheckCircle2 size={15} />
            Day completed
          </div>

          {/* Nav buttons */}
          <div className="day-nav">
            <button
              className="nav-btn"
              onClick={prevDay}
              disabled={pos.phase === 0 && pos.week === 0 && pos.day === 0}
            >
              <ArrowLeft size={14} /> Previous
            </button>
            <button
              className="nav-btn next"
              onClick={nextDay}
              disabled={!canProceed}
              title={!canProceed ? "Complete the activity above to proceed" : undefined}
            >
              Mark complete &amp; next <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </main>

      {/* API key modal */}
      {showKeyModal && (
        <ApiKeyModal
          current={apiKey}
          onSave={handleSaveApiKey}
          onClose={() => setShowKeyModal(false)}
        />
      )}
    </div>
  );
}

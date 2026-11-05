import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Attempt } from '../types';
import { provider } from '../data';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

type SafeQuestion = {
  id: string;
  body: string;
  topic: string;
  qtype: 'mcq_single' | 'mcq_multi' | 'true_false';
  options: Array<{ id: string; label: string }>;
};

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function Assessment() {
  const { attemptId = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<SafeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [marked, setMarked] = useState<string[]>([]);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const autoSubmitted = useRef(false);

  // load attempt + questions
  useEffect(() => {
    let active = true;
    (async () => {
      const a = await provider.getAttempt(attemptId);
      if (!active) return;
      if (!a) {
        setError('Assessment attempt not found.');
        setLoading(false);
        return;
      }
      if (user && a.userId !== user.id) {
        setError('You do not have access to this assessment attempt.');
        setLoading(false);
        return;
      }
      if (a.status !== 'in_progress') {
        navigate(`/assess/${attemptId}/result`, { replace: true });
        return;
      }
      const qs = (await provider.getAttemptQuestions(attemptId)) as SafeQuestion[];
      if (!active) return;
      setAttempt(a);
      setQuestions(qs);
      setAnswers(a.answers ?? {});
      setMarked(a.markedForReview ?? []);
      const elapsed = Math.floor((Date.now() - Date.parse(a.startedAt)) / 1000);
      setRemaining(Math.max(0, a.durationSec - elapsed));
      setLoading(false);
    })().catch((e: unknown) => {
      setError(e instanceof Error ? e.message : 'Could not load the assessment.');
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [attemptId, navigate, user]);

  const submit = useCallback(async () => {
    if (submitting || autoSubmitted.current) return;
    autoSubmitted.current = true;
    setSubmitting(true);
    try {
      await provider.submitAttempt(attemptId);
      navigate(`/assess/${attemptId}/result`, { replace: true });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Submission failed. Please try again.');
      setSubmitting(false);
      autoSubmitted.current = false;
    }
  }, [attemptId, navigate, submitting]);

  // countdown + auto-submit
  useEffect(() => {
    if (loading || !attempt || remaining <= 0) return;
    const t = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(t);
          void submit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [loading, attempt, submit]); // intentionally not re-running on every tick

  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id] ?? []).length > 0).length,
    [questions, answers],
  );

  if (loading) return <Spinner label="Loading your assessment…" />;
  if (error) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">{error}</h1>
        <Link to="/dashboard" className="btn-primary mt-6">Back to dashboard</Link>
      </div>
    );
  }
  if (!attempt || questions.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">No questions available</h1>
        <p className="mt-2 text-slate-600">This assessment could not be prepared.</p>
        <Link to="/certifications" className="btn-primary mt-6">Browse certifications</Link>
      </div>
    );
  }

  const q = questions[Math.min(index, questions.length - 1)];
  const selected = answers[q.id] ?? [];
  const isMarked = marked.includes(q.id);
  const lowTime = remaining <= 60;

  async function choose(optionId: string) {
    if (!q || attempt?.status !== 'in_progress') return;
    const current = answers[q.id] ?? [];
    const next = q.qtype === 'mcq_multi'
      ? current.includes(optionId)
        ? current.filter((x) => x !== optionId)
        : [...current, optionId]
      : [optionId];
    setAnswers((prev) => ({ ...prev, [q.id]: next }));
    try {
      await provider.saveAnswer(attemptId, q.id, next);
      setSaveError(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save your answer.');
    }
  }

  async function toggleMark() {
    if (!q) return;
    const next = marked.includes(q.id) ? marked.filter((x) => x !== q.id) : [...marked, q.id];
    setMarked(next);
    try {
      await provider.toggleMarkForReview(attemptId, q.id);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not update the review flag.');
    }
  }

  return (
    <div className="container-page py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Assessment in progress</p>
          <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl">
            Question {index + 1} of {questions.length}
          </h1>
        </div>
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg font-semibold ${
            lowTime ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-white text-ink ring-1 ring-slate-200'
          }`}
          role="timer"
          aria-live={lowTime ? 'polite' : 'off'}
        >
          <span aria-hidden>⏱</span>
          {fmt(remaining)}
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-brand-600 transition-all"
          style={{ width: `${(answeredCount / questions.length) * 100}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        {answeredCount} of {questions.length} answered · {marked.length} marked for review
      </p>

      {saveError && (
        <div className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 ring-1 ring-red-200" role="alert">
          {saveError}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Question */}
        <section className="card p-6" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <span className="chip bg-brand-50 text-brand-800 ring-1 ring-brand-200">{q.topic}</span>
            <span className="text-xs text-slate-500">
              {q.qtype === 'mcq_multi' ? 'Select all that apply' : 'Select one answer'}
            </span>
          </div>

          <h2 className="mt-4 text-lg font-medium leading-relaxed text-ink">{q.body}</h2>

          <fieldset className="mt-5">
            <legend className="sr-only">Answer options</legend>
            <div className="space-y-3">
              {q.options.map((o) => {
                const checked = selected.includes(o.id);
                const multi = q.qtype === 'mcq_multi';
                return (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                      checked ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-brand-300'
                    }`}
                  >
                    <input
                      type={multi ? 'checkbox' : 'radio'}
                      name={`q-${q.id}`}
                      className="mt-0.5 h-4 w-4 border-slate-300 text-brand-700 focus:ring-brand-500"
                      checked={checked}
                      onChange={() => void choose(o.id)}
                    />
                    <span className="text-sm text-ink">{o.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-outline"
              onClick={() => void toggleMark()}
              aria-pressed={isMarked}
            >
              {isMarked ? '★ Marked for review' : '☆ Mark for review'}
            </button>
            <div className="ml-auto flex gap-2">
              <button type="button" className="btn-outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
                Previous
              </button>
              {index < questions.length - 1 ? (
                <button type="button" className="btn-primary" onClick={() => setIndex((i) => i + 1)}>
                  Next
                </button>
              ) : (
                <button type="button" className="btn-primary" onClick={() => setConfirmOpen(true)}>
                  Review & submit
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Palette */}
        <aside className="card h-fit p-5">
          <h2 className="text-sm font-semibold text-ink">Question navigator</h2>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {questions.map((qq, i) => {
              const isAnswered = (answers[qq.id] ?? []).length > 0;
              const isMarkedQ = marked.includes(qq.id);
              const isCurrent = i === index;
              return (
                <button
                  key={qq.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`grid h-9 w-9 place-items-center rounded-md text-xs font-semibold ring-1 transition ${
                    isCurrent
                      ? 'bg-brand-700 text-white ring-brand-700'
                      : isMarkedQ
                        ? 'bg-saffron-100 text-saffron-700 ring-saffron-300'
                        : isAnswered
                          ? 'bg-brand-50 text-brand-800 ring-brand-200'
                          : 'bg-white text-slate-500 ring-slate-200 hover:ring-brand-300'
                  }`}
                  aria-label={`Go to question ${i + 1}${isAnswered ? ', answered' : ', unanswered'}${isMarkedQ ? ', marked for review' : ''}`}
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
            <li><span className="mr-2 inline-block h-3 w-3 rounded bg-brand-50 ring-1 ring-brand-200" />Answered</li>
            <li><span className="mr-2 inline-block h-3 w-3 rounded bg-saffron-100 ring-1 ring-saffron-300" />Marked</li>
            <li><span className="mr-2 inline-block h-3 w-3 rounded bg-white ring-1 ring-slate-200" />Unanswered</li>
          </ul>
          <button type="button" className="btn-accent mt-5 w-full" onClick={() => setConfirmOpen(true)}>
            Submit assessment
          </button>
        </aside>
      </div>

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lift">
            <h2 id="confirm-title" className="font-display text-xl font-semibold text-ink">Submit your assessment?</h2>
            <p className="mt-2 text-sm text-slate-600">
              You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions. Once
              submitted, your answers are final and cannot be changed. Unanswered questions score zero.
            </p>
            {marked.length > 0 && (
              <p className="mt-2 text-sm text-saffron-700">{marked.length} question(s) are still marked for review.</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn-outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>
                Keep working
              </button>
              <button type="button" className="btn-primary" onClick={() => void submit()} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

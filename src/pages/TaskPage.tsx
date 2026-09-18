import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getTask,
  submitMcqTask,
  checkReflectSimilarity,
  submitReflectTask,
  ApiError,
} from "../api/client";
import type {
  TaskResponse,
  McqTaskResponse,
  ReflectTaskResponse,
  ComprehensionQuestionClient,
  VocabularyQuestionClient,
  McqSubmitResult,
  ReflectSubmitResult,
} from "../api/types";
import { SplitPane } from "../components/SplitPane";
import { Modal } from "../components/Modal";
import { PupilHeader } from "../components/PupilHeader";
import "./TaskPage.css";

type McqAnswer = { selectedIndex: number; chunkId?: string };

export function TaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const id = Number(taskId);

  const [task, setTask] = useState<TaskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTask(null);
    setError(null);
    getTask(id)
      .then(setTask)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this task."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="page">Loading…</p>;
  if (error)
    return (
      <div className="page">
        <div className="error-banner">{error}</div>
        <Link to="/">← Back to the Pressroom</Link>
      </div>
    );
  if (!task) return null;

  return task.type === "reflect" ? (
    <ReflectTaskView key={task.taskId + ":" + task.attemptNumber} task={task} />
  ) : (
    <McqTaskView key={task.taskId + ":" + task.attemptNumber} task={task} />
  );
}

// ============================================================
// Comprehension / Vocabulary
// ============================================================

function McqTaskView({ task }: { task: McqTaskResponse }) {
  const navigate = useNavigate();
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, McqAnswer>>({});
  const [result, setResult] = useState<McqSubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const question = task.questions[qIndex];
  const isComprehension = task.type === "comprehension";
  const current = answers[question.id];
  const canAdvance = isComprehension ? current?.selectedIndex !== undefined && current?.chunkId : current?.selectedIndex !== undefined;
  const isLast = qIndex === task.questions.length - 1;

  function selectOption(idx: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: { ...prev[question.id], selectedIndex: idx } }));
  }
  function selectChunk(chunkId: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: { ...prev[question.id], chunkId } }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const r = await submitMcqTask(task.taskId, answers);
      setResult(r);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Couldn't submit — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <McqResultView
        result={result}
        taskType={task.type}
        onRetry={() => window.location.reload()}
        onBack={() => navigate("/")}
      />
    );
  }

  return (
    <>
      <PupilHeader />
      <SplitPane
        left={<ArticleReader article={task.article} highlightChunkId={isComprehension ? current?.chunkId : undefined} onChunkClick={isComprehension ? selectChunk : undefined} />}
        right={
          <div>
            <div className="task-progress">
              Question {qIndex + 1} of {task.questions.length}
            </div>
            <div className="task-progress-bar">
              <div className="task-progress-bar__fill" style={{ width: `${((qIndex + 1) / task.questions.length) * 100}%` }} />
            </div>

            {isComprehension ? (
              <ComprehensionQuestionBlock question={question as ComprehensionQuestionClient} />
            ) : (
              <VocabularyQuestionBlock question={question as VocabularyQuestionClient} contextSentence={(question as VocabularyQuestionClient).contextSentence} />
            )}

            <div className="options-list">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  className={`option-btn ${current?.selectedIndex === i ? "option-btn--selected" : ""}`}
                  onClick={() => selectOption(i)}
                >
                  {opt}
                </button>
              ))}
            </div>

            {isComprehension && (
              <p className="task-hint">
                {current?.chunkId ? "✓ Evidence selected in the article." : "👈 Click the sentence in the article that proves your answer."}
              </p>
            )}

            {submitError && <div className="error-banner">{submitError}</div>}

            <div className="task-nav">
              <button className="btn btn--outline" disabled={qIndex === 0} onClick={() => setQIndex((i) => i - 1)}>
                ← Previous
              </button>
              {isLast ? (
                <button className="btn btn--accent" disabled={!canAdvance || submitting} onClick={handleSubmit}>
                  {submitting ? "Submitting…" : "Submit"}
                </button>
              ) : (
                <button className="btn" disabled={!canAdvance} onClick={() => setQIndex((i) => i + 1)}>
                  Next →
                </button>
              )}
            </div>
          </div>
        }
      />
    </>
  );
}

function ComprehensionQuestionBlock({ question }: { question: ComprehensionQuestionClient }) {
  return <h2 className="task-question">{question.question}</h2>;
}

function VocabularyQuestionBlock({ question }: { question: VocabularyQuestionClient; contextSentence: string }) {
  const parts = question.contextSentence.split(new RegExp(`(${escapeRegExp(question.targetWord)})`, "i"));
  return (
    <div>
      <h2 className="task-question">Which word best replaces "{question.targetWord}" here?</h2>
      <p className="vocab-context">
        {parts.map((part, i) =>
          part.toLowerCase() === question.targetWord.toLowerCase() ? (
            <mark key={i}>{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>
    </div>
  );
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function McqResultView({
  result,
  taskType,
  onRetry,
  onBack,
}: {
  result: McqSubmitResult;
  taskType: "comprehension" | "vocabulary";
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <PupilHeader />
      <div className="page">
        <div className="card result-card">
          <h1>{result.passed ? "🎉 Nice work!" : "Not quite a passing story yet"}</h1>
          <p style={{ fontSize: 18 }}>
            You got <strong>{result.correctCount}</strong> out of <strong>{result.total}</strong> correct (
            {Math.round(result.score * 100)}%). You need {Math.round(result.passThreshold * 100)}% to pass.
          </p>

          {result.xpAwardedThisAttempt ? (
            <p className="result-note result-note--good">This was your first attempt — XP has been added!</p>
          ) : (
            <p className="result-note">
              Retries don't earn extra XP, but passing now still gets this {taskType} task published.
            </p>
          )}
          {result.leveledUp && <p className="result-note result-note--good">⬆️ You've levelled up!</p>}
          {result.newlyPublished && (
            <p className="result-note result-note--good">📰 This article is now fully published on your wall!</p>
          )}

          <div className="result-breakdown">
            {Object.entries(result.perQuestionResult).map(([qid, r]) => (
              <div key={qid} className={`result-row ${r.correct ? "result-row--correct" : "result-row--wrong"}`}>
                {r.correct ? "✅" : "❌"} {qid.toUpperCase()}
                {!r.correct && <span> — correct answer: {r.correctOptionText}</span>}
              </div>
            ))}
          </div>

          <div className="task-nav" style={{ marginTop: 24 }}>
            <button className="btn btn--outline" onClick={onBack}>
              Back to Pressroom
            </button>
            {!result.passed && (
              <button className="btn btn--accent" onClick={onRetry}>
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// Article reader (shared left pane)
// ============================================================

function ArticleReader({
  article,
  highlightChunkId,
  onChunkClick,
}: {
  article: TaskResponse["article"];
  highlightChunkId?: string;
  onChunkClick?: (chunkId: string) => void;
}) {
  return (
    <article>
      <p className="article-meta">
        {article.sourceName} · {article.publishDate} {article.section ? `· ${article.section}` : ""}
      </p>
      <h1 className="article-title">{article.title}</h1>
      <div className="article-body">
        {onChunkClick
          ? article.textChunks.map((c) => (
              <span
                key={c.chunk_id}
                className={`chunk ${highlightChunkId === c.chunk_id ? "chunk--selected" : ""}`}
                onClick={() => onChunkClick(c.chunk_id)}
              >
                {c.text}{" "}
              </span>
            ))
          : article.fullText.split("\n").map((para, i) => <p key={i}>{para}</p>)}
      </div>
    </article>
  );
}

// ============================================================
// Reflect
// ============================================================

function ReflectTaskView({ task }: { task: ReflectTaskResponse }) {
  const navigate = useNavigate();
  const [short, setShort] = useState("");
  const [long, setLong] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ReflectSubmitResult | null>(null);

  async function handleSubmitClick() {
    setSubmitError(null);
    if (task.attemptNumber > 1) {
      setChecking(true);
      try {
        const check = await checkReflectSimilarity(task.taskId, short, long);
        setChecking(false);
        if (check.blocked) {
          setWarning(check.message ?? "This looks very close to one of the sample answers — try putting it in your own words.");
          return;
        }
      } catch (err) {
        setChecking(false);
        setSubmitError(err instanceof ApiError ? err.message : "Couldn't check your answer — try again.");
        return;
      }
    }
    await doSubmit();
  }

  async function doSubmit() {
    setSubmitting(true);
    try {
      const r = await submitReflectTask(task.taskId, short, long);
      setResult(r);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Couldn't submit — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <>
        <PupilHeader />
        <div className="page">
          <div className="card result-card">
            <h1>📰 Submitted!</h1>
            {result.xpAwardedThisAttempt && (
              <p className="result-note result-note--good">This was your first attempt — XP has been added!</p>
            )}
            {result.leveledUp && <p className="result-note result-note--good">⬆️ You've levelled up!</p>}
            {result.newlyPublished && (
              <p className="result-note result-note--good">📰 This article is now fully published on your wall!</p>
            )}
            {result.similarityFlagged && (
              <p className="result-note result-note--warn">
                Your teacher will take a look at this one — it was quite close to one of the sample answers.
              </p>
            )}

            <h2 style={{ marginTop: 24 }}>Other reporters' takes</h2>
            <p style={{ color: "var(--ink-light)", fontSize: 14 }}>
              Here's how three other reporters answered the same question — everyone sees it differently.
            </p>
            <div className="model-answers">
              {result.modelAnswers.map((a, i) => (
                <div key={i} className="card model-answer">
                  {a}
                </div>
              ))}
            </div>

            <div className="task-nav" style={{ marginTop: 24 }}>
              <button className="btn btn--outline" onClick={() => navigate("/")}>
                Back to Pressroom
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PupilHeader />
      <SplitPane
        left={<ArticleReader article={task.article} />}
        right={
          <div>
            <h2 className="task-question">{task.prompt}</h2>

            <div className="field">
              <label>Your view, in one line</label>
              <input value={short} onChange={(e) => setShort(e.target.value)} placeholder="What do you think?" />
            </div>
            <div className="field">
              <label>Your reasons</label>
              <textarea
                rows={8}
                value={long}
                onChange={(e) => setLong(e.target.value)}
                placeholder="Why do you think that? Explain in your own words."
              />
            </div>

            {task.attemptNumber > 1 && (
              <p className="task-hint">
                This is a retry — your first attempt already counted for XP. Try answering in your own words; we'll
                flag anything that looks copied from the sample answers for your teacher to look over.
              </p>
            )}

            {submitError && <div className="error-banner">{submitError}</div>}

            <div className="task-nav">
              <button className="btn btn--outline" onClick={() => navigate("/")}>
                Back
              </button>
              <button
                className="btn btn--accent"
                disabled={!short.trim() || !long.trim() || checking || submitting}
                onClick={handleSubmitClick}
              >
                {checking ? "Checking…" : submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        }
      />

      {warning && (
        <Modal title="Try putting it in your own words" onClose={() => setWarning(null)}>
          <p>{warning}</p>
          <div className="task-nav" style={{ marginTop: 12 }}>
            <button className="btn btn--outline" onClick={() => setWarning(null)}>
              Let me revise it
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

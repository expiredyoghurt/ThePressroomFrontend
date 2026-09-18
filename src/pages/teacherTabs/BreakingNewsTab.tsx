import { useState } from "react";
import { getImportPrompt, importArticleJson, publishArticle, uploadThumbnail, ApiError } from "../../api/client";
import type { ImportBundle } from "../../api/types";

type Stage = "idle" | "draft-ready" | "published";

export function BreakingNewsTab({ classId: _classId }: { classId: number }) {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy Prompt");

  const [pasteValue, setPasteValue] = useState("");
  const [parsed, setParsed] = useState<ImportBundle | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [articleId, setArticleId] = useState<number | null>(null);

  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbStatus, setThumbStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");

  async function handleShowPrompt() {
    setPromptError(null);
    try {
      const r = await getImportPrompt();
      setPrompt(r.prompt);
    } catch (err) {
      setPromptError(err instanceof ApiError ? err.message : "Couldn't load the prompt.");
    }
  }

  async function handleCopy() {
    if (!prompt) await handleShowPrompt();
    if (prompt) {
      await navigator.clipboard.writeText(prompt);
      setCopyLabel("Copied ✓");
      setTimeout(() => setCopyLabel("Copy Prompt"), 2000);
    }
  }

  async function handleImport() {
    setImportError(null);
    setImporting(true);
    let bundle: ImportBundle;
    try {
      bundle = JSON.parse(pasteValue);
    } catch {
      setImportError("That doesn't look like valid JSON — check for a missing bracket or an unescaped quote.");
      setImporting(false);
      return;
    }
    try {
      const r = await importArticleJson(bundle);
      setParsed(bundle);
      setArticleId(r.articleId);
      setStage("draft-ready");
    } catch (err) {
      setImportError(err instanceof ApiError ? err.message : "Import failed — try again.");
    } finally {
      setImporting(false);
    }
  }

  async function handlePublish() {
    if (!articleId) return;
    try {
      await publishArticle(articleId);
      setStage("published");
    } catch (err) {
      setImportError(err instanceof ApiError ? err.message : "Couldn't publish — try again.");
    }
  }

  async function handleThumbnailUpload() {
    if (!articleId || !thumbFile) return;
    setThumbStatus("uploading");
    try {
      await uploadThumbnail(articleId, thumbFile);
      setThumbStatus("done");
    } catch {
      setThumbStatus("error");
    }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h2>1. Get the prompt</h2>
        <p style={{ color: "var(--ink-light)" }}>
          Copy this and paste it into ChatGPT, Google Gemini, Claude, or any other AI chat tool — along with a photo
          of the newspaper page. No AI account or API key is needed inside this app; you use whatever AI tool you
          already have.
        </p>
        {promptError && <div className="error-banner">{promptError}</div>}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button className="btn btn--accent" onClick={handleCopy}>
            {copyLabel}
          </button>
          <button className="btn btn--outline" onClick={handleShowPrompt}>
            {prompt ? "Hide" : "Show"} prompt text
          </button>
        </div>
        {prompt && (
          <textarea readOnly value={prompt} rows={10} style={{ width: "100%", fontFamily: "monospace", fontSize: 12 }} />
        )}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2>2. Paste the AI's JSON reply</h2>
        <p style={{ color: "var(--ink-light)" }}>
          Once the AI gives you back its JSON output, paste the whole thing below.
        </p>
        <textarea
          value={pasteValue}
          onChange={(e) => setPasteValue(e.target.value)}
          rows={10}
          placeholder="Paste the JSON block here…"
          style={{ width: "100%", fontFamily: "monospace", fontSize: 12, marginBottom: 10 }}
        />
        {importError && <div className="error-banner">{importError}</div>}
        <button className="btn btn--accent" disabled={!pasteValue.trim() || importing} onClick={handleImport}>
          {importing ? "Validating…" : "Validate & Import"}
        </button>
      </div>

      {stage === "draft-ready" && parsed && (
        <div className="card">
          <h2>3. Review before publishing</h2>
          <p style={{ color: "var(--ink-light)" }}>
            This draft is saved but <strong>not visible to pupils yet</strong>. Check it over, then publish.
          </p>

          <h3>{parsed.title}</h3>
          <p style={{ fontSize: 13, color: "var(--ink-light)" }}>
            {parsed.sourceName} · {parsed.publishDate} · {parsed.section}
          </p>
          <p style={{ whiteSpace: "pre-wrap" }}>{parsed.fullText}</p>

          <h3 style={{ marginTop: 20 }}>Comprehension ({parsed.comprehension.questions.length} questions)</h3>
          {parsed.comprehension.questions.map((q) => (
            <div key={q.id} style={{ marginBottom: 10 }}>
              <strong>{q.question}</strong>
              <ul>
                {q.options.map((o, i) => (
                  <li key={i} style={{ fontWeight: i === q.correct_index ? 700 : 400 }}>
                    {o} {i === q.correct_index ? "✓" : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <h3>Vocabulary</h3>
          {parsed.vocabulary.questions.map((q) => (
            <div key={q.id} style={{ marginBottom: 10 }}>
              <strong>{q.target_word}</strong> ({q.word_class}) — "{q.context_sentence}"
              <ul>
                {q.options.map((o, i) => (
                  <li key={i} style={{ fontWeight: i === q.correct_index ? 700 : 400 }}>
                    {o.text} [{o.role}] {i === q.correct_index ? "✓" : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <h3>Think & Respond</h3>
          <p>{parsed.reflect.prompt}</p>
          <ul>
            {parsed.reflect.model_answers.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>

          <h3 style={{ marginTop: 20 }}>Optional: add a thumbnail</h3>
          <p style={{ color: "var(--ink-light)", fontSize: 14 }}>
            You already have the newspaper photo from step 1 — upload it here to give this article a proper
            picture on the Published wall instead of a placeholder icon. Skip this if you'd rather not.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
            />
            <button className="btn btn--sm btn--outline" disabled={!thumbFile || thumbStatus === "uploading"} onClick={handleThumbnailUpload}>
              {thumbStatus === "uploading" ? "Uploading…" : "Upload thumbnail"}
            </button>
            {thumbStatus === "done" && <span className="result-note result-note--good">✓ Uploaded</span>}
            {thumbStatus === "error" && <span className="result-note" style={{ color: "var(--accent)" }}>Upload failed — try again.</span>}
          </div>

          <button className="btn btn--accent" onClick={handlePublish} style={{ marginTop: 10 }}>
            Publish to pupils
          </button>
        </div>
      )}

      {stage === "published" && (
        <div className="card">
          <p className="result-note result-note--good">
            ✅ Published! Pupils will now see this in their Pressroom.
          </p>
        </div>
      )}
    </div>
  );
}

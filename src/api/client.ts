import { getSession, setSession, clearSession } from "./session";
import type {
  PupilSummary,
  ArticleSummary,
  TaskResponse,
  McqSubmitResult,
  ReflectCheckResult,
  ReflectSubmitResult,
  RankingEntry,
  ParentRosterEntry,
  WallBadge,
  ReviewQueueEntry,
  ImportBundle,
  Role,
  GoatScope,
  GoatListEntry,
  GoatPickDetail,
  AdminGoatPick,
} from "./types";

// Vite env var — set VITE_API_BASE_URL in .env / .env.production to point at
// the deployed Worker (e.g. https://the-pressroom.<subdomain>.workers.dev).
// Falls back to same-origin, which works fine if the Worker is deployed
// behind the same domain as this static site via a Cloudflare Pages route.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = getSession();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (session) headers.set("Authorization", `Bearer ${session.token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearSession();
    throw new ApiError(401, "Session expired — please log in again.");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

// ---- Auth ----

export async function pupilLogin(reporterId: string, pressPass: string) {
  const result = await apiFetch<{ token: string; student: PupilSummary }>("/api/auth/pupil/login", {
    method: "POST",
    body: JSON.stringify({ reporterId, pressPass }),
  });
  setSession({ kind: "pupil", token: result.token });
  return result.student;
}

export async function teacherLogin(email: string, password: string) {
  const result = await apiFetch<{ token: string; role: Role }>("/api/auth/teacher/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setSession({ kind: "teacher", token: result.token, role: result.role });
  return result.role;
}

export async function parentLogin(classId: number, password: string) {
  const result = await apiFetch<{ token: string }>("/api/auth/parent/login", {
    method: "POST",
    body: JSON.stringify({ classId, password }),
  });
  setSession({ kind: "parent", token: result.token });
}

export function logout() {
  clearSession();
}

// ---- Pupil: articles / pressroom ----

export function listArticles() {
  return apiFetch<{ articles: ArticleSummary[] }>("/api/articles");
}

export function getWall() {
  return apiFetch<{ badges: WallBadge[] }>("/api/wall");
}

export function getRankings() {
  return apiFetch<{ rankingsEnabled: boolean; roster: RankingEntry[] }>("/api/rankings");
}

// ---- Tasks ----

export function getTask(taskId: number) {
  return apiFetch<TaskResponse>(`/api/tasks/${taskId}`);
}

export function submitMcqTask(taskId: number, answers: Record<string, { selectedIndex: number; chunkId?: string }>) {
  return apiFetch<McqSubmitResult>(`/api/tasks/${taskId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export function checkReflectSimilarity(taskId: number, short: string, long: string) {
  return apiFetch<ReflectCheckResult>(`/api/tasks/${taskId}/reflect/check`, {
    method: "POST",
    body: JSON.stringify({ short, long }),
  });
}

export function submitReflectTask(taskId: number, short: string, long: string) {
  return apiFetch<ReflectSubmitResult>(`/api/tasks/${taskId}/reflect/submit`, {
    method: "POST",
    body: JSON.stringify({ short, long }),
  });
}

// ---- Parent ----

export function getParentClass() {
  return apiFetch<{ rankingsEnabled: boolean; roster: ParentRosterEntry[] }>("/api/parent/class");
}

// ---- Admin: roster ----

// ---- Admin: classes / roster ----

export function getClasses() {
  return apiFetch<{
    classes: {
      id: number;
      name: string;
      rankingsEnabled: boolean;
      similarityThreshold: number | null;
      gradeLevel: string | null;
    }[];
  }>("/api/admin/classes");
}

export function getRoster(classId: number) {
  return apiFetch<{
    students: {
      id: number;
      reporterId: string;
      firstName: string;
      lastName: string;
      indexNumber: number;
      xp: number;
      level: number;
      archived: boolean;
    }[];
  }>(`/api/admin/roster?classId=${classId}`);
}

export function updateClassSettings(
  classId: number,
  body: { rankingsEnabled?: boolean; similarityThreshold?: number | null; gradeLevel?: string | null }
) {
  return apiFetch<{ ok: boolean }>(`/api/admin/classes/${classId}/settings`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function addPupil(body: {
  classId: number;
  reporterId: string;
  firstName: string;
  lastName: string;
  indexNumber: number;
  pressPass: string;
}) {
  return apiFetch<{ studentId: number }>("/api/admin/roster/add", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function removePupil(studentId: number) {
  return apiFetch<{ ok: boolean }>("/api/admin/roster/remove", {
    method: "POST",
    body: JSON.stringify({ studentId }),
  });
}

export function importRoster(
  classId: number,
  rows: { reporterId: string; firstName: string; lastName: string; indexNumber: number; pressPass: string }[]
) {
  return apiFetch<{ createdCount: number; created: string[]; skipped: { reporterId: string; reason: string }[] }>(
    "/api/admin/roster/import",
    { method: "POST", body: JSON.stringify({ classId, rows }) }
  );
}

export function resetPupilPassword(studentId: number, newPressPass: string) {
  return apiFetch<{ ok: boolean }>("/api/admin/roster/reset-password", {
    method: "POST",
    body: JSON.stringify({ studentId, newPressPass }),
  });
}

export function changePupilClass(studentId: number, newClassId: number) {
  return apiFetch<{ ok: boolean }>("/api/admin/roster/change-class", {
    method: "POST",
    body: JSON.stringify({ studentId, newClassId }),
  });
}

// ---- Admin: Breaking News (article import) ----

export function getImportPrompt() {
  return apiFetch<{ prompt: string }>("/api/admin/import-prompt");
}

export function importArticleJson(bundle: ImportBundle) {
  return apiFetch<{ articleId: number; status: "draft" }>("/api/admin/articles/import-json", {
    method: "POST",
    body: JSON.stringify(bundle),
  });
}

export function publishArticle(articleId: number) {
  return apiFetch<{ ok: boolean }>(`/api/admin/articles/${articleId}/publish`, { method: "POST" });
}

export async function uploadThumbnail(articleId: number, file: File) {
  const dataBase64 = await fileToBase64(file);
  return apiFetch<{ ok: boolean }>(`/api/admin/articles/${articleId}/thumbnail`, {
    method: "POST",
    body: JSON.stringify({ dataBase64, contentType: file.type }),
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string; // "data:image/png;base64,AAAA..."
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Couldn't read the file"));
    reader.readAsDataURL(file);
  });
}

/** Builds the URL for GET /api/thumbnail/:articleId. Auth is via the usual
 * Bearer header on API calls, but a plain <img src> can't send custom
 * headers — so this isn't used directly as an <img src>; see ThumbnailImage
 * in components/ which fetches it as a blob instead and hands React an
 * object URL. Exported mainly so that component doesn't need to know the
 * URL-building logic itself. */
export function thumbnailUrl(articleId: number): string {
  return `${API_BASE}/api/thumbnail/${articleId}`;
}

export async function fetchThumbnailBlob(articleId: number): Promise<Blob | null> {
  const session = getSession();
  if (!session) return null;
  const res = await fetch(thumbnailUrl(articleId), {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  if (!res.ok) return null; // 404 = no thumbnail uploaded yet, not an error
  return res.blob();
}

// ---- Admin: review queue ----

export function getReviewQueue(classId: number) {
  return apiFetch<{ queue: ReviewQueueEntry[] }>(`/api/admin/review-queue?classId=${classId}`);
}

export function submitReview(attemptId: number, bonusXp?: number, note?: string) {
  return apiFetch<{ ok: boolean }>(`/api/admin/review/${attemptId}`, {
    method: "POST",
    body: JSON.stringify({ bonusXp, note }),
  });
}

// ---- GOAT list (pupil-facing) ----

export function getGoatList(scope: GoatScope) {
  return apiFetch<{ scope: GoatScope; picks: GoatListEntry[] }>(`/api/goat?scope=${scope}`);
}

export function getGoatPickDetail(id: number) {
  return apiFetch<GoatPickDetail>(`/api/goat/${id}`);
}

// ---- GOAT list (teacher/admin curation) ----

export function getGoatPicksForClass(classId: number) {
  return apiFetch<{ picks: AdminGoatPick[] }>(`/api/admin/goat?classId=${classId}`);
}

export function addGoatPick(attemptId: number, note?: string) {
  return apiFetch<{ id: number; ok: boolean }>("/api/admin/goat", {
    method: "POST",
    body: JSON.stringify({ attemptId, note }),
  });
}

export function updateGoatPickNote(id: number, note: string) {
  return apiFetch<{ ok: boolean }>(`/api/admin/goat/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
}

export function removeGoatPick(id: number) {
  return apiFetch<{ ok: boolean }>(`/api/admin/goat/${id}`, { method: "DELETE" });
}

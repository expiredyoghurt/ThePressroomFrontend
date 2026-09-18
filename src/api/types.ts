// Mirrors the JSON shapes the Worker actually returns (post-shuffle, with
// correct_index/role stripped where the pupil shouldn't see them) — NOT the
// internal DB payload shapes in the Worker's own src/types.ts. Keep this file
// and the Worker's response bodies in sync by hand.

export type Role = "teacher" | "admin";
export type SessionKind = "pupil" | "teacher" | "parent";

export interface PupilSummary {
  id: number;
  firstName: string;
  lastName: string;
  xp: number;
  level: number;
}

export interface ArticleSummary {
  articleId: number;
  title: string;
  section: string | null;
  publishDate: string;
  published: boolean;
  tasks: Record<
    "comprehension" | "vocabulary" | "reflect",
    { taskId: number; passed: boolean; attemptsCount: number } | undefined
  >;
}

export interface ArticleText {
  id: number;
  title: string;
  sourceName: string;
  publishDate: string;
  section: string | null;
  fullText: string;
  textChunks: { chunk_id: string; text: string }[];
}

export interface ComprehensionQuestionClient {
  id: string;
  question: string;
  evidenceChunkId: string; // NOT sent to client normally, but see note in TaskPage — client only needs it for grading feedback after submit, not before
  options: string[];
}

export interface VocabularyQuestionClient {
  id: string;
  targetWord: string;
  contextSentence: string;
  options: string[];
}

export interface McqTaskResponse {
  taskId: number;
  type: "comprehension" | "vocabulary";
  attemptNumber: number;
  article: ArticleText;
  questions: (ComprehensionQuestionClient | VocabularyQuestionClient)[];
}

export interface ReflectTaskResponse {
  taskId: number;
  type: "reflect";
  attemptNumber: number;
  article: ArticleText;
  prompt: string;
}

export type TaskResponse = McqTaskResponse | ReflectTaskResponse;

export interface McqSubmitResult {
  score: number;
  correctCount: number;
  total: number;
  passed: boolean;
  passThreshold: number;
  perQuestionResult: Record<string, { correct: boolean; correctOptionText: string }>;
  xpAwardedThisAttempt: boolean;
  leveledUp: boolean;
  newlyPublished: boolean;
}

export interface ReflectCheckResult {
  blocked: boolean;
  flagged?: boolean;
  score?: number;
  method?: "embedding" | "token-overlap";
  message?: string;
}

export interface ReflectSubmitResult {
  modelAnswers: string[];
  similarityFlagged: boolean;
  xpAwardedThisAttempt: boolean;
  leveledUp: boolean;
  newlyPublished: boolean;
}

export interface RankingEntry {
  studentId: number;
  isYou?: boolean;
  indexNumber: number;
  firstName: string;
  lastName: string;
  xp: number | null;
  level: number | null;
  tasksCompleted: number;
  badgesCount: number;
  retries: number;
}

export interface ParentRosterEntry {
  displayName: string;
  xp: number | null;
  level: number | null;
  tasksCompleted: number;
  badgesCount: number;
  retries: number;
}

export interface WallBadge {
  articleId: number;
  title: string;
  awardedAt: string;
}

export type GoatScope = "class" | "level" | "school";

export interface GoatListEntry {
  id: number;
  firstName: string;
  lastName: string;
  className: string;
  articleTitle: string;
  isYou: boolean;
}

export interface GoatPickDetail {
  id: number;
  firstName: string;
  lastName: string;
  className: string;
  articleTitle: string;
  question: string;
  answer: { short: string; long: string };
  note: string | null;
  addedByName: string;
  addedAt: string;
}

export interface AdminGoatPick {
  id: number;
  attemptId: number;
  studentId: number;
  firstName: string;
  lastName: string;
  articleTitle: string;
  note: string | null;
  addedAt: string;
}

export interface ReviewQueueEntry {
  attemptId: number;
  studentName: string;
  articleTitle: string;
  attemptNumber: number;
  answers: { short: string; long: string };
  similarityFlagged: boolean;
  similarityScore: number | null;
  submittedAt: string;
  alreadyReviewed: boolean;
}

// ---- "Breaking News" import bundle — matches the Worker's TeacherImportBundle exactly ----
export interface ImportBundle {
  title: string;
  sourceName: string;
  section: string;
  publishDate: string;
  fullText: string;
  textChunks: { chunk_id: string; text: string }[];
  comprehension: {
    questions: {
      id: string;
      question: string;
      evidence_chunk_id: string;
      options: string[];
      correct_index: number;
    }[];
  };
  vocabulary: {
    questions: {
      id: string;
      target_word: string;
      word_class: string;
      context_sentence: string;
      options: { text: string; role: string }[];
      correct_index: number;
    }[];
  };
  reflect: {
    prompt: string;
    model_answers: string[];
  };
}

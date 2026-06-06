import { promises as fs } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

type JsonRecord = Record<string, unknown>;

export type NormalizedIssue = {
  key: string;
  detail: string;
};

export type NormalizedLog = {
  id: string;
  projectId: string;
  docId: string | null;
  agentId: string;
  agentName: string;
  stage: string;
  summary: string;
  nextAction: string;
  createdAt: string;
  issues: NormalizedIssue[];
  kind: "document" | "operational";
  provenance: boolean;
  filePath: string;
};

export type DocumentRecord = {
  docId: string;
  title: string;
  currentStatus: string;
  displayStatus: string;
  currentOwner: string;
  nextAction: string;
  hasReference: boolean;
  paths: {
    raw: string;
    normalized: string;
  };
  assets: {
    raw: boolean;
    normalized: boolean;
    segments: boolean;
    draft1: boolean;
    draft2: boolean;
    draft3: boolean;
    draft4: boolean;
    handoffDraft3: boolean;
  };
  latestStage: string | null;
  latestLogAt: string | null;
  riskIssues: NormalizedIssue[];
  provenanceIssues: NormalizedIssue[];
};

export type ProjectSummary = {
  projectId: string;
  projectTitle: string;
  updatedAt: string;
  documentCount: number;
  rawCount: number;
  normalizedCount: number;
  draft1Count: number;
  draft2Count: number;
  draft3Count: number;
  draft4Count: number;
  handoffDraft3Count: number;
  statusCounts: Record<string, number>;
  issueCounts: Record<string, number>;
  parseErrors: string[];
};

export type ProjectDashboard = {
  summary: ProjectSummary;
  documents: DocumentRecord[];
  logs: NormalizedLog[];
};

export type DocumentDetail = {
  document: DocumentRecord | null;
  rawText: string | null;
  normalizedText: string | null;
  draft1Text: string | null;
  draft2Text: string | null;
  draft3Text: string | null;
  draft4Text: string | null;
  segmentCount: number;
  terms: JsonRecord[];
  annotations: JsonRecord[];
  tags: JsonRecord[];
  revisionData: JsonRecord | null;
  noteData: JsonRecord | null;
  handoffData: JsonRecord | null;
  logs: NormalizedLog[];
};

export type ProjectTerm = {
  termId: string;
  sourceTerm: string;
  sourceLanguage: string;
  translation: string;
  alternatives: string[];
  status: string;
  createdBy: string;
  firstDocId: string;
  usageNote: string;
  updatedAt: string;
};

export type ProjectAnnotation = {
  annotationId: string;
  targetText: string;
  annotationText: string;
  annotationType: string;
  status: string;
  createdBy: string;
  firstDocId: string;
  updatedAt: string;
};

export type RevisionItem = {
  itemId: string;
  category: string;
  sourceSegmentId: string;
  severity: string;
  note: string;
};

export type ProjectRevision = {
  docId: string;
  revisionId: string;
  stage: string;
  status: string;
  createdBy: string;
  createdAt: string;
  summary: string;
  items: RevisionItem[];
};

export type ProjectTag = {
  tagId: string;
  name: string;
  status: string;
  firstDocId: string;
  createdBy: string;
  updatedAt: string;
};

export type ProjectNote = {
  fileName: string;
  relativePath: string;
  docId: string;
  updatedAt: string;
  notes: JsonRecord[];
};

export type ProjectAgentEvaluation = {
  agentId: string;
  agentName: string;
  evaluationId: string;
  docId: string;
  stage: string;
  accuracy: number;
  instructionFollowing: number;
  usefulness: number;
  issues: string[];
  improvementNote: string;
  createdAt: string;
};

export type ProjectDiagnostics = {
  gitStatus: string[];
  parseErrors: string[];
  documentsStatusMismatch: Array<{ docId: string; documentsStatus: string; statusFileStatus: string }>;
  missingStatusDocs: string[];
  missingExpectedAssets: Array<{ docId: string; currentStatus: string; missing: string[] }>;
  exportFiles: Array<{ fileName: string; relativePath: string; docId: string; updatedAt: string }>;
  revisionHandoffs: Array<{ fileName: string; relativePath: string; docId: string; updatedAt: string; action: string }>;
};

const APP_ROOT = process.cwd();
const CREW_ROOT = path.resolve(APP_ROOT, "..");
const PROJECTS_ROOT = path.join(CREW_ROOT, "contents-asset", "projects");
const REPO_ROOT = path.resolve(APP_ROOT, "..", "..");

async function fileExists(targetPath: string) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  const source = await fs.readFile(filePath, "utf8");
  return JSON.parse(source) as T;
}

async function readOptionalText(filePath: string) {
  if (!(await fileExists(filePath))) {
    return null;
  }

  return fs.readFile(filePath, "utf8");
}

async function readOptionalJson<T>(filePath: string) {
  if (!(await fileExists(filePath))) {
    return null;
  }

  return readJson<T>(filePath);
}

async function listProjectIds() {
  const entries = await fs.readdir(PROJECTS_ROOT, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function walkJsonFiles(rootPath: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(rootPath, { withFileTypes: true });

  for (const entry of entries) {
    const nextPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkJsonFiles(nextPath)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(nextPath);
    }
  }

  return files.sort();
}

async function walkFiles(rootPath: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(rootPath, { withFileTypes: true });

  for (const entry of entries) {
    const nextPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(nextPath)));
      continue;
    }
    if (entry.isFile() && !entry.name.startsWith(".")) {
      files.push(nextPath);
    }
  }

  return files.sort();
}

function normalizeIssue(rawIssue: unknown): NormalizedIssue | null {
  if (!rawIssue || typeof rawIssue !== "object") {
    return null;
  }

  const issue = rawIssue as Record<string, unknown>;
  const key = issue.type ?? issue.category;
  const detail = issue.detail;

  if (typeof key !== "string") {
    return null;
  }

  return {
    key,
    detail: typeof detail === "string" ? detail : ""
  };
}

function dedupeIssues(issues: NormalizedIssue[]) {
  const seen = new Set<string>();
  const next: NormalizedIssue[] = [];

  for (const issue of issues) {
    const signature = `${issue.key}::${issue.detail}`;
    if (seen.has(signature)) {
      continue;
    }
    seen.add(signature);
    next.push(issue);
  }

  return next;
}

function isOperationalDocId(docId: string | null) {
  return docId === null || docId === "bootstrap" || docId === "director";
}

function normalizeLog(filePath: string, payload: Record<string, unknown>): NormalizedLog {
  const docId = typeof payload.doc_id === "string" ? payload.doc_id : null;
  const issues = Array.isArray(payload.issues)
    ? payload.issues.map(normalizeIssue).filter(Boolean) as NormalizedIssue[]
    : [];

  const provenance = issues.some((issue) =>
    ["process_audit", "manager_role_gap", "corrective_rule"].includes(issue.key)
  );

  return {
    id: typeof payload.log_id === "string" ? payload.log_id : path.basename(filePath),
    projectId: typeof payload.project_id === "string" ? payload.project_id : "",
    docId,
    agentId: typeof payload.agent_id === "string" ? payload.agent_id : "",
    agentName: typeof payload.agent_name === "string" ? payload.agent_name : "",
    stage: typeof payload.stage === "string" ? payload.stage : "",
    summary: typeof payload.summary === "string" ? payload.summary : "",
    nextAction: typeof payload.next_recommended_action === "string" ? payload.next_recommended_action : "",
    createdAt: typeof payload.created_at === "string" ? payload.created_at : "",
    issues,
    kind: isOperationalDocId(docId) ? "operational" : "document",
    provenance,
    filePath
  };
}

async function loadProjectLogs(projectRoot: string) {
  const logsRoot = path.join(projectRoot, "logs", "agent-logs");
  const parseErrors: string[] = [];
  const issueCounts: Record<string, number> = {};

  if (!(await fileExists(logsRoot))) {
    return { logs: [] as NormalizedLog[], issueCounts, parseErrors };
  }

  const files = await walkJsonFiles(logsRoot);
  const logs: NormalizedLog[] = [];

  for (const filePath of files) {
    try {
      const payload = await readJson<Record<string, unknown>>(filePath);
      const normalized = normalizeLog(filePath, payload);
      logs.push(normalized);
      for (const issue of normalized.issues) {
        issueCounts[issue.key] = (issueCounts[issue.key] ?? 0) + 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      parseErrors.push(`${path.relative(projectRoot, filePath)}: ${message}`);
    }
  }

  logs.sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return { logs, issueCounts, parseErrors };
}

async function countFiles(dirPath: string, extension = ".md") {
  if (!(await fileExists(dirPath))) {
    return 0;
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(extension)).length;
}

function summarizeDocument(
  rawDocument: Record<string, unknown>,
  statusPayload: Record<string, unknown> | null,
  projectRoot: string,
  logs: NormalizedLog[]
): DocumentRecord {
  const docId = String(rawDocument.doc_id ?? "");
  const rawPath = String(rawDocument.source_path ?? "");
  const normalizedPath = String(rawDocument.normalized_path ?? "");

  const documentLogs = logs.filter((log) => log.docId === docId);
  const riskIssues = dedupeIssues(
    documentLogs.flatMap((log) => log.issues).filter((issue) => !["process_audit", "manager_role_gap", "corrective_rule"].includes(issue.key))
  );
  const provenanceIssues = dedupeIssues(
    documentLogs.flatMap((log) => log.issues).filter((issue) => ["process_audit", "manager_role_gap", "corrective_rule"].includes(issue.key))
  );
  const latest = documentLogs[0] ?? null;
  const latestWorkLog = documentLogs.find((log) => !["line_review", "director_review", "line_review_followup"].includes(log.stage)) ?? latest;

  return {
    docId,
    title: String(rawDocument.title ?? docId),
    currentStatus: String(statusPayload?.current_status ?? rawDocument.current_status ?? "not_started"),
    displayStatus: String(statusPayload?.display_status ?? rawDocument.current_status ?? "준비전"),
    currentOwner: String(statusPayload?.current_owner ?? ""),
    nextAction: String(statusPayload?.next_action ?? ""),
    hasReference: Boolean(rawDocument.has_reference),
    paths: {
      raw: rawPath,
      normalized: normalizedPath
    },
    assets: {
      raw: Boolean(rawPath),
      normalized: Boolean(normalizedPath),
      segments: false,
      draft1: false,
      draft2: false,
      draft3: false,
      draft4: false,
      handoffDraft3: false
    },
    latestStage: latestWorkLog?.stage ?? null,
    latestLogAt: latest?.createdAt ?? null,
    riskIssues,
    provenanceIssues
  };
}

async function enrichDocumentAssets(projectRoot: string, document: DocumentRecord) {
  const docId = document.docId;
  const assetChecks = {
    raw: path.join(projectRoot, document.paths.raw),
    normalized: path.join(projectRoot, document.paths.normalized),
    segments: path.join(projectRoot, "data", "segments", `${docId}.json`),
    draft1: path.join(projectRoot, "outputs", "manuscripts", "draft1", `${docId}.md`),
    draft2: path.join(projectRoot, "outputs", "manuscripts", "draft2", `${docId}.md`),
    draft3: path.join(projectRoot, "outputs", "manuscripts", "draft3", `${docId}.md`),
    draft4: path.join(projectRoot, "outputs", "manuscripts", "draft4", `${docId}.md`),
    handoffDraft3: path.join(projectRoot, "handoff", "draft3", `${docId}.json`)
  } as const;

  const nextAssets = { ...document.assets };
  for (const [key, targetPath] of Object.entries(assetChecks)) {
    nextAssets[key as keyof typeof nextAssets] = await fileExists(targetPath);
  }

  return {
    ...document,
    assets: nextAssets
  };
}

export async function getProjectIds() {
  return listProjectIds();
}

export async function loadProjectDashboard(projectId: string): Promise<ProjectDashboard> {
  const projectRoot = path.join(PROJECTS_ROOT, projectId);
  const documentsPath = path.join(projectRoot, "data", "documents.json");
  const statusesRoot = path.join(projectRoot, "data", "status");

  const documentsPayload = await readJson<{
    project_id: string;
    project_title: string;
    updated_at: string;
    documents: Record<string, unknown>[];
  }>(documentsPath);

  const { logs, issueCounts, parseErrors } = await loadProjectLogs(projectRoot);

  const statuses = new Map<string, Record<string, unknown>>();
  if (await fileExists(statusesRoot)) {
    const statusFiles = await fs.readdir(statusesRoot);
    for (const statusFile of statusFiles.filter((file) => file.endsWith(".json"))) {
      const status = await readJson<Record<string, unknown>>(path.join(statusesRoot, statusFile));
      if (typeof status.doc_id === "string") {
        statuses.set(status.doc_id, status);
      }
    }
  }

  const statusCounts: Record<string, number> = {};
  const documents = await Promise.all(
    documentsPayload.documents.map(async (rawDocument) => {
      const docId = String(rawDocument.doc_id ?? "");
      const statusPayload = statuses.get(docId) ?? null;
      const document = summarizeDocument(rawDocument, statusPayload, projectRoot, logs);
      statusCounts[document.currentStatus] = (statusCounts[document.currentStatus] ?? 0) + 1;
      return enrichDocumentAssets(projectRoot, document);
    })
  );

  documents.sort((left, right) => {
    const riskDelta = right.riskIssues.length - left.riskIssues.length;
    if (riskDelta !== 0) return riskDelta;
    return left.docId.localeCompare(right.docId);
  });

  const summary: ProjectSummary = {
    projectId: documentsPayload.project_id,
    projectTitle: documentsPayload.project_title,
    updatedAt: documentsPayload.updated_at,
    documentCount: documentsPayload.documents.length,
    rawCount: await countFiles(path.join(projectRoot, "assets", "source", "raw")),
    normalizedCount: await countFiles(path.join(projectRoot, "assets", "source", "normalized")),
    draft1Count: await countFiles(path.join(projectRoot, "outputs", "manuscripts", "draft1")),
    draft2Count: await countFiles(path.join(projectRoot, "outputs", "manuscripts", "draft2")),
    draft3Count: await countFiles(path.join(projectRoot, "outputs", "manuscripts", "draft3")),
    draft4Count: await countFiles(path.join(projectRoot, "outputs", "manuscripts", "draft4")),
    handoffDraft3Count: await countFiles(path.join(projectRoot, "handoff", "draft3"), ".json"),
    statusCounts,
    issueCounts,
    parseErrors
  };

  return {
    summary,
    documents,
    logs
  };
}

export async function loadDocumentDetail(projectId: string, docId: string): Promise<DocumentDetail> {
  const dashboard = await loadProjectDashboard(projectId);
  const document = dashboard.documents.find((item) => item.docId === docId) ?? null;
  if (!document) {
    return {
      document: null,
      rawText: null,
      normalizedText: null,
      draft1Text: null,
      draft2Text: null,
      draft3Text: null,
      draft4Text: null,
      segmentCount: 0,
      terms: [],
      annotations: [],
      tags: [],
      revisionData: null,
      noteData: null,
      handoffData: null,
      logs: []
    };
  }

  const projectRoot = path.join(PROJECTS_ROOT, projectId);
  const segmentsPath = path.join(projectRoot, "data", "segments", `${docId}.json`);
  const termsPath = path.join(projectRoot, "data", "terms", "terms.json");
  const annotationsPath = path.join(projectRoot, "data", "annotations", "annotations.json");
  const tagsPath = path.join(projectRoot, "data", "tags", "tags.json");
  const revisionsPath = path.join(projectRoot, "data", "revisions", `${docId}.json`);
  const notesPath = path.join(projectRoot, "data", "notes", `${docId}.json`);
  const handoffPath = path.join(projectRoot, "handoff", "draft3", `${docId}.json`);

  const rawText = await readOptionalText(path.join(projectRoot, document.paths.raw));
  const normalizedText = await readOptionalText(path.join(projectRoot, document.paths.normalized));
  const draft1Text = await readOptionalText(path.join(projectRoot, "outputs", "manuscripts", "draft1", `${docId}.md`));
  const draft2Text = await readOptionalText(path.join(projectRoot, "outputs", "manuscripts", "draft2", `${docId}.md`));
  const draft3Text = await readOptionalText(path.join(projectRoot, "outputs", "manuscripts", "draft3", `${docId}.md`));
  const draft4Text = await readOptionalText(path.join(projectRoot, "outputs", "manuscripts", "draft4", `${docId}.md`));

  const segmentsPayload = (await fileExists(segmentsPath))
    ? await readJson<{ segments?: unknown[] }>(segmentsPath)
    : { segments: [] };
  const termsPayload = (await fileExists(termsPath))
    ? await readJson<{ terms?: JsonRecord[] }>(termsPath)
    : { terms: [] };
  const annotationsPayload = (await fileExists(annotationsPath))
    ? await readJson<{ annotations?: JsonRecord[] }>(annotationsPath)
    : { annotations: [] };
  const tagsPayload = (await fileExists(tagsPath))
    ? await readJson<{ tags?: JsonRecord[] }>(tagsPath)
    : { tags: [] };
  const revisionData = (await fileExists(revisionsPath))
    ? await readJson<JsonRecord>(revisionsPath)
    : null;
  const noteData = (await fileExists(notesPath))
    ? await readJson<JsonRecord>(notesPath)
    : null;
  const handoffData = (await fileExists(handoffPath))
    ? await readJson<JsonRecord>(handoffPath)
    : null;

  const terms = Array.isArray(termsPayload.terms)
    ? termsPayload.terms.filter((term) => term.first_doc_id === docId)
    : [];
  const annotations = Array.isArray(annotationsPayload.annotations)
    ? annotationsPayload.annotations.filter((annotation) => annotation.first_doc_id === docId)
    : [];
  const tags = Array.isArray(tagsPayload.tags)
    ? tagsPayload.tags.filter((tag) => tag.first_doc_id === docId || tag.doc_id === docId)
    : [];

  return {
    document,
    rawText,
    normalizedText,
    draft1Text,
    draft2Text,
    draft3Text,
    draft4Text,
    segmentCount: Array.isArray(segmentsPayload.segments) ? segmentsPayload.segments.length : 0,
    terms,
    annotations,
    tags,
    revisionData,
    noteData,
    handoffData,
    logs: dashboard.logs.filter((log) => log.docId === docId)
  };
}

function normalizeTerm(term: Record<string, unknown>): ProjectTerm {
  return {
    termId: String(term.term_id ?? ""),
    sourceTerm: String(term.source_term ?? ""),
    sourceLanguage: String(term.source_language ?? ""),
    translation: String(term.translation ?? ""),
    alternatives: Array.isArray(term.alternatives) ? term.alternatives.map((item) => String(item)) : [],
    status: String(term.status ?? ""),
    createdBy: String(term.created_by ?? ""),
    firstDocId: String(term.first_doc_id ?? ""),
    usageNote: String(term.usage_note ?? ""),
    updatedAt: String(term.updated_at ?? "")
  };
}

function normalizeAnnotation(annotation: Record<string, unknown>): ProjectAnnotation {
  return {
    annotationId: String(annotation.annotation_id ?? ""),
    targetText: String(annotation.target_text ?? ""),
    annotationText: String(annotation.annotation_text ?? ""),
    annotationType: String(annotation.annotation_type ?? ""),
    status: String(annotation.status ?? ""),
    createdBy: String(annotation.created_by ?? ""),
    firstDocId: String(annotation.first_doc_id ?? ""),
    updatedAt: String(annotation.updated_at ?? "")
  };
}

function normalizeRevision(docId: string, revision: Record<string, unknown>): ProjectRevision {
  const items = Array.isArray(revision.items)
    ? revision.items.map((item) => {
      const payload = item as Record<string, unknown>;
      return {
        itemId: String(payload.item_id ?? ""),
        category: String(payload.category ?? ""),
        sourceSegmentId: String(payload.source_segment_id ?? ""),
        severity: String(payload.severity ?? ""),
        note: String(payload.note ?? "")
      };
    })
    : [];

  return {
    docId,
    revisionId: String(revision.revision_id ?? ""),
    stage: String(revision.stage ?? ""),
    status: String(revision.status ?? ""),
    createdBy: String(revision.created_by ?? ""),
    createdAt: String(revision.created_at ?? ""),
    summary: String(revision.summary ?? ""),
    items
  };
}

function normalizeTag(tag: Record<string, unknown>): ProjectTag {
  return {
    tagId: String(tag.tag_id ?? ""),
    name: String(tag.name ?? tag.tag ?? ""),
    status: String(tag.status ?? ""),
    firstDocId: String(tag.first_doc_id ?? ""),
    createdBy: String(tag.created_by ?? ""),
    updatedAt: String(tag.updated_at ?? "")
  };
}

export async function loadProjectTerms(projectId: string) {
  const projectRoot = path.join(PROJECTS_ROOT, projectId);
  const payload = await readOptionalJson<{ terms: Record<string, unknown>[] }>(path.join(projectRoot, "data", "terms", "terms.json"));
  return (payload?.terms ?? []).map(normalizeTerm);
}

export async function loadProjectAnnotations(projectId: string) {
  const projectRoot = path.join(PROJECTS_ROOT, projectId);
  const payload = await readOptionalJson<{ annotations: Record<string, unknown>[] }>(path.join(projectRoot, "data", "annotations", "annotations.json"));
  return (payload?.annotations ?? []).map(normalizeAnnotation);
}

export async function loadProjectRevisions(projectId: string) {
  const projectRoot = path.join(PROJECTS_ROOT, projectId);
  const revisionsRoot = path.join(projectRoot, "data", "revisions");
  if (!(await fileExists(revisionsRoot))) {
    return [] as ProjectRevision[];
  }

  const files = (await fs.readdir(revisionsRoot))
    .filter((file) => file.endsWith(".json"));

  const revisions: ProjectRevision[] = [];
  for (const file of files) {
    const payload = await readJson<{ doc_id?: string; revisions?: Record<string, unknown>[] }>(path.join(revisionsRoot, file));
    const docId = String(payload.doc_id ?? file.replace(/\.json$/, ""));
    for (const revision of payload.revisions ?? []) {
      revisions.push(normalizeRevision(docId, revision));
    }
  }

  return revisions.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function loadProjectTags(projectId: string) {
  const projectRoot = path.join(PROJECTS_ROOT, projectId);
  const payload = await readOptionalJson<{ tags: Record<string, unknown>[] }>(path.join(projectRoot, "data", "tags", "tags.json"));
  return (payload?.tags ?? []).map(normalizeTag);
}

export async function loadProjectNotes(projectId: string) {
  const projectRoot = path.join(PROJECTS_ROOT, projectId);
  const notesRoot = path.join(projectRoot, "data", "notes");
  if (!(await fileExists(notesRoot))) {
    return [] as ProjectNote[];
  }

  const entries = await fs.readdir(notesRoot, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && !entry.name.startsWith("."));
  const results: ProjectNote[] = [];

  for (const entry of files) {
    const relativePath = path.join("data", "notes", entry.name);
    const payload = await readOptionalJson<{ doc_id?: string; updated_at?: string; notes?: JsonRecord[] }>(
      path.join(projectRoot, relativePath)
    );
    results.push({
      fileName: entry.name,
      relativePath,
      docId: String(payload?.doc_id ?? entry.name.replace(/\.json$/, "")),
      updatedAt: String(payload?.updated_at ?? ""),
      notes: Array.isArray(payload?.notes) ? payload!.notes : []
    });
  }

  return results.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function loadProjectAgentEvaluations(projectId: string) {
  const projectRoot = path.join(PROJECTS_ROOT, projectId);
  const evaluationsRoot = path.join(projectRoot, "data", "agent-evaluations");
  if (!(await fileExists(evaluationsRoot))) {
    return [] as ProjectAgentEvaluation[];
  }

  const files = (await fs.readdir(evaluationsRoot)).filter((file) => file.endsWith(".json"));
  const results: ProjectAgentEvaluation[] = [];
  for (const file of files) {
    const payload = await readOptionalJson<{
      agent_id?: string;
      agent_name?: string;
      evaluations?: Record<string, unknown>[];
    }>(path.join(evaluationsRoot, file));
    for (const evaluation of payload?.evaluations ?? []) {
      results.push({
        agentId: String(payload?.agent_id ?? ""),
        agentName: String(payload?.agent_name ?? ""),
        evaluationId: String(evaluation.evaluation_id ?? ""),
        docId: String(evaluation.doc_id ?? ""),
        stage: String(evaluation.stage ?? ""),
        accuracy: Number(evaluation.accuracy ?? 0),
        instructionFollowing: Number(evaluation.instruction_following ?? 0),
        usefulness: Number(evaluation.usefulness ?? 0),
        issues: Array.isArray(evaluation.issues) ? evaluation.issues.map((item) => String(item)) : [],
        improvementNote: String(evaluation.improvement_note ?? ""),
        createdAt: String(evaluation.created_at ?? "")
      });
    }
  }

  return results.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function expectedAssetsForStatus(currentStatus: string) {
  const required = [] as string[];
  const sequence = [
    "source_normalized",
    "reference_ready",
    "term_candidates_done",
    "draft1_done",
    "source_review_done",
    "annotation_candidates_done",
    "draft2_done",
    "human_review_ready",
    "human_editing",
    "draft3_handoff_ready",
    "draft3_requested",
    "draft3_generated",
    "final_scan_done",
    "final_review",
    "final_done"
  ];

  if (sequence.includes(currentStatus)) {
    required.push("normalized", "segments");
  }
  if (sequence.slice(sequence.indexOf("draft1_done")).includes(currentStatus)) {
    required.push("draft1");
  }
  if (sequence.slice(sequence.indexOf("draft2_done")).includes(currentStatus)) {
    required.push("draft2");
  }
  if (sequence.slice(sequence.indexOf("draft3_handoff_ready")).includes(currentStatus)) {
    required.push("draft3", "handoffDraft3");
  }
  if (sequence.slice(sequence.indexOf("final_review")).includes(currentStatus) || currentStatus === "final_done") {
    required.push("draft4");
  }

  return [...new Set(required)];
}

export async function loadProjectDiagnostics(projectId: string): Promise<ProjectDiagnostics> {
  const projectRoot = path.join(PROJECTS_ROOT, projectId);
  const documentsPath = path.join(projectRoot, "data", "documents.json");
  const documentsPayload = await readJson<{
    documents: Record<string, unknown>[];
  }>(documentsPath);
  const dashboard = await loadProjectDashboard(projectId);
  const statusesRoot = path.join(projectRoot, "data", "status");
  const statusFiles = (await fileExists(statusesRoot))
    ? (await fs.readdir(statusesRoot)).filter((file) => file.endsWith(".json")).map((file) => file.replace(/\.json$/, ""))
    : [];
  const statusSet = new Set(statusFiles);

  const documentsStatusMismatch = documentsPayload.documents
    .map((document) => {
      const docId = String(document.doc_id ?? "");
      const documentsStatus = String(document.current_status ?? "");
      const record = dashboard.documents.find((item) => item.docId === docId);
      const statusFileStatus = record?.currentStatus ?? "";
      return { docId, documentsStatus, statusFileStatus };
    })
    .filter((item) => item.documentsStatus && item.statusFileStatus && item.documentsStatus !== item.statusFileStatus);

  const missingStatusDocs = documentsPayload.documents
    .map((document) => String(document.doc_id ?? ""))
    .filter((docId) => !statusSet.has(docId));

  const missingExpectedAssets = dashboard.documents
    .map((document) => {
      const expected = expectedAssetsForStatus(document.currentStatus);
      const missing = expected.filter((key) => !document.assets[key as keyof typeof document.assets]);
      return {
        docId: document.docId,
        currentStatus: document.currentStatus,
        missing
      };
    })
    .filter((item) => item.missing.length > 0);

  let gitStatus: string[] = [];
  try {
    gitStatus = execFileSync("git", ["status", "--short"], { cwd: REPO_ROOT, encoding: "utf8" })
      .split("\n")
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .slice(0, 100);
  } catch {
    gitStatus = ["git status unavailable"];
  }

  const exportsRoot = path.join(projectRoot, "outputs", "exports");
  const exportFiles: ProjectDiagnostics["exportFiles"] = [];
  if (await fileExists(exportsRoot)) {
    for (const filePath of await walkFiles(exportsRoot)) {
      const stat = await fs.stat(filePath);
      const relativePath = path.relative(projectRoot, filePath);
      const fileName = path.basename(filePath);
      const docId = fileName.replace(/-draft4\.md$/, "").replace(/\.[^.]+$/, "");
      exportFiles.push({
        fileName,
        relativePath,
        docId,
        updatedAt: stat.mtime.toISOString()
      });
    }
  }

  const revisionRoot = path.join(projectRoot, "handoff", "revision");
  const revisionHandoffs: ProjectDiagnostics["revisionHandoffs"] = [];
  if (await fileExists(revisionRoot)) {
    for (const filePath of await walkJsonFiles(revisionRoot)) {
      const payload = await readOptionalJson<Record<string, unknown>>(filePath);
      const stat = await fs.stat(filePath);
      revisionHandoffs.push({
        fileName: path.basename(filePath),
        relativePath: path.relative(projectRoot, filePath),
        docId: String(payload?.doc_id ?? path.basename(filePath).replace(/\.json$/, "")),
        updatedAt: typeof payload?.created_at === "string" ? payload.created_at : stat.mtime.toISOString(),
        action: String(payload?.action ?? payload?.target_stage ?? "revision_handoff")
      });
    }
  }

  return {
    gitStatus,
    parseErrors: dashboard.summary.parseErrors,
    documentsStatusMismatch,
    missingStatusDocs,
    missingExpectedAssets,
    exportFiles: exportFiles.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    revisionHandoffs: revisionHandoffs.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  };
}

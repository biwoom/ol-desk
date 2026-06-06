import { promises as fs } from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const APP_ROOT = process.cwd();
const CREW_ROOT = path.resolve(APP_ROOT, "..");
const PROJECTS_ROOT = path.join(CREW_ROOT, "contents-asset", "projects");
const TEMPLATE_PROJECT_ID = "_template";

function projectRoot(projectId: string) {
  return path.join(PROJECTS_ROOT, projectId);
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readOptionalJson<T>(filePath: string): Promise<T | null> {
  try {
    const source = await fs.readFile(filePath, "utf8");
    return JSON.parse(source) as T;
  } catch {
    return null;
  }
}

async function writeJson(filePath: string, payload: unknown) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function isoNow() {
  const now = new Date();
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const minutes = String(absolute % 60).padStart(2, "0");
  const base = new Date(now.getTime() - now.getMilliseconds()).toISOString().replace(".000Z", "");
  return `${base}${sign}${hours}:${minutes}`;
}

function compactId(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

function titleFromProjectId(projectId: string) {
  return projectId
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function updateDocumentStatus(
  projectId: string,
  docId: string,
  currentStatus: string,
  displayStatus: string,
  currentOwner: string,
  nextAction: string
) {
  const filePath = path.join(projectRoot(projectId), "data", "status", `${docId}.json`);
  const now = isoNow();
  const payload = (await readOptionalJson<Record<string, unknown>>(filePath)) ?? { doc_id: docId };
  await writeJson(filePath, {
    ...payload,
    doc_id: docId,
    current_status: currentStatus,
    display_status: displayStatus,
    current_owner: currentOwner,
    next_action: nextAction,
    blocked: false,
    blocker_reason: "",
    updated_at: now
  });
}

export async function saveDraft3Manuscript(projectId: string, docId: string, content: string) {
  const filePath = path.join(projectRoot(projectId), "outputs", "manuscripts", "draft3", `${docId}.md`);
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
  await updateDocumentStatus(projectId, docId, "human_editing", "사람수정중", "OL-DESK Human Reviewer", "3차 가번역 수정");
}

export async function saveDraft4Manuscript(projectId: string, docId: string, content: string) {
  const filePath = path.join(projectRoot(projectId), "outputs", "manuscripts", "draft4", `${docId}.md`);
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
  await updateDocumentStatus(projectId, docId, "final_review", "최종검토", "OL-DESK Human Reviewer", "4차 최종원고 검토");
}

export async function saveHumanNote(
  projectId: string,
  docId: string,
  body: string,
  segmentId: string,
  tab: string,
  stage = "human_editing"
) {
  const filePath = path.join(projectRoot(projectId), "data", "notes", `${docId}.json`);
  const now = isoNow();
  const payload = (await readOptionalJson<{ doc_id?: string; updated_at?: string; notes?: JsonRecord[] }>(filePath)) ?? {
    doc_id: docId,
    updated_at: now,
    notes: []
  };

  const noteId = `note-${compactId(docId)}-${Date.now()}`;
  const notes = Array.isArray(payload.notes) ? payload.notes.slice() : [];
  notes.push({
    note_id: noteId,
    body,
    context: {
      page: "translation",
      tab,
      stage,
      segment_id: segmentId,
      target_type: "manuscript",
      target_id: `outputs/manuscripts/draft3/${docId}.md`
    },
    status: "open",
    created_by: "human",
    created_at: now,
    updated_at: now
  });

  await writeJson(filePath, {
    doc_id: docId,
    updated_at: now,
    notes
  });
  await updateDocumentStatus(projectId, docId, "human_editing", "사람수정중", "OL-DESK Human Reviewer", "감수 메모 정리");
}

export async function saveHumanRevision(
  projectId: string,
  docId: string,
  segmentId: string,
  humanText: string,
  changeNote: string
) {
  const filePath = path.join(projectRoot(projectId), "data", "revisions", `${docId}.json`);
  const now = isoNow();
  const payload = (await readOptionalJson<{
    doc_id?: string;
    updated_at?: string;
    current_revision?: string;
    revisions?: JsonRecord[];
  }>(filePath)) ?? {
    doc_id: docId,
    updated_at: now,
    current_revision: "",
    revisions: []
  };

  const revisions = Array.isArray(payload.revisions) ? payload.revisions.slice() : [];
  const currentRevisionId = typeof payload.current_revision === "string" ? payload.current_revision : "";
  const revisionIndex = revisions.findIndex((revision) => {
    const item = revision as JsonRecord;
    return item.revision_id === currentRevisionId && item.created_by === "human" && item.target_stage === "draft3";
  });

  const nextSegment = {
    segment_id: segmentId,
    base_text_path: `outputs/manuscripts/draft2/${docId}.md`,
    human_text: humanText,
    change_note: changeNote
  };

  if (revisionIndex >= 0) {
    const revision = { ...(revisions[revisionIndex] as JsonRecord) };
    const modifiedSegments = Array.isArray(revision.modified_segments) ? revision.modified_segments.slice() : [];
    modifiedSegments.push(nextSegment);
    revision.modified_segments = modifiedSegments;
    revision.updated_at = now;
    revisions[revisionIndex] = revision;
  } else {
    const revisionId = `rev-${compactId(docId)}-${Date.now()}`;
    revisions.push({
      revision_id: revisionId,
      base_stage: "draft2",
      target_stage: "draft3",
      status: "human_editing",
      created_by: "human",
      created_at: now,
      updated_at: now,
      summary: "Human draft3 editing in OL-DESK.",
      modified_segments: [nextSegment]
    });
    payload.current_revision = revisionId;
  }

  await writeJson(filePath, {
    doc_id: docId,
    updated_at: now,
    current_revision: payload.current_revision,
    revisions
  });
  await updateDocumentStatus(projectId, docId, "human_editing", "사람수정중", "OL-DESK Human Reviewer", "수정 판단 누적");
}

async function updateCollectionItemStatus(
  projectId: string,
  relativeFilePath: string,
  collectionKey: "terms" | "annotations" | "tags",
  idKey: string,
  itemId: string,
  status: string
) {
  const filePath = path.join(projectRoot(projectId), relativeFilePath);
  const now = isoNow();
  const payload = (await readOptionalJson<{ project_id?: string; updated_at?: string; [key: string]: unknown }>(filePath)) ?? {
    project_id: projectId,
    updated_at: now,
    [collectionKey]: []
  };

  const items = Array.isArray(payload[collectionKey]) ? (payload[collectionKey] as JsonRecord[]).slice() : [];
  const nextItems = items.map((item) => {
    if (item[idKey] !== itemId) return item;
    return {
      ...item,
      status,
      updated_at: now,
      created_by: item.created_by ?? "human"
    };
  });

  await writeJson(filePath, {
    ...payload,
    updated_at: now,
    [collectionKey]: nextItems
  });
}

export async function saveTermStatus(projectId: string, termId: string, status: string) {
  await updateCollectionItemStatus(projectId, path.join("data", "terms", "terms.json"), "terms", "term_id", termId, status);
}

export async function saveAnnotationStatus(projectId: string, annotationId: string, status: string) {
  await updateCollectionItemStatus(projectId, path.join("data", "annotations", "annotations.json"), "annotations", "annotation_id", annotationId, status);
}

export async function saveTagStatus(projectId: string, tagId: string, status: string) {
  await updateCollectionItemStatus(projectId, path.join("data", "tags", "tags.json"), "tags", "tag_id", tagId, status);
}

export async function createTerm(
  projectId: string,
  docId: string,
  sourceTerm: string,
  sourceLanguage: string,
  translation: string,
  status: string,
  alternatives: string,
  usageNote: string
) {
  const filePath = path.join(projectRoot(projectId), "data", "terms", "terms.json");
  const now = isoNow();
  const payload = (await readOptionalJson<{ project_id?: string; updated_at?: string; terms?: JsonRecord[] }>(filePath)) ?? {
    project_id: projectId,
    updated_at: now,
    terms: []
  };
  const terms = Array.isArray(payload.terms) ? payload.terms.slice() : [];
  terms.push({
    term_id: `term-${compactId(docId)}-${Date.now()}`,
    source_term: sourceTerm,
    source_language: sourceLanguage,
    translation,
    alternatives: alternatives
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    status,
    created_by: "human",
    first_doc_id: docId,
    usage_note: usageNote,
    updated_at: now
  });

  await writeJson(filePath, {
    project_id: payload.project_id ?? projectId,
    updated_at: now,
    terms
  });
}

export async function createAnnotation(
  projectId: string,
  docId: string,
  targetText: string,
  annotationText: string,
  annotationType: string,
  status: string
) {
  const filePath = path.join(projectRoot(projectId), "data", "annotations", "annotations.json");
  const now = isoNow();
  const payload = (await readOptionalJson<{ project_id?: string; updated_at?: string; annotations?: JsonRecord[] }>(filePath)) ?? {
    project_id: projectId,
    updated_at: now,
    annotations: []
  };
  const annotations = Array.isArray(payload.annotations) ? payload.annotations.slice() : [];
  annotations.push({
    annotation_id: `ann-${compactId(docId)}-${Date.now()}`,
    target_text: targetText,
    annotation_text: annotationText,
    annotation_type: annotationType,
    status,
    created_by: "human",
    first_doc_id: docId,
    updated_at: now
  });

  await writeJson(filePath, {
    project_id: payload.project_id ?? projectId,
    updated_at: now,
    annotations
  });
}

export async function createTag(projectId: string, docId: string, name: string, status: string) {
  const filePath = path.join(projectRoot(projectId), "data", "tags", "tags.json");
  const now = isoNow();
  const payload = (await readOptionalJson<{ project_id?: string; updated_at?: string; tags?: JsonRecord[] }>(filePath)) ?? {
    project_id: projectId,
    updated_at: now,
    tags: []
  };
  const tags = Array.isArray(payload.tags) ? payload.tags.slice() : [];
  tags.push({
    tag_id: `tag-${compactId(docId)}-${Date.now()}`,
    name,
    status,
    first_doc_id: docId,
    created_by: "human",
    updated_at: now
  });

  await writeJson(filePath, {
    project_id: payload.project_id ?? projectId,
    updated_at: now,
    tags
  });
}

export async function createProject(projectId: string, projectTitle: string) {
  const sourceRoot = path.join(PROJECTS_ROOT, TEMPLATE_PROJECT_ID);
  const targetRoot = path.join(PROJECTS_ROOT, projectId);
  await fs.cp(sourceRoot, targetRoot, { recursive: true, errorOnExist: true });

  const now = isoNow();
  await writeJson(path.join(targetRoot, "data", "documents.json"), {
    project_id: projectId,
    project_title: projectTitle || titleFromProjectId(projectId),
    updated_at: now,
    documents: []
  });

  for (const relativePath of [
    path.join("data", "terms", "terms.json"),
    path.join("data", "annotations", "annotations.json"),
    path.join("data", "tags", "tags.json")
  ]) {
    const filePath = path.join(targetRoot, relativePath);
    const payload = (await readOptionalJson<{ [key: string]: unknown }>(filePath)) ?? {};
    await writeJson(filePath, {
      ...payload,
      project_id: projectId,
      updated_at: now
    });
  }
}

export async function createDraft3Handoff(
  projectId: string,
  docId: string,
  includedNoteIds: string[],
  instructionSummary: string
) {
  const root = projectRoot(projectId);
  const now = isoNow();
  const termsPayload = (await readOptionalJson<{ terms?: JsonRecord[] }>(path.join(root, "data", "terms", "terms.json"))) ?? {};
  const annotationsPayload = (await readOptionalJson<{ annotations?: JsonRecord[] }>(path.join(root, "data", "annotations", "annotations.json"))) ?? {};
  const tagsPayload = (await readOptionalJson<{ tags?: JsonRecord[] }>(path.join(root, "data", "tags", "tags.json"))) ?? {};
  const notesPayload = (await readOptionalJson<{ notes?: JsonRecord[] }>(path.join(root, "data", "notes", `${docId}.json`))) ?? {};
  const revisionsPayload = (await readOptionalJson<{
    current_revision?: string;
    revisions?: JsonRecord[];
  }>(path.join(root, "data", "revisions", `${docId}.json`))) ?? {};

  const terms = Array.isArray(termsPayload.terms) ? termsPayload.terms.filter((item) => item.first_doc_id === docId) : [];
  const annotations = Array.isArray(annotationsPayload.annotations)
    ? annotationsPayload.annotations.filter((item) => item.first_doc_id === docId)
    : [];
  const tags = Array.isArray(tagsPayload.tags)
    ? tagsPayload.tags.filter((item) => item.first_doc_id === docId || item.doc_id === docId)
    : [];
  const notes = Array.isArray(notesPayload.notes) ? notesPayload.notes : [];
  const revisions = Array.isArray(revisionsPayload.revisions) ? revisionsPayload.revisions : [];

  const currentRevisionId = typeof revisionsPayload.current_revision === "string" ? revisionsPayload.current_revision : "";
  const activeRevision = (revisions.find((item) => item.revision_id === currentRevisionId) ??
    [...revisions].reverse().find((item) => item.created_by === "human" || item.target_stage === "draft3")) as JsonRecord | undefined;
  const revisionId = typeof activeRevision?.revision_id === "string" ? activeRevision.revision_id : "";
  const modifiedSegments = Array.isArray(activeRevision?.modified_segments) ? activeRevision.modified_segments : [];

  const approvedTerms = terms.filter((item) => item.status === "approved");
  const approvedAnnotations = annotations.filter((item) => item.status === "approved");
  const approvedTags = tags.filter((item) => item.status === "approved");
  const rejectedCandidates = [...terms, ...annotations, ...tags].filter((item) =>
    item.status === "rejected" || item.status === "deprecated"
  );
  const pendingItems = [...terms, ...annotations, ...tags].filter((item) =>
    item.status === "candidate" || item.status === "hold"
  );
  const includedNotes = notes.filter((item) => includedNoteIds.includes(String(item.note_id ?? "")));

  const handoffPayload = {
    handoff_id: `handoff-draft3-${compactId(docId)}-${revisionId || Date.now()}`,
    project_id: projectId,
    doc_id: docId,
    revision_id: revisionId,
    source_revision: revisionId,
    target_stage: "draft3",
    human_modified_segments: modifiedSegments,
    approved_terms: approvedTerms,
    approved_annotations: approvedAnnotations,
    approved_tags: approvedTags,
    rejected_candidates: rejectedCandidates,
    pending_items: pendingItems,
    included_notes: includedNotes,
    instruction_summary: instructionSummary || "인간 확정 판단만 반영할 것.",
    created_at: now
  };

  await writeJson(path.join(root, "handoff", "draft3", `${docId}.json`), handoffPayload);
  await updateDocumentStatus(projectId, docId, "draft3_handoff_ready", "3차반영준비", "B00-3차 확정 관리 매니저-결정", "3차반영 요청");
}

export async function markFinalDone(projectId: string, docId: string, approvalNote: string) {
  const root = projectRoot(projectId);
  const now = isoNow();
  const draft4Path = path.join(root, "outputs", "manuscripts", "draft4", `${docId}.md`);
  const draft4 = await fs.readFile(draft4Path, "utf8");
  const exportPath = path.join(root, "outputs", "exports", "individual", `${docId}-draft4.md`);
  await ensureDir(path.dirname(exportPath));
  await fs.writeFile(exportPath, draft4.endsWith("\n") ? draft4 : `${draft4}\n`, "utf8");

  await saveHumanNote(projectId, docId, approvalNote || "최종 승인", "", "draft4", "final_review");
  await updateDocumentStatus(projectId, docId, "final_done", "최종완료", "OL-DESK Human Reviewer", "최종 승인 완료");
  await writeJson(path.join(root, "handoff", "revision", `${docId}-final-approval.json`), {
    project_id: projectId,
    doc_id: docId,
    action: "final_approval",
    approval_note: approvalNote || "최종 승인",
    created_at: now
  });
}

export async function reopenRevisionCycle(projectId: string, docId: string, reason: string) {
  const root = projectRoot(projectId);
  const now = isoNow();
  const revisionId = `reopen-${compactId(docId)}-${Date.now()}`;
  await writeJson(path.join(root, "handoff", "revision", `${docId}-${revisionId}.json`), {
    project_id: projectId,
    doc_id: docId,
    revision_id: revisionId,
    target_stage: "draft3_preliminary_reopened",
    reopen_reason: reason,
    created_at: now
  });
  await updateDocumentStatus(projectId, docId, "revision_needed", "수정필요", "OL-DESK Human Reviewer", "revision cycle 검토");
}

export async function saveAgentEvaluation(
  projectId: string,
  agentId: string,
  agentName: string,
  docId: string,
  stage: string,
  accuracy: number,
  instructionFollowing: number,
  usefulness: number,
  issues: string[],
  improvementNote: string
) {
  const now = isoNow();
  const normalizedAgentId = compactId(agentId || agentName || docId || `agent-${Date.now()}`);
  const filePath = path.join(projectRoot(projectId), "data", "agent-evaluations", `${normalizedAgentId}.json`);
  const payload = (await readOptionalJson<{
    project_id?: string;
    agent_id?: string;
    agent_name?: string;
    updated_at?: string;
    evaluations?: JsonRecord[];
  }>(filePath)) ?? {
    project_id: projectId,
    agent_id: agentId,
    agent_name: agentName,
    updated_at: now,
    evaluations: []
  };

  const evaluations = Array.isArray(payload.evaluations) ? payload.evaluations.slice() : [];
  evaluations.push({
    evaluation_id: `eval-${compactId(docId)}-${Date.now()}`,
    doc_id: docId,
    stage,
    accuracy,
    instruction_following: instructionFollowing,
    usefulness,
    issues,
    improvement_note: improvementNote,
    created_by: "human",
    created_at: now
  });

  await writeJson(filePath, {
    project_id: payload.project_id ?? projectId,
    agent_id: payload.agent_id || agentId || normalizedAgentId,
    agent_name: payload.agent_name || agentName || agentId,
    updated_at: now,
    evaluations
  });
}

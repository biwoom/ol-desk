import type { DocumentRecord } from "./content-asset";

export const MENUS = [
  { key: "overview", label: "개요", href: "/" },
  { key: "progress", label: "진행", href: "/progress" },
  { key: "translation", label: "번역", href: "/translation" },
  { key: "terms", label: "용어", href: "/terms" },
  { key: "annotations", label: "각주", href: "/annotations" },
  { key: "revisions", label: "수정", href: "/revisions" },
  { key: "notes", label: "노트", href: "/notes" },
  { key: "tags", label: "태그", href: "/tags" },
  { key: "crew", label: "작업기록", href: "/crew" },
  { key: "admin", label: "관리", href: "/admin" }
] as const;

export function resolveProjectId(projects: string[], requestedProject: string | null) {
  const preferredProject = projects.includes("buddhavamsa")
    ? "buddhavamsa"
    : projects.find((project) => project !== "_template") ?? projects[0] ?? null;

  if (requestedProject && projects.includes(requestedProject)) {
    return requestedProject;
  }

  return preferredProject;
}

export function resolveDocId(documents: DocumentRecord[], requestedDoc: string | null) {
  const featuredDocs = [
    "gcb-src-004-salutation-and-intention",
    "gcb-src-007-the-renunciaton-of-sumedha"
  ];

  return requestedDoc
    ?? featuredDocs.find((docId) => documents.some((document) => document.docId === docId))
    ?? documents[0]?.docId
    ?? null;
}

export function toneForStatus(status: string) {
  if (status === "draft2_done" || status === "final_done") return "done";
  if (status === "source_ready" || status === "not_started") return "ready";
  if (status === "blocked" || status === "error") return "risk";
  return "progress";
}

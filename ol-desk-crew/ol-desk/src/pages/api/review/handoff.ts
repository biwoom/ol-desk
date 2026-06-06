import type { APIRoute } from "astro";
import { createDraft3Handoff } from "../../../lib/content-write";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const docId = String(form.get("docId") ?? "");
  const instructionSummary = String(form.get("instructionSummary") ?? "").trim();
  const includedNoteIds = form.getAll("includedNoteIds").map((value) => String(value));

  if (!projectId || !docId) {
    return new Response("Missing projectId or docId", { status: 400 });
  }

  await createDraft3Handoff(projectId, docId, includedNoteIds, instructionSummary);
  const redirectUrl = new URL(`/translation/${docId}?project=${projectId}&tab=draft3&saved=handoff`, request.url);
  return Response.redirect(redirectUrl, 303);
};

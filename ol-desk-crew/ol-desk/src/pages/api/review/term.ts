import type { APIRoute } from "astro";
import { createTerm, saveTermStatus } from "../../../lib/content-write";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const termId = String(form.get("termId") ?? "");
  const docId = String(form.get("docId") ?? "");
  const sourceTerm = String(form.get("sourceTerm") ?? "").trim();
  const sourceLanguage = String(form.get("sourceLanguage") ?? "pali").trim();
  const translation = String(form.get("translation") ?? "").trim();
  const alternatives = String(form.get("alternatives") ?? "");
  const usageNote = String(form.get("usageNote") ?? "").trim();
  const status = String(form.get("status") ?? "");
  const returnTo = String(form.get("returnTo") ?? "/terms");

  if (!projectId || !status) {
    return new Response("Missing projectId or status", { status: 400 });
  }

  if (termId) {
    await saveTermStatus(projectId, termId, status);
  } else {
    if (!docId || !sourceTerm || !translation) {
      return new Response("Missing docId, sourceTerm, or translation for new term", { status: 400 });
    }
    await createTerm(projectId, docId, sourceTerm, sourceLanguage, translation, status, alternatives, usageNote);
  }
  const redirectUrl = new URL(`${returnTo}${returnTo.includes("?") ? "&" : "?"}saved=term`, request.url);
  return Response.redirect(redirectUrl, 303);
};

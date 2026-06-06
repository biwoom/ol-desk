import type { APIRoute } from "astro";
import { saveDraft4Manuscript } from "../../../lib/content-write";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const docId = String(form.get("docId") ?? "");
  const content = String(form.get("content") ?? "");

  if (!projectId || !docId) {
    return new Response("Missing projectId or docId", { status: 400 });
  }

  await saveDraft4Manuscript(projectId, docId, content);
  const redirectUrl = new URL(`/translation/${docId}?project=${projectId}&tab=draft4&saved=draft4`, request.url);
  return Response.redirect(redirectUrl, 303);
};

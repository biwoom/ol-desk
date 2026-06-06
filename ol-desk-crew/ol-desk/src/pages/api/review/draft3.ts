import type { APIRoute } from "astro";
import { saveDraft3Manuscript } from "../../../lib/content-write";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const docId = String(form.get("docId") ?? "");
  const content = String(form.get("content") ?? "");

  if (!projectId || !docId) {
    return new Response("Missing projectId or docId", { status: 400 });
  }

  await saveDraft3Manuscript(projectId, docId, content);
  const redirectUrl = new URL(`/translation/${docId}?project=${projectId}&tab=draft3&saved=draft3`, request.url);
  return Response.redirect(redirectUrl, 303);
};

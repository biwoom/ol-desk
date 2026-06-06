import type { APIRoute } from "astro";
import { markFinalDone } from "../../../lib/content-write";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const docId = String(form.get("docId") ?? "");
  const approvalNote = String(form.get("approvalNote") ?? "").trim();

  if (!projectId || !docId) {
    return new Response("Missing projectId or docId", { status: 400 });
  }

  await markFinalDone(projectId, docId, approvalNote);
  const redirectUrl = new URL(`/translation/${docId}?project=${projectId}&tab=draft4&saved=final`, request.url);
  return Response.redirect(redirectUrl, 303);
};

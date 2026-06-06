import type { APIRoute } from "astro";
import { reopenRevisionCycle } from "../../../lib/content-write";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const docId = String(form.get("docId") ?? "");
  const reason = String(form.get("reason") ?? "").trim();

  if (!projectId || !docId || !reason) {
    return new Response("Missing projectId, docId, or reason", { status: 400 });
  }

  await reopenRevisionCycle(projectId, docId, reason);
  const redirectUrl = new URL(`/translation/${docId}?project=${projectId}&tab=draft4&saved=revision_reopen`, request.url);
  return Response.redirect(redirectUrl, 303);
};

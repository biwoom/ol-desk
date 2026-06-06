import type { APIRoute } from "astro";
import { saveHumanNote } from "../../../lib/content-write";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const docId = String(form.get("docId") ?? "");
  const body = String(form.get("body") ?? "").trim();
  const segmentId = String(form.get("segmentId") ?? "").trim();
  const tab = String(form.get("tab") ?? "draft3");

  if (!projectId || !docId || !body) {
    return new Response("Missing projectId, docId, or body", { status: 400 });
  }

  await saveHumanNote(projectId, docId, body, segmentId, tab);
  const redirectUrl = new URL(`/translation/${docId}?project=${projectId}&tab=${tab}&saved=note`, request.url);
  return Response.redirect(redirectUrl, 303);
};

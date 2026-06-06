import type { APIRoute } from "astro";
import { saveHumanRevision } from "../../../lib/content-write";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const docId = String(form.get("docId") ?? "");
  const segmentId = String(form.get("segmentId") ?? "").trim();
  const humanText = String(form.get("humanText") ?? "");
  const changeNote = String(form.get("changeNote") ?? "").trim();
  const tab = String(form.get("tab") ?? "draft3");

  if (!projectId || !docId || !changeNote) {
    return new Response("Missing projectId, docId, or changeNote", { status: 400 });
  }

  await saveHumanRevision(projectId, docId, segmentId, humanText, changeNote);
  const redirectUrl = new URL(`/translation/${docId}?project=${projectId}&tab=${tab}&saved=revision`, request.url);
  return Response.redirect(redirectUrl, 303);
};

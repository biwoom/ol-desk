import type { APIRoute } from "astro";
import { createAnnotation, saveAnnotationStatus } from "../../../lib/content-write";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const annotationId = String(form.get("annotationId") ?? "");
  const docId = String(form.get("docId") ?? "");
  const targetText = String(form.get("targetText") ?? "").trim();
  const annotationText = String(form.get("annotationText") ?? "").trim();
  const annotationType = String(form.get("annotationType") ?? "gloss").trim();
  const status = String(form.get("status") ?? "");
  const returnTo = String(form.get("returnTo") ?? "/annotations");

  if (!projectId || !status) {
    return new Response("Missing projectId or status", { status: 400 });
  }

  if (annotationId) {
    await saveAnnotationStatus(projectId, annotationId, status);
  } else {
    if (!docId || !targetText || !annotationText) {
      return new Response("Missing docId, targetText, or annotationText for new annotation", { status: 400 });
    }
    await createAnnotation(projectId, docId, targetText, annotationText, annotationType, status);
  }
  const redirectUrl = new URL(`${returnTo}${returnTo.includes("?") ? "&" : "?"}saved=annotation`, request.url);
  return Response.redirect(redirectUrl, 303);
};

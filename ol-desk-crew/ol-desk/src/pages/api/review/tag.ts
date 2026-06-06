import type { APIRoute } from "astro";
import { createTag, saveTagStatus } from "../../../lib/content-write";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const tagId = String(form.get("tagId") ?? "");
  const docId = String(form.get("docId") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const status = String(form.get("status") ?? "");
  const returnTo = String(form.get("returnTo") ?? "/tags");

  if (!projectId || !status) {
    return new Response("Missing projectId or status", { status: 400 });
  }

  if (tagId) {
    await saveTagStatus(projectId, tagId, status);
  } else {
    if (!docId || !name) {
      return new Response("Missing docId or name for new tag", { status: 400 });
    }
    await createTag(projectId, docId, name, status);
  }

  const redirectUrl = new URL(`${returnTo}${returnTo.includes("?") ? "&" : "?"}saved=tag`, request.url);
  return Response.redirect(redirectUrl, 303);
};

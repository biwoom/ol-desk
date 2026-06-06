import type { APIRoute } from "astro";
import { createProject } from "../../../lib/content-write";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "").trim();
  const projectTitle = String(form.get("projectTitle") ?? "").trim();

  if (!projectId) {
    return new Response("Missing projectId", { status: 400 });
  }

  await createProject(projectId, projectTitle);
  const redirectUrl = new URL(`/?project=${projectId}&created=project`, request.url);
  return Response.redirect(redirectUrl, 303);
};

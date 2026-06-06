import type { APIRoute } from "astro";
import { saveAgentEvaluation } from "../../../lib/content-write";

function parseScore(raw: FormDataEntryValue | null) {
  const score = Number(raw ?? 0);
  if (!Number.isFinite(score)) return 0;
  return Math.max(1, Math.min(5, Math.round(score)));
}

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const target = String(form.get("target") ?? "");
  const [agentIdRaw, agentNameRaw, stageRaw] = target.split("|||");
  const agentId = agentIdRaw?.trim() ?? "";
  const agentName = agentNameRaw?.trim() ?? "";
  const docId = String(form.get("docId") ?? "").trim();
  const stage = stageRaw?.trim() ?? "";
  const accuracy = parseScore(form.get("accuracy"));
  const instructionFollowing = parseScore(form.get("instructionFollowing"));
  const usefulness = parseScore(form.get("usefulness"));
  const issues = String(form.get("issues") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const improvementNote = String(form.get("improvementNote") ?? "").trim();
  const returnTo = String(form.get("returnTo") ?? `/translation/${docId}?project=${projectId}`);

  if (!projectId || !docId || !stage || !agentId) {
    return new Response("Missing projectId, docId, or target", { status: 400 });
  }

  await saveAgentEvaluation(
    projectId,
    agentId,
    agentName,
    docId,
    stage,
    accuracy,
    instructionFollowing,
    usefulness,
    issues,
    improvementNote
  );

  const redirectUrl = new URL(`${returnTo}${returnTo.includes("?") ? "&" : "?"}saved=evaluation`, request.url);
  return Response.redirect(redirectUrl, 303);
};

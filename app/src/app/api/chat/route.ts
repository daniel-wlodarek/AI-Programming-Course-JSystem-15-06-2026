import { serviceCopy } from "@/shared/polish-copy";
import { getAIAdapter } from "@/server/ai/adapter-factory";
import { buildChatPrompt } from "@/server/ai/prompts";
import { getOpenRouterConfig } from "@/server/env";
import { loadPolicy } from "@/server/policies/policy-loader";
import { validateChatRequest } from "@/server/validation/chat";

export const runtime = "nodejs";
export const maxDuration = 60;

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json(
      {
        errorCode: "VALIDATION_ERROR",
        message: "Nie można odczytać wiadomości. Spróbuj ponownie.",
      },
      400,
    );
  }

  const validated = validateChatRequest(body);
  if (!validated.ok) {
    return json(validated, 400);
  }

  try {
    const config = getOpenRouterConfig();
    const policy = await loadPolicy(
      validated.data.activeSession.assessmentInput.requestType,
    );
    const ai = getAIAdapter(config);

    return ai.streamChat({
      modelId: config.chatModel,
      prompt: buildChatPrompt({
        activeSession: validated.data.activeSession,
        policy,
        latestUserMessage: validated.data.latestUserMessage,
      }),
    });
  } catch {
    return json(
      {
        errorCode: "CHAT_SERVICE_ERROR",
        message: serviceCopy.chatUnavailable,
        retryable: true,
      },
      503,
    );
  }
}

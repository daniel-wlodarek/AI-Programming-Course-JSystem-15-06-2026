import { validationCopy } from "@/shared/polish-copy";

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  chatModel: string;
  visionModel: string;
  appUrl?: string;
  appTitle?: string;
}

type EnvSource = Record<string, string | undefined>;

function readRequired(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getOpenRouterConfig(
  env: EnvSource = process.env,
): OpenRouterConfig {
  const apiKey = readRequired(env.OPENROUTER_API_KEY);
  const chatModel = readRequired(env.OPENROUTER_CHAT_MODEL);
  const visionModel = readRequired(env.OPENROUTER_VISION_MODEL);

  if (!apiKey || !chatModel || !visionModel) {
    throw new Error(validationCopy.aiConfigurationMissing);
  }

  return {
    apiKey,
    baseUrl:
      readRequired(env.OPENROUTER_BASE_URL) ?? "https://openrouter.ai/api/v1",
    chatModel,
    visionModel,
    appUrl: readRequired(env.OPENROUTER_APP_URL) ?? undefined,
    appTitle: readRequired(env.OPENROUTER_APP_TITLE) ?? undefined,
  };
}

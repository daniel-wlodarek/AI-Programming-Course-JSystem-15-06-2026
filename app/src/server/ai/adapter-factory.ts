import "server-only";

import { type OpenRouterConfig } from "@/server/env";
import { type AIAdapter } from "./assessment-orchestrator";
import { createOpenRouterAdapter } from "./openrouter";

type AIAdapterFactory = (config: OpenRouterConfig) => AIAdapter;

let testFactory: AIAdapterFactory | null = null;

export function getAIAdapter(config: OpenRouterConfig): AIAdapter {
  return (testFactory ?? createOpenRouterAdapter)(config);
}

export function setAIAdapterFactoryForTests(factory: AIAdapterFactory) {
  testFactory = factory;
}

export function resetAIAdapterFactoryForTests() {
  testFactory = null;
}

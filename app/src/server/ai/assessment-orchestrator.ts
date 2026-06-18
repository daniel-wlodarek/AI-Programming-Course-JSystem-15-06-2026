import {
  type AssessmentInput,
  type DecisionResult,
  type ImageAnalysis,
} from "@/shared/contracts";
import { serviceCopy } from "@/shared/polish-copy";
import { type OpenRouterConfig } from "@/server/env";
import { loadPolicy, type PolicyDocument } from "@/server/policies/policy-loader";
import { validateDecisionResult } from "./decision-schema";
import { buildDecisionPrompt, buildImageAnalysisPrompt } from "./prompts";

export interface ProcessedImage {
  data: Uint8Array;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}

export interface AnalyzeImageArgs {
  modelId: string;
  prompt: string;
  image: ProcessedImage;
}

export interface GenerateDecisionArgs {
  modelId: string;
  prompt: string;
  retry: boolean;
}

export interface StreamChatArgs {
  modelId: string;
  prompt: string;
}

export interface AIAdapter {
  analyzeImage(args: AnalyzeImageArgs): Promise<ImageAnalysis>;
  generateDecision(args: GenerateDecisionArgs): Promise<unknown>;
  streamChat(args: StreamChatArgs): Response;
}

export interface AssessmentPipelineResult {
  imageAnalysis: ImageAnalysis;
  decision: DecisionResult;
  policy: PolicyDocument;
}

export class AssessmentPipelineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssessmentPipelineError";
  }
}

export async function runAssessmentPipeline({
  assessmentInput,
  processedImage,
  ai,
  config,
}: {
  assessmentInput: AssessmentInput;
  processedImage: ProcessedImage;
  ai: AIAdapter;
  config: OpenRouterConfig;
}): Promise<AssessmentPipelineResult> {
  let imageAnalysis: ImageAnalysis;

  try {
    imageAnalysis = await ai.analyzeImage({
      modelId: config.visionModel,
      prompt: buildImageAnalysisPrompt({
        requestType: assessmentInput.requestType,
        equipmentCategory: assessmentInput.equipmentCategory,
        equipmentName: assessmentInput.equipmentName,
      }),
      image: processedImage,
    });
  } catch {
    throw new AssessmentPipelineError(
      `Nie udało się przeanalizować zdjęcia. ${serviceCopy.assessmentUnavailable}`,
    );
  }

  const policy = await loadPolicy(assessmentInput.requestType);
  const decisionPrompt = buildDecisionPrompt({
    assessmentInput,
    imageAnalysis,
    policy,
  });

  const firstDecision = validateDecisionResult(
    await ai.generateDecision({
      modelId: config.chatModel,
      prompt: decisionPrompt,
      retry: false,
    }),
  );

  if (firstDecision.ok) {
    return {
      imageAnalysis,
      decision: firstDecision.data,
      policy,
    };
  }

  const retryDecision = validateDecisionResult(
    await ai.generateDecision({
      modelId: config.chatModel,
      prompt: buildDecisionPrompt({
        assessmentInput,
        imageAnalysis,
        policy,
        retry: true,
      }),
      retry: true,
    }),
  );

  if (!retryDecision.ok) {
    throw new AssessmentPipelineError(
      `Nie udało się przygotować poprawnej decyzji. ${serviceCopy.assessmentUnavailable}`,
    );
  }

  return {
    imageAnalysis,
    decision: retryDecision.data,
    policy,
  };
}

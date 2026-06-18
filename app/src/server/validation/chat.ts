import {
  type ActiveSession,
  type ChatMessage,
  isConfidence,
  isDecision,
  isEquipmentCategory,
  isRequestType,
} from "@/shared/contracts";
import { validationCopy } from "@/shared/polish-copy";

type ChatValidationResult =
  | {
      ok: true;
      data: {
        activeSession: ActiveSession;
        messages: ChatMessage[];
        latestUserMessage: string;
      };
    }
  | {
      ok: false;
      errorCode: "VALIDATION_ERROR";
      message: string;
    };

function failure(message: string): ChatValidationResult {
  return {
    ok: false,
    errorCode: "VALIDATION_ERROR",
    message,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function containsImagePayload(value: unknown): boolean {
  if (typeof value === "string") {
    return /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);
  }

  if (Array.isArray(value)) {
    return value.some(containsImagePayload);
  }

  if (!isRecord(value)) {
    return false;
  }

  if (
    value.type === "image" ||
    value.type === "file" ||
    value.mediaType === "image" ||
    typeof value.image === "string" ||
    typeof value.dataUrl === "string"
  ) {
    return true;
  }

  return Object.values(value).some(containsImagePayload);
}

function textFromMessage(message: ChatMessage): string {
  if (typeof message.content === "string") {
    return message.content.trim();
  }

  return (
    message.parts
      ?.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim() ?? ""
  );
}

function isValidActiveSession(value: unknown): value is ActiveSession {
  if (!isRecord(value)) {
    return false;
  }

  const assessmentInput = value.assessmentInput;
  const imageAnalysis = value.imageAnalysis;
  const initialDecision = value.initialDecision;

  return (
    typeof value.sessionId === "string" &&
    typeof value.firstAssistantMessage === "string" &&
    isRecord(assessmentInput) &&
    isRequestType(assessmentInput.requestType) &&
    isEquipmentCategory(assessmentInput.equipmentCategory) &&
    typeof assessmentInput.equipmentName === "string" &&
    typeof assessmentInput.purchaseDate === "string" &&
    typeof assessmentInput.reason === "string" &&
    isRecord(imageAnalysis) &&
    isRequestType(imageAnalysis.requestType) &&
    typeof imageAnalysis.summary === "string" &&
    imageAnalysis.summary.trim().length > 0 &&
    typeof imageAnalysis.visibleDamage === "string" &&
    typeof imageAnalysis.likelyCause === "string" &&
    typeof imageAnalysis.resaleCondition === "string" &&
    Array.isArray(imageAnalysis.qualityIssues) &&
    isConfidence(imageAnalysis.confidence) &&
    isRecord(initialDecision) &&
    isDecision(initialDecision.decision) &&
    typeof initialDecision.summary === "string" &&
    typeof initialDecision.justification === "string" &&
    Array.isArray(initialDecision.policyReferences) &&
    Array.isArray(initialDecision.missingInformation) &&
    Array.isArray(initialDecision.conditions) &&
    Array.isArray(initialDecision.nextSteps) &&
    typeof initialDecision.disclaimer === "string" &&
    isConfidence(initialDecision.confidence)
  );
}

function messageList(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  if (
    value.every(
      (message) =>
        isRecord(message) &&
        typeof message.id === "string" &&
        (message.role === "user" ||
          message.role === "assistant" ||
          message.role === "system"),
    )
  ) {
    return value as ChatMessage[];
  }

  return null;
}

export function validateChatRequest(value: unknown): ChatValidationResult {
  if (containsImagePayload(value)) {
    return failure(validationCopy.chatImagesNotAccepted);
  }

  if (!isRecord(value) || !value.activeSession) {
    return failure(validationCopy.missingChatSession);
  }

  if (
    isRecord(value.activeSession) &&
    !isRecord(value.activeSession.imageAnalysis)
  ) {
    return failure(validationCopy.missingImageAnalysis);
  }

  if (
    isRecord(value.activeSession) &&
    isRecord(value.activeSession.initialDecision) &&
    !isDecision(value.activeSession.initialDecision.decision)
  ) {
    return failure(validationCopy.invalidInitialDecision);
  }

  if (!isValidActiveSession(value.activeSession)) {
    return failure(validationCopy.missingChatSession);
  }

  const messages = messageList(value.messages);
  if (!messages) {
    return failure(validationCopy.missingChatMessage);
  }

  const latestUser = messages.findLast((message) => message.role === "user");
  const latestUserMessage = latestUser ? textFromMessage(latestUser) : "";

  if (!latestUserMessage) {
    return failure(validationCopy.missingChatMessage);
  }

  return {
    ok: true,
    data: {
      activeSession: value.activeSession,
      messages,
      latestUserMessage,
    },
  };
}

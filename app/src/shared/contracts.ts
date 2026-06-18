export const REQUEST_TYPES = ["RETURN", "COMPLAINT"] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  RETURN: "Zwrot",
  COMPLAINT: "Reklamacja",
};

export const EQUIPMENT_CATEGORIES = [
  "Smartfon",
  "Laptop",
  "Tablet",
  "Telewizor/Monitor",
  "Audio/Słuchawki",
  "Smartwatch/Wearable",
  "Aparat/Kamera",
  "Konsola do gier",
  "Sprzęt AGD",
  "Inne",
] as const;
export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

export const DECISIONS = [
  "APPROVE",
  "REJECT",
  "NEEDS_MORE_INFO",
  "CONDITIONAL",
  "ESCALATE",
] as const;
export type Decision = (typeof DECISIONS)[number];

export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export interface AssessmentInput {
  requestType: RequestType;
  equipmentCategory: EquipmentCategory;
  equipmentName: string;
  purchaseDate: string;
  reason: string;
}

export interface ImageAnalysis {
  requestType: RequestType;
  summary: string;
  visibleDamage: string;
  likelyCause: string;
  resaleCondition: string;
  qualityIssues: string[];
  confidence: Confidence;
}

export interface DecisionResult {
  decision: Decision;
  summary: string;
  justification: string;
  policyReferences: string[];
  missingInformation: string[];
  conditions: string[];
  nextSteps: string[];
  disclaimer: string;
  confidence: Confidence;
}

export interface ChatTextPart {
  type: "text";
  text: string;
}

export interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  parts?: ChatTextPart[];
  content?: string;
}

export interface ActiveSession {
  sessionId: string;
  assessmentInput: AssessmentInput;
  imageAnalysis: ImageAnalysis;
  initialDecision: DecisionResult;
  firstAssistantMessage: string;
  messages?: ChatMessage[];
}

export type AssessmentSuccessResponse = ActiveSession;

export interface ValidationErrorResponse {
  errorCode: "VALIDATION_ERROR";
  message: string;
  fieldErrors: Record<string, string>;
}

export interface ServiceErrorResponse {
  errorCode: "AI_SERVICE_ERROR" | "CHAT_SERVICE_ERROR" | "UNEXPECTED_ERROR";
  message: string;
  retryable: boolean;
}

export function isRequestType(value: unknown): value is RequestType {
  return typeof value === "string" && REQUEST_TYPES.includes(value as RequestType);
}

export function isEquipmentCategory(
  value: unknown,
): value is EquipmentCategory {
  return (
    typeof value === "string" &&
    EQUIPMENT_CATEGORIES.includes(value as EquipmentCategory)
  );
}

export function isDecision(value: unknown): value is Decision {
  return typeof value === "string" && DECISIONS.includes(value as Decision);
}

export function isConfidence(value: unknown): value is Confidence {
  return (
    typeof value === "string" &&
    CONFIDENCE_LEVELS.includes(value as Confidence)
  );
}

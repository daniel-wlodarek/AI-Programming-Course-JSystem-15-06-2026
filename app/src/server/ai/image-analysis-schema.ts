import { z } from "zod";
import {
  CONFIDENCE_LEVELS,
  type ImageAnalysis,
  REQUEST_TYPES,
} from "@/shared/contracts";

export const imageAnalysisSchema = z.object({
  requestType: z.enum(REQUEST_TYPES),
  summary: z.string().trim().min(1),
  visibleDamage: z.string().trim().min(1),
  likelyCause: z.string().trim().min(1),
  resaleCondition: z.string().trim().min(1),
  qualityIssues: z.array(z.string().trim().min(1)),
  confidence: z.enum(CONFIDENCE_LEVELS),
});

export function validateImageAnalysis(candidate: unknown): ImageAnalysis {
  return imageAnalysisSchema.parse(candidate);
}

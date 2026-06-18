import { type AssessmentInput } from "@/shared/contracts";

export interface IntakeFormSubmission {
  input: AssessmentInput;
  image: File;
}

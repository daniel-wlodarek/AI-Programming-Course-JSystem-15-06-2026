import {
  type AssessmentInput,
  isEquipmentCategory,
  isRequestType,
} from "@/shared/contracts";
import { validationCopy } from "@/shared/polish-copy";
import { type ValidationResult, validationFailure } from "./types";

interface AssessmentValidationOptions {
  today?: Date;
}

function firstValue(value: unknown): string {
  if (Array.isArray(value)) {
    return firstValue(value[0]);
  }

  return typeof value === "string" ? value.trim() : "";
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && dateOnly(parsed) === value;
}

export function validateAssessmentFields(
  input: Record<string, unknown>,
  options: AssessmentValidationOptions = {},
): ValidationResult<AssessmentInput> {
  const requestType = firstValue(input.requestType);
  const equipmentCategory = firstValue(input.equipmentCategory);
  const equipmentName = firstValue(input.equipmentName);
  const purchaseDate = firstValue(input.purchaseDate);
  const reason = firstValue(input.reason);
  const fieldErrors: Record<string, string> = {};

  if (!isRequestType(requestType)) {
    fieldErrors.requestType = validationCopy.invalidRequestType;
  }

  if (!isEquipmentCategory(equipmentCategory)) {
    fieldErrors.equipmentCategory = validationCopy.missingCategory;
  }

  if (!equipmentName) {
    fieldErrors.equipmentName = validationCopy.missingEquipmentName;
  }

  if (!purchaseDate) {
    fieldErrors.purchaseDate = validationCopy.missingPurchaseDate;
  } else if (!isIsoDate(purchaseDate)) {
    fieldErrors.purchaseDate = validationCopy.invalidPurchaseDate;
  } else if (purchaseDate > dateOnly(options.today ?? new Date())) {
    fieldErrors.purchaseDate = validationCopy.futurePurchaseDate;
  }

  if (requestType === "COMPLAINT" && !reason) {
    fieldErrors.reason = validationCopy.missingComplaintReason;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return validationFailure(fieldErrors);
  }

  return {
    ok: true,
    data: {
      requestType: requestType as AssessmentInput["requestType"],
      equipmentCategory:
        equipmentCategory as AssessmentInput["equipmentCategory"],
      equipmentName,
      purchaseDate,
      reason,
    },
  };
}

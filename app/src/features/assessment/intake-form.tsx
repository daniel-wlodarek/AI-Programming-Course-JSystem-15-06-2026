"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  EQUIPMENT_CATEGORIES,
  type EquipmentCategory,
  type RequestType,
  REQUEST_TYPE_LABELS,
} from "@/shared/contracts";
import { assessmentFormCopy, validationCopy } from "@/shared/polish-copy";
import { type IntakeFormSubmission } from "./types";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

interface IntakeFormProps {
  onSubmit: (submission: IntakeFormSubmission) => void | Promise<void>;
  today?: Date;
  disabled?: boolean;
}

interface FormDraft {
  requestType: RequestType | "";
  equipmentCategory: EquipmentCategory | "";
  equipmentName: string;
  purchaseDate: string;
  reason: string;
  image: File | null;
}

type FieldErrors = Partial<Record<keyof FormDraft, string>>;

const emptyDraft: FormDraft = {
  requestType: "",
  equipmentCategory: "",
  equipmentName: "",
  purchaseDate: "",
  reason: "",
  image: null,
};

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return validationCopy.unsupportedImageType;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return validationCopy.oversizedImage;
  }

  return null;
}

function validateDraft(draft: FormDraft, today: Date): FieldErrors {
  const errors: FieldErrors = {};

  if (!draft.requestType) {
    errors.requestType = validationCopy.invalidRequestType;
  }

  if (!draft.equipmentCategory) {
    errors.equipmentCategory = validationCopy.missingCategory;
  }

  if (!draft.equipmentName.trim()) {
    errors.equipmentName = validationCopy.missingEquipmentName;
  }

  if (!draft.purchaseDate) {
    errors.purchaseDate = validationCopy.missingPurchaseDate;
  } else if (!isIsoDate(draft.purchaseDate)) {
    errors.purchaseDate = validationCopy.invalidPurchaseDate;
  } else if (draft.purchaseDate > dateOnly(today)) {
    errors.purchaseDate = validationCopy.futurePurchaseDate;
  }

  if (draft.requestType === "COMPLAINT" && !draft.reason.trim()) {
    errors.reason = validationCopy.missingComplaintReason;
  }

  if (!draft.image) {
    errors.image = validationCopy.missingImage;
  }

  return errors;
}

export function IntakeForm({
  onSubmit,
  today = new Date(),
  disabled = false,
}: IntakeFormProps) {
  const [draft, setDraft] = useState<FormDraft>(emptyDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const reasonRequirement = useMemo(
    () =>
      draft.requestType === "COMPLAINT"
        ? assessmentFormCopy.complaintRequired
        : assessmentFormCopy.returnOptional,
    [draft.requestType],
  );

  function updateDraft(next: Partial<FormDraft>) {
    setDraft((current) => ({ ...current, ...next }));
    setErrors((current) => {
      const cleared = { ...current };
      for (const key of Object.keys(next) as Array<keyof FormDraft>) {
        delete cleared[key];
      }
      return cleared;
    });
  }

  function handleImageChange(fileList: FileList | null) {
    const file = fileList?.[0] ?? null;

    if (!file) {
      updateDraft({ image: null });
      return;
    }

    const error = validateImage(file);
    if (error) {
      setErrors((current) => ({ ...current, image: error }));
      return;
    }

    updateDraft({ image: file });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateDraft(draft, today);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !draft.image) {
      return;
    }

    await onSubmit({
      input: {
        requestType: draft.requestType as RequestType,
        equipmentCategory: draft.equipmentCategory as EquipmentCategory,
        equipmentName: draft.equipmentName.trim(),
        purchaseDate: draft.purchaseDate,
        reason: draft.reason.trim(),
      },
      image: draft.image,
    });
  }

  return (
    <form
      className="grid gap-5 rounded-[6px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-tinted)] p-5 shadow-[var(--shadow-card)] sm:p-6"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="grid gap-1">
        <h2 className="text-xl font-bold tracking-normal">{assessmentFormCopy.title}</h2>
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {assessmentFormCopy.intro}
        </p>
      </div>

      <fieldset className="grid gap-2" disabled={disabled}>
        <legend className="text-sm font-bold">{assessmentFormCopy.requestType}</legend>
        <div className="grid grid-cols-2 gap-2 rounded-[9999px] bg-[var(--color-bg-elevated)] p-1">
          {(["COMPLAINT", "RETURN"] as const).map((requestType) => (
            <button
              key={requestType}
              type="button"
              className={`rounded-[9999px] px-4 py-2 text-sm font-bold transition ${
                draft.requestType === requestType
                  ? "bg-[var(--color-brand-primary)] text-[var(--color-text-on-brand)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
              onClick={() => updateDraft({ requestType })}
            >
              {REQUEST_TYPE_LABELS[requestType]}
            </button>
          ))}
        </div>
        {errors.requestType ? <FieldError message={errors.requestType} /> : null}
      </fieldset>

      <label className="grid gap-2 text-sm font-bold">
        {assessmentFormCopy.category}
        <select
          className="rounded-[4px] border border-[var(--color-border-default)] bg-white px-4 py-3 text-[var(--color-bg-base)] outline-none focus:border-[var(--color-brand-primary)]"
          disabled={disabled}
          value={draft.equipmentCategory}
          onChange={(event) =>
            updateDraft({
              equipmentCategory: event.target.value as EquipmentCategory,
            })
          }
        >
          <option value="">{assessmentFormCopy.categoryPlaceholder}</option>
          {EQUIPMENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.equipmentCategory ? (
          <FieldError message={errors.equipmentCategory} />
        ) : null}
      </label>

      <label className="grid gap-2 text-sm font-bold">
        {assessmentFormCopy.equipmentName}
        <input
          className="rounded-[4px] border border-[var(--color-border-default)] bg-white px-4 py-3 text-[var(--color-bg-base)] outline-none focus:border-[var(--color-brand-primary)]"
          disabled={disabled}
          type="text"
          value={draft.equipmentName}
          onChange={(event) => updateDraft({ equipmentName: event.target.value })}
        />
        {errors.equipmentName ? <FieldError message={errors.equipmentName} /> : null}
      </label>

      <label className="grid gap-2 text-sm font-bold">
        {assessmentFormCopy.purchaseDate}
        <input
          className="rounded-[4px] border border-[var(--color-border-default)] bg-white px-4 py-3 text-[var(--color-bg-base)] outline-none focus:border-[var(--color-brand-primary)]"
          disabled={disabled}
          max={dateOnly(today)}
          type="date"
          value={draft.purchaseDate}
          onChange={(event) => updateDraft({ purchaseDate: event.target.value })}
        />
        {errors.purchaseDate ? <FieldError message={errors.purchaseDate} /> : null}
      </label>

      <label className="grid gap-2 text-sm font-bold">
        <span>
          {assessmentFormCopy.reason}
          <span className="ml-2 text-xs font-medium text-[var(--color-text-secondary)]">
            {reasonRequirement}
          </span>
        </span>
        <textarea
          className="min-h-28 rounded-[4px] border border-[var(--color-border-default)] bg-white px-4 py-3 text-[var(--color-bg-base)] outline-none focus:border-[var(--color-brand-primary)]"
          disabled={disabled}
          value={draft.reason}
          onChange={(event) => updateDraft({ reason: event.target.value })}
        />
        {errors.reason ? <FieldError message={errors.reason} /> : null}
      </label>

      <div className="grid gap-2">
        <label className="text-sm font-bold" htmlFor="assessment-image">
          {assessmentFormCopy.image}
        </label>
        <div className="grid gap-3 rounded-[6px] border border-dashed border-[var(--color-border-strong,#535353)] bg-[var(--color-bg-elevated)] p-4">
          <input
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            disabled={disabled}
            id="assessment-image"
            type="file"
            onChange={(event) => handleImageChange(event.target.files)}
          />
          <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
            {assessmentFormCopy.imageHelp}
          </p>
          {draft.image ? (
            <div className="flex items-center justify-between gap-3 rounded-[4px] bg-[var(--color-bg-press)] px-3 py-2 text-sm">
              <span className="min-w-0 truncate">{draft.image.name}</span>
              <button
                aria-label={assessmentFormCopy.removeImage}
                className="inline-flex size-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated-highlight)] hover:text-[var(--color-text-primary)]"
                disabled={disabled}
                type="button"
                onClick={() => updateDraft({ image: null })}
              >
                <X aria-hidden="true" size={16} />
              </button>
            </div>
          ) : null}
        </div>
        {errors.image ? <FieldError message={errors.image} /> : null}
      </div>

      <button
        className="rounded-[9999px] bg-[var(--color-brand-primary)] px-8 py-3 text-base font-bold text-[var(--color-text-on-brand)] transition hover:bg-[var(--color-brand-primary-hover)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
        disabled={disabled}
        type="submit"
      >
        {assessmentFormCopy.submit}
      </button>
    </form>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="text-sm font-medium text-[var(--color-brand-error)]" role="alert">
      {message}
    </p>
  );
}

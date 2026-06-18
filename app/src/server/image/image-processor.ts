import "server-only";

import sharp from "sharp";
import { validationCopy } from "@/shared/polish-copy";
import { type ProcessedImage } from "@/server/ai/assessment-orchestrator";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_LONG_EDGE = 1600;

export class ImageValidationError extends Error {
  constructor(public readonly fieldError: string) {
    super(fieldError);
    this.name = "ImageValidationError";
  }
}

function isAcceptedMimeType(value: string): value is (typeof ACCEPTED_IMAGE_TYPES)[number] {
  return ACCEPTED_IMAGE_TYPES.includes(value as (typeof ACCEPTED_IMAGE_TYPES)[number]);
}

function detectImageType(bytes: Uint8Array): (typeof ACCEPTED_IMAGE_TYPES)[number] | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }

  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") {
    return "image/webp";
  }

  return null;
}

export async function processAssessmentImage(file: File): Promise<ProcessedImage> {
  if (!isAcceptedMimeType(file.type)) {
    throw new ImageValidationError(validationCopy.unsupportedImageType);
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageValidationError(validationCopy.oversizedImage);
  }

  const input = new Uint8Array(await file.arrayBuffer());
  const detected = detectImageType(input);

  if (!detected) {
    throw new ImageValidationError(validationCopy.unsupportedImageType);
  }

  const data = await sharp(input)
    .rotate()
    .resize({
      width: MAX_LONG_EDGE,
      height: MAX_LONG_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 82,
      mozjpeg: true,
    })
    .toBuffer();

  return {
    data,
    mediaType: "image/jpeg",
  };
}

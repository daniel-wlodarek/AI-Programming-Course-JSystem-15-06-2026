// @vitest-environment node

import sharp from "sharp";
import { processAssessmentImage } from "./image-processor";

async function pngFile(width: number, height: number, name = "sprzet.png") {
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: "#1ED760",
    },
  })
    .png()
    .toBuffer();

  return new File([buffer], name, { type: "image/png" });
}

describe("image processor", () => {
  it("strips metadata, converts to JPEG and limits the longest edge to 1600px", async () => {
    const processed = await processAssessmentImage(await pngFile(2400, 1200));
    const metadata = await sharp(processed.data).metadata();

    expect(processed.mediaType).toBe("image/jpeg");
    expect(metadata.format).toBe("jpeg");
    expect(Math.max(metadata.width ?? 0, metadata.height ?? 0)).toBeLessThanOrEqual(1600);
    expect(metadata.exif).toBeUndefined();
  });

  it("rejects unsupported files before processing", async () => {
    await expect(
      processAssessmentImage(new File(["%PDF"], "instrukcja.pdf", { type: "application/pdf" })),
    ).rejects.toMatchObject({
      fieldError: "Akceptujemy tylko pliki JPEG, PNG albo WebP.",
    });
  });
});

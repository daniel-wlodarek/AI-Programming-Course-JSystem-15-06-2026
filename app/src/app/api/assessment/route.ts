import { formatFirstAssistantMessage } from "@/shared/decision-message";
import { serviceCopy, validationCopy } from "@/shared/polish-copy";
import { getAIAdapter } from "@/server/ai/adapter-factory";
import { AssessmentPipelineError, runAssessmentPipeline } from "@/server/ai/assessment-orchestrator";
import { getOpenRouterConfig } from "@/server/env";
import { ImageValidationError, processAssessmentImage } from "@/server/image/image-processor";
import { validateAssessmentFields } from "@/server/validation/assessment";

export const runtime = "nodejs";
export const maxDuration = 60;

function isFile(value: FormDataEntryValue): value is File {
  return typeof value !== "string" && value.size > 0;
}

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function textFields(formData: FormData): Record<string, unknown> {
  return {
    requestType: formData.get("requestType"),
    equipmentCategory: formData.get("equipmentCategory"),
    equipmentName: formData.get("equipmentName"),
    purchaseDate: formData.get("purchaseDate"),
    reason: formData.get("reason"),
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fields = validateAssessmentFields(textFields(formData));

    if (!fields.ok) {
      return json(fields, 400);
    }

    const imageFiles = formData.getAll("image").filter(isFile);
    if (imageFiles.length === 0) {
      return json(
        {
          errorCode: "VALIDATION_ERROR",
          message: "Popraw błędy w formularzu.",
          fieldErrors: { image: validationCopy.missingImage },
        },
        400,
      );
    }

    if (imageFiles.length > 1) {
      return json(
        {
          errorCode: "VALIDATION_ERROR",
          message: "Popraw błędy w formularzu.",
          fieldErrors: { image: validationCopy.multipleImages },
        },
        400,
      );
    }

    let processedImage;
    try {
      processedImage = await processAssessmentImage(imageFiles[0]);
    } catch (error) {
      if (error instanceof ImageValidationError) {
        return json(
          {
            errorCode: "VALIDATION_ERROR",
            message: "Popraw błędy w formularzu.",
            fieldErrors: { image: error.fieldError },
          },
          400,
        );
      }

      throw error;
    }

    const config = getOpenRouterConfig();
    const ai = getAIAdapter(config);

    try {
      const assessment = await runAssessmentPipeline({
        assessmentInput: fields.data,
        processedImage,
        ai,
        config,
      });
      const firstAssistantMessage = formatFirstAssistantMessage(assessment.decision);

      return json(
        {
          sessionId: crypto.randomUUID(),
          assessmentInput: fields.data,
          imageAnalysis: assessment.imageAnalysis,
          initialDecision: assessment.decision,
          firstAssistantMessage,
        },
        200,
      );
    } catch (error) {
      if (error instanceof AssessmentPipelineError) {
        return json(
          {
            errorCode: "AI_SERVICE_ERROR",
            message: serviceCopy.assessmentUnavailable,
            retryable: true,
          },
          503,
        );
      }

      throw error;
    }
  } catch {
    return json(
      {
        errorCode: "UNEXPECTED_ERROR",
        message: serviceCopy.assessmentUnavailable,
        retryable: true,
      },
      500,
    );
  }
}

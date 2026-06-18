import { validateAssessmentFields } from "./assessment";

const validAssessment = {
  requestType: "RETURN",
  equipmentCategory: "Laptop",
  equipmentName: "ThinkPad X1",
  purchaseDate: "2026-06-01",
  reason: "",
};

describe("assessment field validation", () => {
  it("accepts a trimmed valid return request", () => {
    const result = validateAssessmentFields(validAssessment, {
      today: new Date("2026-06-18T12:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.equipmentName).toBe("ThinkPad X1");
      expect(result.data.reason).toBe("");
    }
  });

  it("requires a reason for complaints", () => {
    const result = validateAssessmentFields(
      { ...validAssessment, requestType: "COMPLAINT", reason: "   " },
      { today: new Date("2026-06-18T12:00:00.000Z") },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.reason).toBe(
        "Opisz usterkę, aby zgłosić reklamację.",
      );
    }
  });

  it("blocks future purchase dates", () => {
    const result = validateAssessmentFields(
      { ...validAssessment, purchaseDate: "2026-06-19" },
      { today: new Date("2026-06-18T12:00:00.000Z") },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.purchaseDate).toBe(
        "Data zakupu nie może być z przyszłości.",
      );
    }
  });
});

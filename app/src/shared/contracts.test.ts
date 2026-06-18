import {
  DECISIONS,
  EQUIPMENT_CATEGORIES,
  REQUEST_TYPES,
  REQUEST_TYPE_LABELS,
} from "./contracts";

describe("shared contracts", () => {
  it("exposes exactly the PRD request types and Polish labels", () => {
    expect(REQUEST_TYPES).toEqual(["RETURN", "COMPLAINT"]);
    expect(REQUEST_TYPE_LABELS).toEqual({
      RETURN: "Zwrot",
      COMPLAINT: "Reklamacja",
    });
  });

  it("exposes the exact PRD equipment category list", () => {
    expect(EQUIPMENT_CATEGORIES).toEqual([
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
    ]);
  });

  it("exposes only accepted decision enum values", () => {
    expect(DECISIONS).toEqual([
      "APPROVE",
      "REJECT",
      "NEEDS_MORE_INFO",
      "CONDITIONAL",
      "ESCALATE",
    ]);
  });
});

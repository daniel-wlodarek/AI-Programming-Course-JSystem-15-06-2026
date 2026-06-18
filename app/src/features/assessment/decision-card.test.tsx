import { render, screen } from "@testing-library/react";
import { MANDATORY_DISCLAIMER } from "@/shared/polish-copy";
import { DecisionCard } from "./decision-card";

const decision = {
  decision: "APPROVE" as const,
  summary: "Zwrot prawdopodobnie kwalifikuje się do przyjęcia.",
  justification: "Zgłoszenie mieści się w terminie 14 dni.",
  policyReferences: ["Polityka zwrotów 2.1"],
  missingInformation: [],
  conditions: [],
  nextSteps: ["Przygotuj komplet akcesoriów.", "Zachowaj numer zgłoszenia."],
  disclaimer: MANDATORY_DISCLAIMER,
  confidence: "high" as const,
};

describe("DecisionCard", () => {
  it("renders greeting, decision, justification, next steps and disclaimer in order", () => {
    const { container } = render(<DecisionCard decision={decision} />);
    const text = container.textContent ?? "";

    expect(text.indexOf("Dzień dobry")).toBeLessThan(
      text.indexOf("Prawdopodobnie kwalifikuje się"),
    );
    expect(text.indexOf("Prawdopodobnie kwalifikuje się")).toBeLessThan(
      text.indexOf("Uzasadnienie"),
    );
    expect(text.indexOf("Uzasadnienie")).toBeLessThan(
      text.indexOf("Kolejne kroki"),
    );
    expect(text.indexOf("Kolejne kroki")).toBeLessThan(
      text.indexOf(MANDATORY_DISCLAIMER),
    );
  });

  it("marks the status label as a distinct visual element", () => {
    expect(
      render(<DecisionCard decision={decision} />).container.querySelector(
        '[data-status-label="true"]',
      ),
    ).toHaveTextContent("Prawdopodobnie kwalifikuje się");
    expect(screen.getByText("Zwrot prawdopodobnie kwalifikuje się do przyjęcia.")).toBeVisible();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MANDATORY_DISCLAIMER } from "@/shared/polish-copy";
import { AssessmentPage } from "./assessment-page";

const activeSession = {
  sessionId: "session-1",
  assessmentInput: {
    requestType: "RETURN",
    equipmentCategory: "Laptop",
    equipmentName: "ThinkPad X1",
    purchaseDate: "2026-06-01",
    reason: "",
  },
  imageAnalysis: {
    requestType: "RETURN",
    summary: "Laptop jest czysty i bez widocznych uszkodzeń.",
    visibleDamage: "Brak.",
    likelyCause: "Nie dotyczy.",
    resaleCondition: "Dobry stan do odsprzedaży.",
    qualityIssues: [],
    confidence: "high",
  },
  initialDecision: {
    decision: "APPROVE",
    summary: "Zwrot prawdopodobnie kwalifikuje się do przyjęcia.",
    justification: "Zgłoszenie mieści się w terminie 14 dni.",
    policyReferences: ["Polityka zwrotów 2.1"],
    missingInformation: [],
    conditions: [],
    nextSteps: ["Przygotuj komplet akcesoriów."],
    disclaimer: MANDATORY_DISCLAIMER,
    confidence: "high",
  },
  firstAssistantMessage: "Dzień dobry. Decyzja: prawdopodobnie kwalifikuje się.",
};

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function imageFile() {
  return new File([new Uint8Array([1, 2, 3])], "sprzet.jpg", {
    type: "image/jpeg",
  });
}

async function submitValidReturn(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Zwrot" }));
  await user.selectOptions(screen.getByLabelText("Kategoria sprzętu"), "Laptop");
  await user.type(screen.getByLabelText("Nazwa lub model sprzętu"), "ThinkPad X1");
  await user.type(screen.getByLabelText("Data zakupu"), "2026-06-01");
  await user.upload(screen.getByLabelText("Zdjęcie sprzętu"), imageFile());
  await user.click(screen.getByRole("button", { name: "Przygotuj ocenę" }));
}

describe("AssessmentPage assessment flow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits multipart assessment data and renders the decision card", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(await jsonResponse(activeSession));
    render(<AssessmentPage />);

    await submitValidReturn(user);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assessment",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );
    expect(
      await screen.findByText("Prawdopodobnie kwalifikuje się"),
    ).toBeVisible();
    expect(screen.getByText("Zgłoszenie mieści się w terminie 14 dni.")).toBeVisible();
    expect(screen.getByText(MANDATORY_DISCLAIMER)).toBeVisible();
  });

  it("shows processing state while assessment is pending", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => undefined));
    render(<AssessmentPage />);

    await submitValidReturn(user);

    expect(
      screen.getByText("Analizujemy zdjęcie i przygotowujemy ocenę..."),
    ).toBeVisible();
  });

  it("shows retryable service error without a decision", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      await jsonResponse(
        {
          errorCode: "AI_SERVICE_ERROR",
          message: "Nie udało się przygotować oceny. Spróbuj ponownie za chwilę.",
          retryable: true,
        },
        503,
      ),
    );
    render(<AssessmentPage />);

    await submitValidReturn(user);

    expect(
      await screen.findByText(
        "Nie udało się przygotować oceny. Spróbuj ponownie za chwilę.",
      ),
    ).toBeVisible();
    expect(screen.queryByText("Prawdopodobnie kwalifikuje się")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Spróbuj ponownie" })).toBeVisible();
  });
});

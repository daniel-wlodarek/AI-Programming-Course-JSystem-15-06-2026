import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MANDATORY_DISCLAIMER } from "@/shared/polish-copy";
import { AssessmentPage } from "./assessment-page";

vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: [],
    sendMessage: vi.fn(),
    regenerate: vi.fn(),
    status: "ready",
    error: undefined,
  }),
}));

vi.mock("ai", () => ({
  DefaultChatTransport: vi.fn().mockImplementation(function MockTransport(
    this: { options: unknown },
    options,
  ) {
    this.options = options;
  }),
}));

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

describe("AssessmentPage chat lifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clears active session and returns to an empty form for a new request", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(activeSession), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<AssessmentPage />);

    await submitValidReturn(user);
    expect(await screen.findByText("Prawdopodobnie kwalifikuje się")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Rozpocznij nowe zgłoszenie" }));

    expect(screen.queryByText("Prawdopodobnie kwalifikuje się")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nazwa lub model sprzętu")).toHaveValue("");
  });
});

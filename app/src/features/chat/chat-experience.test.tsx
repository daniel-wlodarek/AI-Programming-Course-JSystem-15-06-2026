import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MANDATORY_DISCLAIMER } from "@/shared/polish-copy";
import { ChatExperience } from "./chat-experience";

const useChatMock = vi.fn();

vi.mock("@ai-sdk/react", () => ({
  useChat: (...args: unknown[]) => useChatMock(...args),
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

function setupUseChat(overrides = {}) {
  const sendMessage = vi.fn();
  const regenerate = vi.fn();
  useChatMock.mockReturnValue({
    messages: [],
    sendMessage,
    regenerate,
    status: "ready",
    error: undefined,
    ...overrides,
  });
  return { sendMessage, regenerate };
}

describe("ChatExperience", () => {
  beforeEach(() => {
    useChatMock.mockReset();
  });

  it("renders the initial decision and follow-up messages", () => {
    setupUseChat({
      messages: [
        {
          id: "u1",
          role: "user",
          parts: [{ type: "text", text: "Czy muszę odesłać pudełko?" }],
        },
        {
          id: "a1",
          role: "assistant",
          parts: [{ type: "text", text: "Tak, kompletne opakowanie pomaga w zwrocie." }],
        },
      ],
    });

    render(<ChatExperience activeSession={activeSession} onNewRequest={vi.fn()} />);

    expect(screen.getByText("Prawdopodobnie kwalifikuje się")).toBeVisible();
    expect(screen.getByText("Czy muszę odesłać pudełko?")).toBeVisible();
    expect(
      screen.getByText("Tak, kompletne opakowanie pomaga w zwrocie."),
    ).toBeVisible();
  });

  it("sends text messages and includes active session in the transport body", async () => {
    const user = userEvent.setup();
    const { sendMessage } = setupUseChat();

    render(<ChatExperience activeSession={activeSession} onNewRequest={vi.fn()} />);

    await user.type(screen.getByLabelText("Wiadomość do asystenta"), "Co dalej?");
    await user.click(screen.getByRole("button", { name: "Wyślij" }));

    expect(sendMessage).toHaveBeenCalledWith({ text: "Co dalej?" });
    expect(useChatMock).toHaveBeenCalledWith(
      expect.objectContaining({
        transport: expect.objectContaining({
          options: expect.objectContaining({
            api: "/api/chat",
            body: { activeSession },
          }),
        }),
      }),
    );
  });

  it("disables composer during streaming", () => {
    setupUseChat({ status: "streaming" });

    render(<ChatExperience activeSession={activeSession} onNewRequest={vi.fn()} />);

    expect(screen.getByLabelText("Wiadomość do asystenta")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Wyślij" })).toBeDisabled();
  });

  it("shows retry control for a failed chat turn", async () => {
    const user = userEvent.setup();
    const { regenerate } = setupUseChat({
      status: "error",
      error: new Error("network"),
    });

    render(<ChatExperience activeSession={activeSession} onNewRequest={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Ponów odpowiedź" }));

    expect(regenerate).toHaveBeenCalled();
  });

  it("marks revised recommendation messages", () => {
    setupUseChat({
      messages: [
        {
          id: "a1",
          role: "assistant",
          parts: [
            {
              type: "text",
              text: "Rekomendacja została zaktualizowana: zwrot jest warunkowy.",
            },
          ],
        },
      ],
    });

    render(<ChatExperience activeSession={activeSession} onNewRequest={vi.fn()} />);

    expect(screen.getByText("Zaktualizowana rekomendacja")).toBeVisible();
  });
});

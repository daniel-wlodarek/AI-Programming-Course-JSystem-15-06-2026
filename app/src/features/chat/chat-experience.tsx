"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { RotateCcw } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { type AssessmentSuccessResponse } from "@/shared/contracts";
import { serviceCopy } from "@/shared/polish-copy";
import { DecisionCard } from "@/features/assessment/decision-card";

interface ChatExperienceProps {
  activeSession: AssessmentSuccessResponse;
  onNewRequest: () => void;
}

function textFromMessage(message: UIMessage): string {
  return (
    message.parts
      ?.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim() ?? ""
  );
}

function isRevisedRecommendation(text: string) {
  const normalized = text.toLowerCase();
  return (
    normalized.includes("rekomendacja została zaktualizowana") ||
    normalized.includes("zaktualizowana rekomendacja")
  );
}

export function ChatExperience({
  activeSession,
  onNewRequest,
}: ChatExperienceProps) {
  const [input, setInput] = useState("");
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { activeSession },
      }),
    [activeSession],
  );
  const { messages, sendMessage, regenerate, status, error } = useChat({
    transport,
  });
  const isBusy = status === "submitted" || status === "streaming";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();

    if (!text || isBusy) {
      return;
    }

    setInput("");
    void sendMessage({ text });
  }

  return (
    <section aria-label="Czat z asystentem" className="grid gap-4">
      <div className="flex justify-end">
        <button
          className="rounded-[9999px] border border-[var(--color-border-strong,#535353)] px-5 py-2 text-sm font-bold text-[var(--color-text-primary)]"
          type="button"
          onClick={onNewRequest}
        >
          Rozpocznij nowe zgłoszenie
        </button>
      </div>

      <DecisionCard decision={activeSession.initialDecision} />

      <div className="grid gap-3">
        {messages.map((message) => {
          const text = textFromMessage(message);
          if (!text) {
            return null;
          }

          return (
            <article
              key={message.id}
              className={`max-w-[78ch] rounded-[6px] p-4 text-sm leading-relaxed ${
                message.role === "user"
                  ? "justify-self-end bg-[var(--color-brand-primary)] text-[var(--color-text-on-brand)]"
                  : "justify-self-start bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]"
              }`}
            >
              {message.role === "assistant" && isRevisedRecommendation(text) ? (
                <p className="mb-2 text-xs font-bold uppercase text-[var(--color-brand-warning)]">
                  Zaktualizowana rekomendacja
                </p>
              ) : null}
              <p>{text}</p>
            </article>
          );
        })}
      </div>

      {isBusy ? (
        <p className="text-sm text-[var(--color-text-secondary)]" role="status">
          Asystent przygotowuje odpowiedź...
        </p>
      ) : null}

      {error ? (
        <div className="grid gap-3 rounded-[6px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-4">
          <p className="text-sm text-[var(--color-text-primary)]">
            {serviceCopy.chatUnavailable}
          </p>
          <button
            className="inline-flex w-fit items-center gap-2 rounded-[9999px] bg-[var(--color-brand-primary)] px-5 py-2 text-sm font-bold text-[var(--color-text-on-brand)]"
            type="button"
            onClick={() => {
              void regenerate();
            }}
          >
            <RotateCcw aria-hidden="true" size={16} />
            Ponów odpowiedź
          </button>
        </div>
      ) : null}

      <form className="grid gap-3" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-bold">
          Wiadomość do asystenta
          <textarea
            className="min-h-24 rounded-[4px] border border-[var(--color-border-default)] bg-white px-4 py-3 text-[var(--color-bg-base)] outline-none focus:border-[var(--color-brand-primary)] disabled:opacity-60"
            disabled={isBusy}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </label>
        <button
          className="rounded-[9999px] bg-[var(--color-brand-primary)] px-8 py-3 text-base font-bold text-[var(--color-text-on-brand)] transition hover:bg-[var(--color-brand-primary-hover)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          disabled={isBusy || !input.trim()}
          type="submit"
        >
          Wyślij
        </button>
      </form>
    </section>
  );
}

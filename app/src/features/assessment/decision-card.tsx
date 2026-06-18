import { DECISION_LABELS } from "@/shared/decision-message";
import { type DecisionResult } from "@/shared/contracts";

const toneClass: Record<DecisionResult["decision"], string> = {
  APPROVE: "bg-[var(--color-brand-primary)] text-[var(--color-text-on-brand)]",
  REJECT: "bg-[var(--color-brand-error)] text-white",
  NEEDS_MORE_INFO: "bg-[var(--color-brand-warning)] text-black",
  CONDITIONAL: "bg-[var(--color-brand-warning)] text-black",
  ESCALATE: "bg-[var(--color-bg-elevated-highlight)] text-white",
};

export function DecisionCard({ decision }: { decision: DecisionResult }) {
  return (
    <article className="grid gap-5 rounded-[6px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-tinted)] p-5 shadow-[var(--shadow-card)]">
      <div className="grid gap-3">
        <p className="text-base text-[var(--color-text-primary)]">Dzień dobry.</p>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-[9999px] px-4 py-2 text-sm font-bold ${toneClass[decision.decision]}`}
            data-status-label="true"
          >
            {DECISION_LABELS[decision.decision]}
          </span>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {decision.summary}
          </p>
        </div>
      </div>

      <section className="grid gap-2">
        <h3 className="text-base font-bold">Uzasadnienie</h3>
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {decision.justification}
        </p>
      </section>

      {decision.missingInformation.length > 0 ? (
        <section className="grid gap-2">
          <h3 className="text-base font-bold">Brakujące informacje</h3>
          <ul className="grid gap-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {decision.missingInformation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {decision.conditions.length > 0 ? (
        <section className="grid gap-2">
          <h3 className="text-base font-bold">Warunki</h3>
          <ul className="grid gap-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {decision.conditions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-2">
        <h3 className="text-base font-bold">Kolejne kroki</h3>
        <ol className="grid gap-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {decision.nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <p className="rounded-[4px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {decision.disclaimer}
      </p>
    </article>
  );
}

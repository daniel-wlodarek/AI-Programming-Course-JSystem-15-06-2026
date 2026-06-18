import {
  DECISIONS,
  type ActiveSession,
  type AssessmentInput,
  type ImageAnalysis,
  REQUEST_TYPE_LABELS,
  type RequestType,
} from "@/shared/contracts";
import { MANDATORY_DISCLAIMER } from "@/shared/polish-copy";
import { type PolicyDocument } from "@/server/policies/policy-loader";

interface ImagePromptInput {
  requestType: RequestType;
  equipmentCategory: string;
  equipmentName: string;
}

export function buildImageAnalysisPrompt(input: ImagePromptInput): string {
  const base = [
    "Jesteś asystentem analizy zdjęć dla TechSerwis.",
    `Typ zgłoszenia: ${REQUEST_TYPE_LABELS[input.requestType]}.`,
    `Kategoria sprzętu: ${input.equipmentCategory}.`,
    `Model/nazwa: ${input.equipmentName}.`,
    "Odpowiadaj wyłącznie po polsku.",
    "Opisz dowody widoczne na zdjęciu i nie wydawaj decyzji końcowej.",
    "Zwróć obiekt zgodny ze schematem ImageAnalysis.",
  ];

  if (input.requestType === "RETURN") {
    return [
      ...base,
      "Zadanie dla zwrotu: oceń, czy sprzęt wygląda na możliwy do odsprzedaży jako nowy.",
      "Zwróć uwagę na ślady użycia, zabrudzenia, rysy, pęknięcia, kompletność opakowania i akcesoriów, personalizację oraz jakość zdjęcia.",
    ].join("\n");
  }

  return [
    ...base,
    "Zadanie dla reklamacji: oceń widoczne usterki, rodzaj uszkodzenia i prawdopodobną przyczynę.",
    "Wskaż, czy obraz sugeruje wada fabryczna, normalne zużycie, zalania lub uszkodzenia mechaniczne jako przyczynę, albo czy przyczyna jest niejasna.",
  ].join("\n");
}

export function buildDecisionPrompt({
  assessmentInput,
  imageAnalysis,
  policy,
  retry = false,
}: {
  assessmentInput: AssessmentInput;
  imageAnalysis: ImageAnalysis;
  policy: PolicyDocument;
  retry?: boolean;
}): string {
  return [
    "Jesteś copilotem decyzji serwisowych TechSerwis.",
    "Wydajesz wyłącznie wstępną, niewiążącą rekomendację po polsku.",
    `Dozwolone decyzje: ${DECISIONS.join(", ")}.`,
    `Obowiązkowy disclaimer: ${MANDATORY_DISCLAIMER}`,
    retry
      ? "Poprzednia odpowiedź nie spełniła schematu. Zwróć poprawny obiekt bez dodatkowego tekstu."
      : "Zwróć jeden poprawny obiekt zgodny ze schematem DecisionResult.",
    "Nie wymyślaj reguł poza przekazaną polityką.",
    "Jeżeli brakuje danych lub zdjęcie jest niewystarczające, wybierz NEEDS_MORE_INFO.",
    `Użyta polityka: ${policy.path}`,
    "<POLITYKA>",
    policy.text,
    "</POLITYKA>",
    "<DANE_ZGLOSZENIA>",
    JSON.stringify(assessmentInput, null, 2),
    "</DANE_ZGLOSZENIA>",
    "<ANALIZA_ZDJECIA>",
    JSON.stringify(imageAnalysis, null, 2),
    "</ANALIZA_ZDJECIA>",
  ].join("\n");
}

export function buildChatPrompt({
  activeSession,
  policy,
  latestUserMessage,
}: {
  activeSession: ActiveSession;
  policy: PolicyDocument;
  latestUserMessage: string;
}): string {
  return [
    "Jesteś polskim asystentem TechSerwis dla aktywnej sprawy zwrotu lub reklamacji.",
    "Odpowiadaj tylko w kontekście tej sprawy i bez zdjęcia; nie proś o przesłanie obrazu w czacie.",
    "Jeżeli użytkownik pyta o zadanie niezwiązane ze sprawą, uprzejmie odmów i wróć do sprawy zwrotu lub reklamacji.",
    "Jeżeli nowe informacje zmieniają rekomendację, napisz jasno, że rekomendacja została zaktualizowana, wyjaśnij dlaczego i dodaj disclaimer.",
    `Obowiązkowy disclaimer przy rekomendacjach: ${MANDATORY_DISCLAIMER}`,
    `Użyta polityka: ${policy.path}`,
    "<POLITYKA>",
    policy.text,
    "</POLITYKA>",
    "<AKTYWNA_SESJA>",
    JSON.stringify(activeSession, null, 2),
    "</AKTYWNA_SESJA>",
    "<OSTATNIA_WIADOMOSC_UZYTKOWNIKA>",
    latestUserMessage,
    "</OSTATNIA_WIADOMOSC_UZYTKOWNIKA>",
  ].join("\n");
}

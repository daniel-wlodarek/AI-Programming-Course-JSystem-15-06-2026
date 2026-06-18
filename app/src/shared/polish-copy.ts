export const MANDATORY_DISCLAIMER =
  "To wstępna, niewiążąca ocena. Ostateczną decyzję podejmuje zespół serwisu.";

export const validationCopy = {
  invalidRequestType: "Wybierz Reklamację albo Zwrot.",
  missingCategory: "Wybierz kategorię sprzętu z listy.",
  missingEquipmentName: "Podaj nazwę lub model sprzętu.",
  missingPurchaseDate: "Podaj datę zakupu.",
  invalidPurchaseDate: "Podaj poprawną datę zakupu.",
  futurePurchaseDate: "Data zakupu nie może być z przyszłości.",
  missingComplaintReason: "Opisz usterkę, aby zgłosić reklamację.",
  missingImage: "Dodaj jedno zdjęcie sprzętu.",
  unsupportedImageType: "Akceptujemy tylko pliki JPEG, PNG albo WebP.",
  oversizedImage: "Zdjęcie może mieć maksymalnie 10 MB.",
  multipleImages: "Dodaj tylko jedno zdjęcie sprzętu.",
  missingChatSession:
    "Brakuje kontekstu zgłoszenia. Rozpocznij zgłoszenie ponownie.",
  missingImageAnalysis:
    "Brakuje kontekstu analizy zdjęcia. Rozpocznij zgłoszenie ponownie.",
  missingChatMessage: "Wpisz wiadomość przed wysłaniem.",
  invalidInitialDecision:
    "Nie można odczytać wstępnej decyzji. Rozpocznij zgłoszenie ponownie.",
  chatImagesNotAccepted:
    "Czat przyjmuje tylko tekst. Nie przesyłaj zdjęć po rozpoczęciu rozmowy.",
  aiConfigurationMissing:
    "Brakuje konfiguracji usługi AI. Uzupełnij zmienne OpenRouter.",
} as const;

export const serviceCopy = {
  assessmentUnavailable:
    "Nie udało się przygotować oceny. Spróbuj ponownie za chwilę.",
  chatUnavailable:
    "Nie udało się wysłać odpowiedzi. Spróbuj ponownie za chwilę.",
} as const;

import { expect, test } from "@playwright/test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "../fixtures");
const cleanImage = join(fixturesDir, "clean-product.png");
const damagedImage = join(fixturesDir, "damaged-product.png");
const invalidFile = join(fixturesDir, "invalid-file.txt");

const requiredEnv = [
  "OPENROUTER_API_KEY",
  "OPENROUTER_CHAT_MODEL",
  "OPENROUTER_VISION_MODEL",
] as const;

const responseKeywords = [
  "decyzja",
  "ocena",
  "wstępna",
  "niewiążąca",
  "serwis",
  "zwrot",
  "reklamacja",
  "usterka",
  "naprawa",
  "wymiana",
  "odrzuc",
  "nie kwalifikuje",
  "uszkodzenie",
  "mechaniczne",
  "warunk",
  "diagnoz",
  "pomniejszenie",
];

test.beforeAll(() => {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      [
        `Brakuje zmiennych środowiskowych wymaganych do realnych E2E: ${missing.join(", ")}.`,
        "Ustaw je w `app/.env` albo w powłoce przed uruchomieniem `npm run e2e`; testy E2E nie mockują OpenRouter.",
        "Wymagane: OPENROUTER_API_KEY, OPENROUTER_CHAT_MODEL, OPENROUTER_VISION_MODEL.",
      ].join(" "),
    );
  }
});

async function fillBaseForm(
  page: import("@playwright/test").Page,
  options: {
    type: "Zwrot" | "Reklamacja";
    category?: string;
    model?: string;
    date?: string;
    reason?: string;
    image?: string;
  },
) {
  await page.goto("/");
  await page.getByRole("button", { name: options.type, exact: true }).click();
  await page
    .getByLabel("Kategoria sprzętu")
    .selectOption(options.category ?? "Laptop");
  await page
    .getByLabel("Nazwa lub model sprzętu")
    .fill(options.model ?? "ThinkPad X1");
  await page.getByLabel("Data zakupu").fill(options.date ?? "2026-06-01");
  if (options.reason) {
    await page.getByLabel("Opis usterki lub powód").fill(options.reason);
  }
  if (options.image) {
    await page.getByLabel("Zdjęcie sprzętu").setInputFiles(options.image);
  }
}

async function submitAndExpectDecision(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Przygotuj ocenę" }).click();
  await expect(
    page.getByText("Analizujemy zdjęcie i przygotowujemy ocenę..."),
  ).toBeVisible();
  await expect(
    page.getByText(
      /Prawdopodobnie kwalifikuje się|Prawdopodobnie nie kwalifikuje się|Potrzebne dodatkowe informacje|Warunkowo możliwe|Wymaga konsultacji/,
    ),
  ).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText(/wstępna/i)).toBeVisible();
  await expect(page.getByText(/niewiążąca/i)).toBeVisible();
}

async function sendFollowUp(page: import("@playwright/test").Page, text: string) {
  await page.getByLabel("Wiadomość do asystenta").fill(text);
  await page.getByRole("button", { name: "Wyślij" }).click();
  const assistant = page.locator('[data-chat-role="assistant"]').last();
  await expect(assistant).toBeVisible({ timeout: 120_000 });
  const response = (await assistant.textContent()) ?? "";
  expect(response.trim().length).toBeGreaterThanOrEqual(50);
  expect(response.toLowerCase()).toMatch(new RegExp(responseKeywords.join("|"), "i"));
}

test.describe("Hardware Service Decision Copilot E2E", () => {
  test("E2E-01: valid return reaches chat and shows decision card", async ({
    page,
  }) => {
    await fillBaseForm(page, {
      type: "Zwrot",
      image: cleanImage,
    });

    await submitAndExpectDecision(page);
    await expect(page.getByRole("region", { name: "Czat z asystentem" })).toBeVisible();
  });

  test("E2E-02: valid complaint reaches chat and shows AI decision response", async ({
    page,
  }) => {
    await fillBaseForm(page, {
      type: "Reklamacja",
      category: "Smartfon",
      model: "Pixel 9",
      reason: "Ekran pękł po krótkim użyciu, proszę o ocenę reklamacji.",
      image: damagedImage,
    });

    await submitAndExpectDecision(page);
    await expect(page.getByText(/Uzasadnienie/)).toBeVisible();
  });

  test("E2E-03: complaint without reason is blocked before submit", async ({
    page,
  }) => {
    await fillBaseForm(page, {
      type: "Reklamacja",
      image: damagedImage,
    });

    await page.getByRole("button", { name: "Przygotuj ocenę" }).click();

    await expect(
      page.getByText("Opisz usterkę, aby zgłosić reklamację."),
    ).toBeVisible();
    await expect(page.getByText("Analizujemy zdjęcie i przygotowujemy ocenę...")).toBeHidden();
  });

  test("E2E-04: unsupported file type shows accepted format error", async ({
    page,
  }) => {
    await fillBaseForm(page, {
      type: "Zwrot",
      image: invalidFile,
    });

    await expect(
      page.getByText("Akceptujemy tylko pliki JPEG, PNG albo WebP."),
    ).toBeVisible();
  });

  test("E2E-05: chat response is visible and long enough after follow-up", async ({
    page,
  }) => {
    await fillBaseForm(page, {
      type: "Zwrot",
      image: cleanImage,
    });
    await submitAndExpectDecision(page);

    await sendFollowUp(page, "Czy muszę odesłać oryginalne pudełko i kable?");
  });

  test("E2E-06: off-topic message gets a case-scoped assistant response", async ({
    page,
  }) => {
    await fillBaseForm(page, {
      type: "Zwrot",
      image: cleanImage,
    });
    await submitAndExpectDecision(page);

    await sendFollowUp(page, "Napisz mi plan treningowy na siłownię.");
  });

  test("E2E-07: new request clears session and returns to empty form", async ({
    page,
  }) => {
    await fillBaseForm(page, {
      type: "Zwrot",
      image: cleanImage,
    });
    await submitAndExpectDecision(page);

    await page.getByRole("button", { name: "Rozpocznij nowe zgłoszenie" }).click();

    await expect(page.getByLabel("Nazwa lub model sprzętu")).toHaveValue("");
    await expect(page.getByRole("button", { name: "Zwrot" })).toBeVisible();
    await expect(page.getByLabel("Wiadomość do asystenta")).toBeHidden();
  });
});

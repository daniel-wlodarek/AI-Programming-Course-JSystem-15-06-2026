import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IntakeForm } from "./intake-form";

const today = new Date("2026-06-18T12:00:00.000Z");

function imageFile(name = "sprzet.jpg", type = "image/jpeg", size = 4) {
  return new File([new Uint8Array(size)], name, { type });
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Zwrot" }));
  await user.selectOptions(
    screen.getByLabelText("Kategoria sprzętu"),
    "Laptop",
  );
  await user.type(screen.getByLabelText("Nazwa lub model sprzętu"), "ThinkPad X1");
  await user.type(screen.getByLabelText("Data zakupu"), "2026-06-01");
  await user.upload(screen.getByLabelText("Zdjęcie sprzętu"), imageFile());
}

describe("IntakeForm", () => {
  it("renders exact request type options and PRD categories", () => {
    render(<IntakeForm onSubmit={vi.fn()} today={today} />);

    expect(screen.getByRole("button", { name: "Reklamacja" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Zwrot" })).toBeVisible();

    const categorySelect = screen.getByLabelText("Kategoria sprzętu");
    const optionNames = within(categorySelect)
      .getAllByRole("option")
      .map((option) => option.textContent);

    expect(optionNames).toEqual([
      "Wybierz kategorię",
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

  it("requires a reason for complaints", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<IntakeForm onSubmit={onSubmit} today={today} />);

    await user.click(screen.getByRole("button", { name: "Reklamacja" }));
    await user.selectOptions(
      screen.getByLabelText("Kategoria sprzętu"),
      "Laptop",
    );
    await user.type(
      screen.getByLabelText("Nazwa lub model sprzętu"),
      "ThinkPad X1",
    );
    await user.type(screen.getByLabelText("Data zakupu"), "2026-06-01");
    await user.upload(screen.getByLabelText("Zdjęcie sprzętu"), imageFile());
    await user.click(screen.getByRole("button", { name: "Przygotuj ocenę" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText("Opisz usterkę, aby zgłosić reklamację."),
    ).toBeVisible();
  });

  it("submits a valid return without a reason", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<IntakeForm onSubmit={onSubmit} today={today} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Przygotuj ocenę" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          requestType: "RETURN",
          equipmentCategory: "Laptop",
          equipmentName: "ThinkPad X1",
          purchaseDate: "2026-06-01",
          reason: "",
        }),
        image: expect.any(File),
      }),
    );
  });

  it("blocks future purchase dates", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<IntakeForm onSubmit={onSubmit} today={today} />);

    await fillRequiredFields(user);
    await user.clear(screen.getByLabelText("Data zakupu"));
    await user.type(screen.getByLabelText("Data zakupu"), "2026-06-19");
    await user.click(screen.getByRole("button", { name: "Przygotuj ocenę" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Data zakupu nie może być z przyszłości.")).toBeVisible();
  });

  it("rejects unsupported image formats and images larger than 10 MB", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<IntakeForm onSubmit={vi.fn()} today={today} />);

    await user.upload(
      screen.getByLabelText("Zdjęcie sprzętu"),
      imageFile("instrukcja.pdf", "application/pdf"),
    );
    expect(
      screen.getByText("Akceptujemy tylko pliki JPEG, PNG albo WebP."),
    ).toBeVisible();

    await user.upload(
      screen.getByLabelText("Zdjęcie sprzętu"),
      imageFile("duze.png", "image/png", 10 * 1024 * 1024 + 1),
    );
    expect(screen.getByText("Zdjęcie może mieć maksymalnie 10 MB.")).toBeVisible();
  });

  it("keeps exactly one image by replacing the previous selection", async () => {
    const user = userEvent.setup();
    render(<IntakeForm onSubmit={vi.fn()} today={today} />);

    await user.upload(screen.getByLabelText("Zdjęcie sprzętu"), imageFile("pierwsze.jpg"));
    expect(screen.getByText("pierwsze.jpg")).toBeVisible();

    await user.upload(screen.getByLabelText("Zdjęcie sprzętu"), imageFile("drugie.webp", "image/webp"));
    expect(screen.getByText("drugie.webp")).toBeVisible();
    expect(screen.queryByText("pierwsze.jpg")).not.toBeInTheDocument();
  });
});

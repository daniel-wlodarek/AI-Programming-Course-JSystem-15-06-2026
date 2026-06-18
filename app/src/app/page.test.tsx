import { render, screen } from "@testing-library/react";
import Page from "./page";

describe("Page", () => {
  it("renders the Polish application shell", () => {
    render(<Page />);

    expect(
      screen.getByRole("heading", { name: "Asystent decyzji serwisowej" }),
    ).toBeInTheDocument();
  });
});

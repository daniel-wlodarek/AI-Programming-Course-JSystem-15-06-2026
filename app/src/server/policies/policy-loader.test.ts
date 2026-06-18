import { loadPolicy } from "./policy-loader";

describe("policy loader", () => {
  it("loads only the return policy for return requests", async () => {
    const policy = await loadPolicy("RETURN");

    expect(policy.path).toBe("docs/policies/polityka-zwrotow.md");
    expect(policy.text).toContain("14 dni");
    expect(policy.text).toContain("ZWROT");
    expect(policy.text).not.toContain("Polityka Reklamacji");
  });

  it("loads only the complaint policy for complaint requests", async () => {
    const policy = await loadPolicy("COMPLAINT");

    expect(policy.path).toBe("docs/policies/polityka-reklamacji.md");
    expect(policy.text).toContain("2 lat");
    expect(policy.text).toContain("REKLAMACJA");
    expect(policy.text).not.toContain("Polityka Zwrotów");
  });
});

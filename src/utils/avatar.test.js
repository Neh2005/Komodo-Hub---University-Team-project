import { describe, it, expect } from "vitest";
import { getGravatarUrl } from "./avatar";

describe("getGravatarUrl", () => {
  it("returns null when no email is given", () => {
    expect(getGravatarUrl(undefined)).toBeNull();
    expect(getGravatarUrl(null)).toBeNull();
    expect(getGravatarUrl("")).toBeNull();
  });

  it("hashes the trimmed, lowercased email", () => {
    const url = getGravatarUrl("  Test@Example.com  ");
    expect(url).toBe("https://www.gravatar.com/avatar/55502f40dc8b7c769880b10874abc9d0?s=200&d=identicon");
  });

  it("treats case and surrounding whitespace as equivalent (same person, same avatar)", () => {
    expect(getGravatarUrl("test@example.com")).toBe(getGravatarUrl("  Test@Example.com  "));
  });

  it("respects a custom size", () => {
    const url = getGravatarUrl("test@example.com", 64);
    expect(url).toContain("s=64");
  });

  it("always falls back to an identicon instead of a broken image", () => {
    const url = getGravatarUrl("nobody-has-this-address@nowhere.invalid");
    expect(url).toContain("d=identicon");
  });
});

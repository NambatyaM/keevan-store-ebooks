import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins multiple truthy class names", () => {
    expect(cn("foo", "bar", "baz")).toBe("foo bar baz");
  });

  it("filters out false values", () => {
    expect(cn("foo", false, "bar", null, "baz", undefined)).toBe("foo bar baz");
  });

  it("returns empty string when no truthy values", () => {
    expect(cn(false, null, undefined)).toBe("");
  });

  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("handles single class", () => {
    expect(cn("single")).toBe("single");
  });

  it("handles all falsey values", () => {
    expect(cn(false, null, undefined)).toBe("");
  });

  it("filters empty string (falsy)", () => {
    expect(cn("", "foo")).toBe("foo");
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreatorBanner } from "@/components/creator-banner";

function ok<T>(data: T, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  };
}

const STORAGE_KEY = "ks-creator-promo-banner-dismissed";

describe("CreatorBanner", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the banner content and CTAs when show is true", () => {
    render(<CreatorBanner show />);
    expect(screen.getByText("Bring buyers to your store")).toBeTruthy();
    expect(screen.getByText(/share your store link/i)).toBeTruthy();
    expect(screen.getByText("Get your sales plan").getAttribute("href")).toBe("/creator/first-sale");
    expect(screen.getByText("My store & link").getAttribute("href")).toBe("/creator/settings?tab=store");
  });

  it("does not render when show is false", () => {
    render(<CreatorBanner show={false} />);
    expect(screen.queryByText("Bring buyers to your store")).toBeNull();
  });

  it("dismisses and persists the choice", async () => {
    const user = userEvent.setup();
    render(<CreatorBanner show />);
    await user.click(screen.getByRole("button", { name: /dismiss banner/i }));
    expect(screen.queryByText("Bring buyers to your store")).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("1");
  });

  it("only shows for creators when no show prop is given", async () => {
    global.fetch = vi.fn().mockResolvedValue(ok({ profile: { role: "creator" } }));
    render(<CreatorBanner />);
    expect(await screen.findByText("Bring buyers to your store")).toBeTruthy();
  });

  it("stays hidden for non-creator roles", async () => {
    global.fetch = vi.fn().mockResolvedValue(ok({ profile: { role: "buyer" } }));
    render(<CreatorBanner />);
    await vi.waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByText("Bring buyers to your store")).toBeNull();
  });

  it("does not re-show after being dismissed", () => {
    localStorage.setItem(STORAGE_KEY, "1");
    render(<CreatorBanner show />);
    expect(screen.queryByText("Bring buyers to your store")).toBeNull();
  });
});

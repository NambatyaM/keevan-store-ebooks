// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

describe("app/error.tsx", () => {
  it("renders 500 error page with try again and navigation links", async () => {
    const ErrorPage = (await import("@/app/error")).default;
    const reset = vi.fn();
    const error = new Error("Test error");
    render(<ErrorPage error={error} reset={reset} />);

    expect(screen.getByText("500")).toBeDefined();
    expect(screen.getByText("Something went wrong")).toBeDefined();
    expect(screen.getByText("Try again")).toBeDefined();
    expect(screen.getByText("Go home")).toBeDefined();
    expect(screen.getByText("Contact support")).toBeDefined();
  });
});

describe("app/admin/error.tsx", () => {
  it("renders admin error page with try again and dashboard link", async () => {
    const AdminError = (await import("@/app/admin/error")).default;
    const reset = vi.fn();
    const error = new Error("Admin error");
    render(<AdminError error={error} reset={reset} />);

    expect(screen.getByText("Something went wrong")).toBeDefined();
    expect(screen.getByText("Try again")).toBeDefined();
    expect(screen.getByText("Go to Dashboard")).toBeDefined();
  });
});

describe("app/creator/error.tsx", () => {
  it("renders creator error page with try again and dashboard link", async () => {
    const CreatorError = (await import("@/app/creator/error")).default;
    const reset = vi.fn();
    const error = new Error("Creator error");
    render(<CreatorError error={error} reset={reset} />);

    expect(screen.getByText("Something went wrong")).toBeDefined();
    expect(screen.getByText("Try again")).toBeDefined();
    expect(screen.getByText("Go to Dashboard")).toBeDefined();
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutForm } from "@/components/checkout-form";
import { BuyNowModal } from "@/components/buy-now-modal";

function ok<T>(data: T, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  };
}

const productId = "prod-123";
const price = 50000;
const currency = "UGX";
const title = "Test E-Book";

// ---------------------------------------------------------------------------
// CheckoutForm
// ---------------------------------------------------------------------------
describe("CheckoutForm", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/auth/me")
        return Promise.resolve(ok({ profile: { role: "guest" } }));
      if (url.startsWith("/api/discounts/active"))
        return Promise.resolve(ok({ discount: null }));
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------
  it("renders all form fields (name, email, phone, submit button)", () => {
    render(<CheckoutForm productId={productId} />);

    expect(screen.getByLabelText(/full name/i)).toBeDefined();
    expect(screen.getByLabelText(/email for receipt/i)).toBeDefined();
    expect(screen.getByLabelText(/phone number/i)).toBeDefined();
    expect(
      screen.getByRole("button", { name: /pay with pesapal/i }),
    ).toBeDefined();
  });

  it("renders product summary when title and price are provided", async () => {
    render(
      <CheckoutForm
        productId={productId}
        price={price}
        currency={currency}
        title={title}
      />,
    );

    expect(screen.getByText(title)).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText(/UGX\s*50,?000/)).toBeDefined();
    });
  });

  it("does not render product summary when title and price are omitted", () => {
    render(<CheckoutForm productId={productId} />);

    expect(screen.queryByText(title)).toBeNull();
    expect(screen.queryByText(/UGX/)).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Discount display
  // -----------------------------------------------------------------------
  describe("discount display", () => {
    it("shows discounted price with badge when discountPercent is set", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === "/api/auth/me")
          return Promise.resolve(ok({ profile: { role: "guest" } }));
        if (url.startsWith("/api/discounts/active"))
          return Promise.resolve(ok({ discount: { discount_percent: 10 } }));
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      });

      render(
        <CheckoutForm
          productId={productId}
          price={price}
          currency={currency}
          title={title}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/UGX\s*45,?000/)).toBeDefined();
      });
      expect(screen.getByText(/UGX\s*50,?000/)).toBeDefined();
      expect(screen.getByText("-10%")).toBeDefined();
      expect(screen.getByText(/10%\s*discount applied/i)).toBeDefined();
    });

    it("shows normal price when no discount is available", async () => {
      render(
        <CheckoutForm
          productId={productId}
          price={price}
          currency={currency}
          title={title}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/UGX\s*50,?000/)).toBeDefined();
      });
      expect(screen.queryByText(/-%\s*\d+%/)).toBeNull();
      expect(screen.queryByText(/discount applied/i)).toBeNull();
    });

    it("shows discount applied banner separately", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === "/api/auth/me")
          return Promise.resolve(ok({ profile: { role: "guest" } }));
        if (url.startsWith("/api/discounts/active"))
          return Promise.resolve(ok({ discount: { discount_percent: 25 } }));
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      });

      render(
        <CheckoutForm
          productId={productId}
          price={price}
          currency={currency}
          title={title}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/25%\s*discount applied/i)).toBeDefined();
      });
    });
  });

  // -----------------------------------------------------------------------
  // Auth pre-fill
  // -----------------------------------------------------------------------
  it("pre-fills fields when authenticated buyer profile is returned", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/auth/me")
        return Promise.resolve(
          ok({
            profile: {
              role: "buyer",
              full_name: "Jane Doe",
              email: "jane@test.com",
              phone: "+256712345678",
            },
          }),
        );
      if (url.startsWith("/api/discounts/active"))
        return Promise.resolve(ok({ discount: null }));
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    render(<CheckoutForm productId={productId} />);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;
      expect(nameInput.value).toBe("Jane Doe");
      const emailInput = screen.getByLabelText(
        /email for receipt/i,
      ) as HTMLInputElement;
      expect(emailInput.value).toBe("jane@test.com");
      const phoneInput = screen.getByLabelText(
        /phone number/i,
      ) as HTMLInputElement;
      expect(phoneInput.value).toBe("+256712345678");
    });
  });

  // -----------------------------------------------------------------------
  // Phone validation
  // -----------------------------------------------------------------------
  describe("phone validation", () => {
    it("shows error when phone is empty and form is submitted", async () => {
      const user = userEvent.setup();
      render(<CheckoutForm productId={productId} currency={currency} />);

      await user.click(
        screen.getByRole("button", { name: /pay with pesapal/i }),
      );

      await waitFor(() => {
        expect(screen.getByText(/phone number is required/i)).toBeDefined();
      });
    });

    it("validates phone using UGX regex by default", async () => {
      const user = userEvent.setup();
      render(<CheckoutForm productId={productId} />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, "071234567");
      await user.click(
        screen.getByRole("button", { name: /pay with pesapal/i }),
      );

      await waitFor(() => {
        expect(
          screen.getByText(/enter a valid phone number/i),
        ).toBeDefined();
      });
    });

    it("accepts valid UGX phone number and calls payment API", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === "/api/auth/me")
          return Promise.resolve(ok({ profile: { role: "guest" } }));
        if (url.startsWith("/api/discounts/active"))
          return Promise.resolve(ok({ discount: null }));
        if (url === "/api/payments/create")
          return Promise.resolve(ok({ redirectUrl: "https://pay.pesapal.com/x" }));
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      });

      const user = userEvent.setup();
      render(
        <CheckoutForm
          productId={productId}
          currency="UGX"
          price={price}
        />,
      );

      await user.type(screen.getByLabelText(/full name/i), "Test User");
      await user.type(
        screen.getByLabelText(/email for receipt/i),
        "test@test.com",
      );
      await user.type(screen.getByLabelText(/phone number/i), "0772123456");
      await user.click(
        screen.getByRole("button", { name: /pay with pesapal/i }),
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/payments/create",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining("0772123456"),
          }),
        );
      });
    });

    it("validates phone per currency — KES rejects invalid format", async () => {
      const user = userEvent.setup();
      render(<CheckoutForm productId={productId} currency="KES" />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, "+15551234567");
      await user.click(
        screen.getByRole("button", { name: /pay with pesapal/i }),
      );

      await waitFor(() => {
        expect(
          screen.getByText(/enter a valid phone number/i),
        ).toBeDefined();
      });
    });

    it("accepts valid KES phone number", async () => {
      let resolvePayment!: (value: unknown) => void;
      const paymentPromise = new Promise((resolve) => {
        resolvePayment = resolve;
      });

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === "/api/auth/me")
          return Promise.resolve(ok({ profile: { role: "guest" } }));
        if (url.startsWith("/api/discounts/active"))
          return Promise.resolve(ok({ discount: null }));
        if (url === "/api/payments/create") return paymentPromise;
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      });

      const user = userEvent.setup();
      render(<CheckoutForm productId={productId} currency="KES" />);

      await user.type(
        screen.getByLabelText(/phone number/i),
        "+254712345678",
      );
      await user.click(
        screen.getByRole("button", { name: /pay with pesapal/i }),
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/payments/create",
          expect.any(Object),
        );
      });

      resolvePayment(ok({ redirectUrl: "https://pay.example.com" }));
    });

    it("clears phone validation error when user starts typing", async () => {
      const user = userEvent.setup();
      render(<CheckoutForm productId={productId} currency="UGX" />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, "invalid");
      await user.click(
        screen.getByRole("button", { name: /pay with pesapal/i }),
      );

      await waitFor(() => {
        expect(
          screen.getByText(/enter a valid phone number/i),
        ).toBeDefined();
      });

      await user.type(phoneInput, "0");

      await waitFor(() => {
        expect(
          screen.queryByText(/enter a valid phone number/i),
        ).toBeNull();
      });
    });
  });

  // -----------------------------------------------------------------------
  // Submit button states
  // -----------------------------------------------------------------------
  it("disables submit button and shows loading text while submitting", async () => {
    let resolvePayment!: (value: unknown) => void;
    const paymentPromise = new Promise((resolve) => {
      resolvePayment = resolve;
    });

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/auth/me")
        return Promise.resolve(ok({ profile: { role: "guest" } }));
      if (url.startsWith("/api/discounts/active"))
        return Promise.resolve(ok({ discount: null }));
      if (url === "/api/payments/create") return paymentPromise;
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const user = userEvent.setup();
    render(<CheckoutForm productId={productId} currency="UGX" />);

    await user.type(screen.getByLabelText(/phone number/i), "0772123456");
    await user.click(
      screen.getByRole("button", { name: /pay with pesapal/i }),
    );

    await waitFor(() => {
      const btn = screen.getByRole("button", {
        name: /redirecting to pesapal/i,
      }) as HTMLButtonElement;
      expect(btn).toBeDefined();
      expect(btn.disabled).toBe(true);
    });

    resolvePayment(ok({ redirectUrl: "https://pay.example.com" }));
  });

  // -----------------------------------------------------------------------
  // Error display
  // -----------------------------------------------------------------------
  describe("error display", () => {
    it("shows error message when payment API returns an error", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === "/api/auth/me")
          return Promise.resolve(ok({ profile: { role: "guest" } }));
        if (url.startsWith("/api/discounts/active"))
          return Promise.resolve(ok({ discount: null }));
        if (url === "/api/payments/create")
          return Promise.resolve(
            ok({ error: { message: "Payment failed" } }, 500),
          );
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      });

      const user = userEvent.setup();
      render(<CheckoutForm productId={productId} currency="UGX" />);

      await user.type(screen.getByLabelText(/phone number/i), "0772123456");
      await user.click(
        screen.getByRole("button", { name: /pay with pesapal/i }),
      );

      await waitFor(() => {
        expect(screen.getByText(/payment failed/i)).toBeDefined();
      });
    });

    it("shows duplicate order error on 409 response", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === "/api/auth/me")
          return Promise.resolve(ok({ profile: { role: "guest" } }));
        if (url.startsWith("/api/discounts/active"))
          return Promise.resolve(ok({ discount: null }));
        if (url === "/api/payments/create")
          return Promise.resolve(
            ok({ error: { message: "Pending order exists" } }, 409),
          );
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      });

      const user = userEvent.setup();
      render(<CheckoutForm productId={productId} currency="UGX" />);

      await user.type(screen.getByLabelText(/phone number/i), "0772123456");
      await user.click(
        screen.getByRole("button", { name: /pay with pesapal/i }),
      );

      await waitFor(() => {
        expect(screen.getByText(/pending order/i)).toBeDefined();
      });
    });

    it("shows default duplicate message on 409 with no error message", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === "/api/auth/me")
          return Promise.resolve(ok({ profile: { role: "guest" } }));
        if (url.startsWith("/api/discounts/active"))
          return Promise.resolve(ok({ discount: null }));
        if (url === "/api/payments/create")
          return Promise.resolve(ok({}, 409));
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      });

      const user = userEvent.setup();
      render(<CheckoutForm productId={productId} currency="UGX" />);

      await user.type(screen.getByLabelText(/phone number/i), "0772123456");
      await user.click(
        screen.getByRole("button", { name: /pay with pesapal/i }),
      );

      await waitFor(() => {
        expect(
          screen.getByText(/already have a pending order/i),
        ).toBeDefined();
      });
    });

    it("shows error when API response lacks a redirectUrl", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === "/api/auth/me")
          return Promise.resolve(ok({ profile: { role: "guest" } }));
        if (url.startsWith("/api/discounts/active"))
          return Promise.resolve(ok({ discount: null }));
        if (url === "/api/payments/create")
          return Promise.resolve(ok({}));
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      });

      const user = userEvent.setup();
      render(<CheckoutForm productId={productId} currency="UGX" />);

      await user.type(screen.getByLabelText(/phone number/i), "0772123456");
      await user.click(
        screen.getByRole("button", { name: /pay with pesapal/i }),
      );

      await waitFor(() => {
        expect(
          screen.getByText(/pesapal did not return a redirect url/i),
        ).toBeDefined();
      });
    });

    it("shows network error when fetch throws", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === "/api/auth/me")
          return Promise.resolve(ok({ profile: { role: "guest" } }));
        if (url.startsWith("/api/discounts/active"))
          return Promise.resolve(ok({ discount: null }));
        if (url === "/api/payments/create")
          return Promise.reject(new Error("Network error"));
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      });

      const user = userEvent.setup();
      render(<CheckoutForm productId={productId} currency="UGX" />);

      await user.type(screen.getByLabelText(/phone number/i), "0772123456");
      await user.click(
        screen.getByRole("button", { name: /pay with pesapal/i }),
      );

      await waitFor(() => {
        expect(
          screen.getByText(/unable to reach the checkout service/i),
        ).toBeDefined();
      });
    });

    it("shows error only when not a duplicate error", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === "/api/auth/me")
          return Promise.resolve(ok({ profile: { role: "guest" } }));
        if (url.startsWith("/api/discounts/active"))
          return Promise.resolve(ok({ discount: null }));
        if (url === "/api/payments/create")
          return Promise.resolve(
            ok({ error: { message: "Server error" } }, 500),
          );
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      });

      const user = userEvent.setup();
      render(<CheckoutForm productId={productId} currency="UGX" />);

      await user.type(screen.getByLabelText(/phone number/i), "0772123456");
      await user.click(
        screen.getByRole("button", { name: /pay with pesapal/i }),
      );

      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeDefined();
        expect(
          screen.queryByText(/already have a pending order/i),
        ).toBeNull();
      });
    });
  });
});

// ---------------------------------------------------------------------------
// BuyNowModal
// ---------------------------------------------------------------------------
describe("BuyNowModal", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/auth/me")
        return Promise.resolve(ok({ profile: null }));
      if (url.startsWith("/api/discounts/active"))
        return Promise.resolve(ok({ discount: null }));
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens and shows loading skeleton while discount is being fetched", async () => {
    let resolveDiscount!: (value: unknown) => void;
    const discountPromise = new Promise((resolve) => {
      resolveDiscount = resolve;
    });

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/auth/me")
        return Promise.resolve(ok({ profile: null }));
      if (url.startsWith("/api/discounts/active"))
        return discountPromise;
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    render(
      <BuyNowModal
        productId={productId}
        productSlug="test-ebook"
        price={price}
        currency={currency}
        title={title}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /buy now/i }));

    expect(screen.getByText(/checking for discounts/i)).toBeDefined();

    resolveDiscount(ok({ discount: null }));

    await waitFor(() => {
      expect(screen.queryByText(/checking for discounts/i)).toBeNull();
    });
  });

  it("shows login prompt for unauthenticated users", async () => {
    render(
      <BuyNowModal
        productId={productId}
        productSlug="test-ebook"
        price={price}
        currency={currency}
        title={title}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /buy now/i }));

    expect(
      screen.getByText(/already have an account/i),
    ).toBeDefined();
    expect(screen.getByRole("link", { name: /sign in/i })).toBeDefined();
  });

  it("renders product summary with title and price", async () => {
    render(
      <BuyNowModal
        productId={productId}
        productSlug="test-ebook"
        price={price}
        currency={currency}
        title={title}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /buy now/i }));

    expect(screen.getByText(title)).toBeDefined();
    await waitFor(() => {
      expect(screen.getAllByText(/UGX\s*50,?000/).length).toBeGreaterThanOrEqual(1);
    });
  });
});

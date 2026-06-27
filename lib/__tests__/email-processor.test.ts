import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderAndSend } from "@/lib/email-processor";

function createChain() {
  const eq = vi.fn(() => chain);
  const chain = {
    select: vi.fn(() => chain),
    eq,
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
  };
  return chain;
}

const tables: Record<string, ReturnType<typeof createChain>> = {};

const mockSupabase = {
  from: vi.fn((table: string) => {
    if (!tables[table]) tables[table] = createChain();
    return tables[table];
  }),
};

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(() => mockSupabase),
  getOptionalSupabaseAdminClient: vi.fn(() => mockSupabase),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
}));

import { sendEmail } from "@/lib/email";

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(tables).forEach((k) => delete tables[k]);
  tables["orders"] = createChain();
  tables["downloads"] = createChain();
  tables["withdrawal_requests"] = createChain();
  tables["refunds"] = createChain();
  vi.mocked(sendEmail).mockResolvedValue({ ok: true, id: "msg_1" });
});

describe("renderAndSend", () => {
  it("returns error for unknown email type", async () => {
    const result = await renderAndSend({
      id: "1",
      type: "unknown_type",
      to_email: "test@example.com",
      to_name: "Test",
      reference_type: "orders",
      reference_id: "abc-123",
      metadata: {},
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Unknown email type");
    }
  });

  it("returns error when order not found", async () => {
    const result = await renderAndSend({
      id: "1",
      type: "order_confirmation",
      to_email: "buyer@example.com",
      to_name: "Buyer",
      reference_type: "orders",
      reference_id: "missing-order",
      metadata: {},
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Order not found");
    }
  });

  it("returns error when download token not found for order", async () => {
    tables["orders"].single = vi.fn().mockResolvedValue({
      data: { id: "order-1", amount: 25000, products: { title: "Ebook" }, creators: { display_name: "Jane" } },
      error: null,
    });

    const result = await renderAndSend({
      id: "1",
      type: "order_confirmation",
      to_email: "buyer@example.com",
      to_name: "Buyer",
      reference_type: "orders",
      reference_id: "order-1",
      metadata: {},
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Download token not found");
    }
  });

  it("sends order confirmation email successfully", async () => {
    tables["orders"].single = vi.fn().mockResolvedValue({
      data: { id: "order-1", amount: 25000, products: { title: "Ebook" }, creators: { display_name: "Jane" } },
      error: null,
    });

    tables["downloads"].maybeSingle = vi.fn().mockResolvedValue({
      data: { token: "tok_abc" },
      error: null,
    });

    const result = await renderAndSend({
      id: "1",
      type: "order_confirmation",
      to_email: "buyer@example.com",
      to_name: "Buyer Name",
      reference_type: "orders",
      reference_id: "order-1",
      metadata: {},
    });

    expect(result.ok).toBe(true);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "buyer@example.com",
        subject: expect.stringContaining("Order Confirmed"),
      })
    );
  });

  it("returns error when withdrawal not found", async () => {
    const result = await renderAndSend({
      id: "2",
      type: "withdrawal_status",
      to_email: "creator@example.com",
      to_name: "Creator Name",
      reference_type: "withdrawal_requests",
      reference_id: "missing-wd",
      metadata: {},
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Withdrawal request not found");
    }
  });

  it("sends withdrawal status email successfully", async () => {
    tables["withdrawal_requests"].single = vi.fn().mockResolvedValue({
      data: { id: "wd-1", amount: 100000, status: "approved", admin_notes: null, payout_method: "Mobile Money" },
      error: null,
    });

    const result = await renderAndSend({
      id: "2",
      type: "withdrawal_status",
      to_email: "creator@example.com",
      to_name: "Creator Name",
      reference_type: "withdrawal_requests",
      reference_id: "wd-1",
      metadata: {},
    });

    expect(result.ok).toBe(true);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "creator@example.com",
        subject: expect.stringContaining("Withdrawal"),
      })
    );
  });

  it("returns error when refund not found", async () => {
    const result = await renderAndSend({
      id: "3",
      type: "refund_status",
      to_email: "buyer@example.com",
      to_name: "Buyer Name",
      reference_type: "refunds",
      reference_id: "missing-refund",
      metadata: {},
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Refund not found");
    }
  });

  it("sends refund status email successfully", async () => {
    tables["refunds"].single = vi.fn().mockResolvedValue({
      data: {
        id: "refund-1",
        status: "approved",
        admin_notes: "Processed",
        reversed_amount: 25000,
        orders: { products: { title: "Ebook" } },
      },
      error: null,
    });

    const result = await renderAndSend({
      id: "3",
      type: "refund_status",
      to_email: "buyer@example.com",
      to_name: "Buyer Name",
      reference_type: "refunds",
      reference_id: "refund-1",
      metadata: {},
    });

    expect(result.ok).toBe(true);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "buyer@example.com",
        subject: expect.stringContaining("Refund"),
      })
    );
  });

  it("handles sendEmail failure gracefully", async () => {
    tables["orders"].single = vi.fn().mockResolvedValue({
      data: { id: "order-1", amount: 25000, products: { title: "Ebook" }, creators: { display_name: "Jane" } },
      error: null,
    });

    tables["downloads"].maybeSingle = vi.fn().mockResolvedValue({
      data: { token: "tok_abc" },
      error: null,
    });

    vi.mocked(sendEmail).mockResolvedValue({ ok: false, error: "SMTP connection failed" });

    const result = await renderAndSend({
      id: "1",
      type: "order_confirmation",
      to_email: "buyer@example.com",
      to_name: "Buyer",
      reference_type: "orders",
      reference_id: "order-1",
      metadata: {},
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("SMTP connection failed");
    }
  });
});

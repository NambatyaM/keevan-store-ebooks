import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectCategory, runSupportBot } from "@/lib/support-bot";
import { verifyPesapalPayment } from "@/lib/pesapal";
import * as support from "@/lib/support";

function createChain() {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.is = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.or = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.insert = vi.fn(() => {
    const ret: any = createChain();
    ret.then = undefined;
    return ret;
  });
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.then = undefined;
  return chain;
}

const chainsByTable: Record<string, any> = {};

const mockSupabase = {
  from: vi.fn((table: string) => {
    if (!chainsByTable[table]) chainsByTable[table] = createChain();
    return chainsByTable[table];
  }),
};

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(() => mockSupabase),
}));

vi.mock("@/lib/pesapal", () => ({
  verifyPesapalPayment: vi.fn(),
}));

vi.mock("@/lib/support", () => {
  const actual = vi.importActual("@/lib/support");
  return {
    ...(actual as object),
    getOrderContext: vi.fn(),
    insertMessage: vi.fn().mockResolvedValue("msg-1"),
    touchConversation: vi.fn().mockResolvedValue(undefined),
    issueFreshDownloadLink: vi.fn().mockResolvedValue("tok_fresh"),
    resendOrderEmail: vi.fn().mockResolvedValue(true),
    adminNotifyNewIssue: vi.fn().mockResolvedValue(undefined),
    adminNotifyResolved: vi.fn().mockResolvedValue(undefined),
  };
});

const verifyMock = vi.mocked(verifyPesapalPayment);

function baseConversation(overrides: Partial<support.SupportConversation> = {}): support.SupportConversation {
  return {
    id: "conv-1",
    user_id: null,
    role: "buyer",
    email: "buyer@example.com",
    name: "Buyer",
    subject: "Can't download my ebook",
    category: "file_delivery",
    order_id: "order-1",
    product_id: "prod-1",
    status: "open",
    access_token: "tok_abc",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function orderRow(overrides: Partial<{ status: string; tracking_id: string | null; merchant_reference: string | null; payments: unknown[] }> = {}) {
  return {
    id: "order-1",
    product_id: "prod-1",
    buyer_email: "buyer@example.com",
    amount: 3000,
    currency: "UGX",
    status: "paid",
    created_at: new Date().toISOString(),
    payments: [
      { tracking_id: "TRK-1", status: "COMPLETED", merchant_reference: "REF-1" },
    ],
    products: { id: "prod-1", title: "Guide", slug: "guide" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(chainsByTable).forEach((k) => delete chainsByTable[k]);

  // Default chain resolutions
  chainsByTable["users"] = createChain();
  chainsByTable["users"].select = vi.fn(() => chainsByTable["users"]);
  chainsByTable["users"].eq = vi.fn(() => chainsByTable["users"]);
  chainsByTable["users"].select.mockResolvedValue = null;
  chainsByTable["notifications"] = createChain();
  chainsByTable["notifications"].insert.mockResolvedValue({ data: null, error: null });
  chainsByTable["notifications"].insert.mockImplementation(() => {
    const c = createChain();
    c.select = vi.fn(() => c);
    c.single = vi.fn().mockResolvedValue({ data: { id: "n-1" }, error: null });
    return c;
  });
  chainsByTable["products"] = createChain();
  chainsByTable["products"].maybeSingle = vi.fn().mockResolvedValue({
    data: { creator_id: "creator-1", title: "Guide", creators: { user_id: "user-creator-1" } },
    error: null,
  });
  chainsByTable["support_conversations"] = createChain();
  chainsByTable["support_conversations"].update = vi.fn(() => {
    const c = createChain();
    c.select = vi.fn(() => c);
    c.single = vi.fn().mockResolvedValue({ data: null, error: null });
    return c;
  });

  verifyMock.mockReset();
});

describe("detectCategory", () => {
  it("detects file delivery issues", () => {
    expect(detectCategory("I never received my download link")).toBe("file_delivery");
    expect(detectCategory("The download link expired")).toBe("file_delivery");
  });

  it("detects refund requests", () => {
    expect(detectCategory("I want a refund please")).toBe("refund");
  });

  it("detects payment issues", () => {
    expect(detectCategory("I paid but money was deducted twice")).toBe("payment");
  });

  it("detects order status questions", () => {
    expect(detectCategory("where is my order?")).toBe("order_status");
  });

  it("detects account help", () => {
    expect(detectCategory("I forgot my password")).toBe("account");
  });

  it("detects creator support", () => {
    expect(detectCategory("how do I withdraw my earnings?")).toBe("creator_support");
  });

  it("falls back to other", () => {
    expect(detectCategory("hello")).toBe("other");
  });
});

describe("runSupportBot", () => {
  it("delivers a fresh download link for a paid order and resolves", async () => {
    vi.mocked(support.getOrderContext).mockResolvedValue(orderRow({ status: "paid" }));
    const users = createChain();
    users.select.mockResolvedValue({ data: [{ id: "admin-1" }], error: null });
    chainsByTable["users"] = users;

    const result = await runSupportBot(mockSupabase as never, baseConversation(), "I never got my download");

    const kinds = result.replies.map((r) => r.kind);
    expect(kinds).toContain("download");
    expect(result.replies[0]).toMatchObject({ metadata: { url: "/api/downloads/tok_fresh", token: "tok_fresh" } });
    expect(support.issueFreshDownloadLink).toHaveBeenCalledWith(expect.anything(), "order-1", "prod-1");
    expect(support.resendOrderEmail).toHaveBeenCalledWith(expect.anything(), "order-1");
    expect(support.adminNotifyResolved).toHaveBeenCalled();
    // Conversation marked resolved
    const updateCalls = chainsByTable["support_conversations"].update.mock.calls;
    expect(updateCalls.some((c) => JSON.stringify(c[0]).includes("resolved"))).toBe(true);
    // Support messages persisted for each reply
    expect(support.insertMessage).toHaveBeenCalledTimes(result.replies.length);
  });

  it("re-issues an expired link for a paid order", async () => {
    vi.mocked(support.getOrderContext).mockResolvedValue(orderRow({ status: "paid" }));
    const users = createChain();
    users.select.mockResolvedValue({ data: [{ id: "admin-1" }], error: null });
    chainsByTable["users"] = users;

    const result = await runSupportBot(mockSupabase as never, baseConversation(), "My link expired");

    expect(result.replies.some((r) => r.kind === "download")).toBe(true);
    expect(result.replies[0].body).toContain("link");
  });

  it("tells a pending order without tracking that no charge occurred", async () => {
    vi.mocked(support.getOrderContext).mockResolvedValue(
      orderRow({ status: "pending", tracking_id: null, payments: [] }),
    );
    const users = createChain();
    users.select.mockResolvedValue({ data: [{ id: "admin-1" }], error: null });
    chainsByTable["users"] = users;

    const result = await runSupportBot(mockSupabase as never, baseConversation(), "I paid but it's not delivered");

    expect(result.replies[0].kind).toBe("text");
    expect(result.replies[0].body).toContain("never actually reached the payment step");
    expect(verifyMock).not.toHaveBeenCalled();
    expect(support.adminNotifyResolved).toHaveBeenCalled();
  });

  it("verifies and delivers when the pending payment actually completed", async () => {
    verifyMock.mockResolvedValue({ ok: true, payment: { status: "COMPLETED" } });
    vi.mocked(support.getOrderContext).mockResolvedValue(
      orderRow({ status: "pending", tracking_id: "TRK-1" }),
    );
    const users = createChain();
    users.select.mockResolvedValue({ data: [{ id: "admin-1" }], error: null });
    chainsByTable["users"] = users;

    const result = await runSupportBot(mockSupabase as never, baseConversation(), "I paid but nothing happened");

    expect(verifyMock).toHaveBeenCalledWith(expect.anything(), "REF-1", "TRK-1");
    expect(result.replies.map((r) => r.kind)).toContain("download");
    expect(support.adminNotifyResolved).toHaveBeenCalled();
  });

  it("reassures the buyer when payment is still processing", async () => {
    verifyMock.mockResolvedValue({ ok: false, error: "Payment is not completed" });
    vi.mocked(support.getOrderContext).mockResolvedValue(
      orderRow({ status: "pending", tracking_id: "TRK-1" }),
    );

    const result = await runSupportBot(mockSupabase as never, baseConversation(), "didn't get my file");

    expect(result.replies[0].body).toContain("still being confirmed");
    expect(support.adminNotifyResolved).not.toHaveBeenCalled();
    expect(support.adminNotifyNewIssue).not.toHaveBeenCalled();
  });

  it("tells a failed order buyer they were not charged", async () => {
    vi.mocked(support.getOrderContext).mockResolvedValue(orderRow({ status: "failed" }));
    const users = createChain();
    users.select.mockResolvedValue({ data: [{ id: "admin-1" }], error: null });
    chainsByTable["users"] = users;

    const result = await runSupportBot(mockSupabase as never, baseConversation(), "didn't receive my order");

    expect(result.replies[0].body).toContain("did not complete and you were not charged");
    expect(support.adminNotifyResolved).toHaveBeenCalled();
  });

  it("escalates pending orders it cannot fully verify", async () => {
    verifyMock.mockResolvedValue({ ok: false, error: "Network error" });
    vi.mocked(support.getOrderContext).mockResolvedValue(
      orderRow({ status: "pending", tracking_id: "TRK-1" }),
    );
    const users = createChain();
    users.select.mockResolvedValue({ data: [{ id: "admin-1" }], error: null });
    chainsByTable["users"] = users;

    const result = await runSupportBot(mockSupabase as never, baseConversation(), "help my file");

    expect(result.replies.some((r) => r.body.includes("flagged this to the team"))).toBe(true);
    expect(support.adminNotifyNewIssue).toHaveBeenCalled();
  });

  it("escalates when no order can be found", async () => {
    vi.mocked(support.getOrderContext).mockResolvedValue(null);
    const users = createChain();
    users.select.mockResolvedValue({ data: [{ id: "admin-1" }], error: null });
    chainsByTable["users"] = users;

    const result = await runSupportBot(mockSupabase as never, baseConversation(), "I never got my file");

    expect(support.adminNotifyNewIssue).toHaveBeenCalled();
    expect(result.replies[0].body).toContain("double-check the email");
  });

  it("answers refund questions without escalation", async () => {
    vi.mocked(support.getOrderContext).mockResolvedValue([]);

    const result = await runSupportBot(
      mockSupabase as never,
      baseConversation({ category: "refund", subject: "Refund request", order_id: null, product_id: null }),
      "I want my money back",
    );

    expect(result.replies[0].body).toContain("/request-refund");
    expect(support.adminNotifyNewIssue).not.toHaveBeenCalled();
  });

  it("lists order statuses for order_status requests", async () => {
    vi.mocked(support.getOrderContext).mockResolvedValue([orderRow({ status: "paid" })]);

    const result = await runSupportBot(
      mockSupabase as never,
      baseConversation({ category: "order_status", subject: "Order status", order_id: null }),
      "Where is my order?",
    );

    expect(result.replies[0].body).toContain("Paid ✓");
  });

  it("escalates cash payment disputes to admins", async () => {
    vi.mocked(support.getOrderContext).mockResolvedValue([]);
    const users = createChain();
    users.select.mockResolvedValue({ data: [{ id: "admin-1" }], error: null });
    chainsByTable["users"] = users;

    const result = await runSupportBot(
      mockSupabase as never,
      baseConversation({ category: "other", subject: "I paid cash", order_id: null, product_id: null }),
      "I paid cash",
    );

    expect(support.adminNotifyNewIssue).toHaveBeenCalled();
    const statusUpdate = chainsByTable["support_conversations"].update.mock.calls;
    expect(statusUpdate.some((c) => JSON.stringify(c[0]).includes("awaiting_admin"))).toBe(true);
  });
});
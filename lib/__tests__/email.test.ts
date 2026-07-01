import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendEmail } from "@/lib/email";
import {
  orderConfirmationHtml,
  withdrawalStatusHtml,
  refundStatusHtml,
} from "@/lib/email-templates";

const mockSend = vi.fn();

vi.mock("resend", () => {
  return {
    Resend: vi.fn().mockImplementation(function () {
      return { emails: { send: mockSend } };
    }),
  };
});

describe("sendEmail", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_abc123";
    process.env.SMTP_FROM = "noreply@keevanstore.in";
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends email successfully", async () => {
    mockSend.mockResolvedValue({ data: { id: "msg_123" }, error: null });

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.id).toBe("msg_123");
    }
    expect(mockSend).toHaveBeenCalledWith({
      from: "noreply@keevanstore.in",
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });
  });

  it("returns error when Resend API key is not configured", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Resend API key is not configured");
    }
  });

  it("handles send failure", async () => {
    mockSend.mockRejectedValue(new Error("Connection refused"));

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Connection refused");
    }
  });

  it("uses custom SMTP_FROM when set", async () => {
    process.env.SMTP_FROM = "shop@keevanstore.in";
    mockSend.mockResolvedValue({ data: { id: "msg_456" }, error: null });

    await sendEmail({
      to: "buyer@example.com",
      subject: "Order",
      html: "<p>Thanks</p>",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ from: "shop@keevanstore.in" })
    );
  });

  it("uses defaults when SMTP_FROM is not set", async () => {
    delete process.env.SMTP_FROM;
    mockSend.mockResolvedValue({ data: { id: "msg_789" }, error: null });

    await sendEmail({
      to: "test@example.com",
      subject: "Hi",
      html: "<p>Body</p>",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ from: "noreply@keevanstore.in" })
    );
  });
});

describe("orderConfirmationHtml", () => {
  it("includes download link", () => {
    const html = orderConfirmationHtml({
      buyerName: "John",
      productTitle: "Ebook Title",
      creatorName: "Jane",
      amount: 25000,
      downloadToken: "tok_abc123",
    });

    expect(html).toContain("https://keevanstore.in/download/tok_abc123");
    expect(html).toContain("Order Confirmed");
    expect(html).toContain("Ebook Title");
    expect(html).toContain("UGX");
    expect(html).toContain("25,000");
  });

  it("escapes HTML in user-supplied fields", () => {
    const html = orderConfirmationHtml({
      buyerName: "<script>alert('xss')</script>",
      productTitle: "Safe Title",
      creatorName: "Creator",
      amount: 10000,
      downloadToken: "tok_xyz",
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("withdrawalStatusHtml", () => {
  it("shows approved status with green color", () => {
    const html = withdrawalStatusHtml({
      displayName: "Creator Name",
      amount: 100000,
      status: "approved",
      adminNotes: null,
      payoutMethod: "Mobile Money",
    });

    expect(html).toContain("Approved");
    expect(html).toContain("#16a34a");
    expect(html).toContain("UGX");
    expect(html).toContain("100,000");
    expect(html).toContain("Mobile Money");
  });

  it("shows rejected status with red color", () => {
    const html = withdrawalStatusHtml({
      displayName: "Creator Name",
      amount: 50000,
      status: "rejected",
      adminNotes: "Insufficient funds",
      payoutMethod: "Bank Transfer",
    });

    expect(html).toContain("Rejected");
    expect(html).toContain("#dc2626");
    expect(html).toContain("Insufficient funds");
  });

  it("includes admin notes when present", () => {
    const html = withdrawalStatusHtml({
      displayName: "Creator",
      amount: 75000,
      status: "approved",
      adminNotes: "Processing this week",
      payoutMethod: "Mobile Money",
    });

    expect(html).toContain("Processing this week");
  });

  it("escapes HTML in display name", () => {
    const html = withdrawalStatusHtml({
      displayName: "<b>Hacker</b>",
      amount: 10000,
      status: "approved",
      adminNotes: null,
      payoutMethod: "Cash",
    });

    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;b&gt;");
  });

  it("shows paid out status for paid withdrawals", () => {
    const html = withdrawalStatusHtml({
      displayName: "Creator",
      amount: 200000,
      status: "paid",
      adminNotes: null,
      payoutMethod: "Mobile Money",
    });

    expect(html).toContain("Paid Out");
    expect(html).toContain("#2563eb");
  });
});

describe("refundStatusHtml", () => {
  it("shows approved refund with amount", () => {
    const html = refundStatusHtml({
      buyerName: "Buyer Name",
      productTitle: "Digital Product",
      status: "approved",
      adminNotes: null,
      reversedAmount: 25000,
    });

    expect(html).toContain("Approved");
    expect(html).toContain("#16a34a");
    expect(html).toContain("UGX");
    expect(html).toContain("25,000");
    expect(html).toContain("Digital Product");
  });

  it("shows declined refund without amount", () => {
    const html = refundStatusHtml({
      buyerName: "Buyer Name",
      productTitle: "Ebook",
      status: "rejected",
      adminNotes: "Request does not meet our refund policy",
      reversedAmount: null,
    });

    expect(html).toContain("Declined");
    expect(html).toContain("#dc2626");
    expect(html).not.toContain("UGX");
    expect(html).toContain("Request does not meet our refund policy");
  });

  it("includes admin notes when present", () => {
    const html = refundStatusHtml({
      buyerName: "Buyer",
      productTitle: "Product",
      status: "approved",
      adminNotes: "Refund processed as courtesy",
      reversedAmount: 10000,
    });

    expect(html).toContain("Refund processed as courtesy");
  });

  it("escapes HTML in buyer name", () => {
    const html = refundStatusHtml({
      buyerName: "<img src=x onerror=alert(1)>",
      productTitle: "Safe",
      status: "approved",
      adminNotes: null,
      reversedAmount: 5000,
    });

    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});

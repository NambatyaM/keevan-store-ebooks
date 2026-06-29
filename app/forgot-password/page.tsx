import type { Metadata } from "next";
import { site } from "@/lib/constants";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your Keevan Store creator account password. Enter your email address to receive reset instructions.",
  robots: { index: true, follow: false }
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

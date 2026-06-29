import type { Metadata } from "next";
import { site } from "@/lib/constants";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Creator Login — Keevan Store",
  description: "Log in to your Keevan Store creator dashboard. Manage your products, track sales, and request withdrawals.",
  robots: { index: true, follow: false }
};

export default function LoginPage() {
  return <LoginForm />;
}

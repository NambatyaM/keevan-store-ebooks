import type { Metadata } from "next";
import { site } from "@/lib/constants";
import SignupForm from "./signup-form";

export const metadata: Metadata = {
  title: "Create Your Free Store — Sign Up | Keevan Store",
  description: "Sign up for Keevan Store free. East African creators can create a branded store, upload digital products, and start selling in minutes. No credit card required.",
  robots: { index: true, follow: false }
};

export default function SignupPage() {
  return <SignupForm />;
}

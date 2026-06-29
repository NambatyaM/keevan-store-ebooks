import type { Metadata } from "next";
import { site } from "@/lib/constants";
import UpdatePasswordForm from "./update-password-form";

export const metadata: Metadata = {
  title: "Set New Password",
  description: "Set a new password for your Keevan Store creator account.",
  robots: { index: false, follow: false }
};

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}

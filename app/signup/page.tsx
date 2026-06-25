import { ButtonLink } from "@/components/button";
import { SimplePage } from "@/components/simple-page";

export default function SignupPage() {
  return (
    <SimplePage title="Create Your Creator Store" eyebrow="Start selling free">
      <form className="grid gap-4 rounded-lg border border-neutral-200 p-5">
        <input className="focus-ring rounded-md border border-neutral-300 px-4 py-3" placeholder="Full name" />
        <input className="focus-ring rounded-md border border-neutral-300 px-4 py-3" placeholder="Email address" type="email" />
        <input className="focus-ring rounded-md border border-neutral-300 px-4 py-3" placeholder="Store handle" />
        <ButtonLink href="/creator/dashboard">Continue to Dashboard</ButtonLink>
      </form>
    </SimplePage>
  );
}

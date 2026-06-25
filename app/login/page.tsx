import { ButtonLink } from "@/components/button";
import { SimplePage } from "@/components/simple-page";

export default function LoginPage() {
  return (
    <SimplePage title="Creator Login" eyebrow="Welcome back">
      <form className="grid gap-4 rounded-lg border border-neutral-200 p-5">
        <input className="focus-ring rounded-md border border-neutral-300 px-4 py-3" placeholder="Email address" type="email" />
        <input className="focus-ring rounded-md border border-neutral-300 px-4 py-3" placeholder="Password" type="password" />
        <ButtonLink href="/creator/dashboard">Login</ButtonLink>
      </form>
    </SimplePage>
  );
}

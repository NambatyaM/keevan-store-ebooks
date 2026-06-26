import { SimplePage } from "@/components/simple-page";

export default function DownloadLoading() {
  return (
    <SimplePage title="Loading..." eyebrow="Instant delivery">
      <div className="rounded-lg border border-neutral-200 p-6">
        <div className="h-6 w-6 animate-pulse rounded bg-neutral-200" />
        <div className="mt-4 h-8 w-64 animate-pulse rounded bg-neutral-200" />
        <div className="mt-3 h-4 w-96 animate-pulse rounded bg-neutral-200" />
        <div className="mt-6 h-12 w-48 animate-pulse rounded bg-neutral-200" />
      </div>
    </SimplePage>
  );
}

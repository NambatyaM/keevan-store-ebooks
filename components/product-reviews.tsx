"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type Review = {
  id: string;
  display_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

type ProductReviewsProps = {
  productId: string;
};

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.profile?.role) setUserRole(d.profile.role); })
      .catch(() => {});
  }, [productId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment })
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data?.error?.message ?? "Unable to submit review.");
        return;
      }

      setComment("");
      setShowForm(false);
      toast("success", "Review submitted");
    } catch {
      setSubmitError("Unable to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Reviews</h3>
        {avgRating && (
          <p className="text-sm text-neutral-600">
            {avgRating} / 5 ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
          </p>
        )}
      </div>

      {loading ? (
        <div className="mt-4 h-20 animate-pulse rounded-lg bg-neutral-100" />
      ) : reviews.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No reviews yet.</p>
      ) : (
        <div className="mt-4 grid gap-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{r.display_name}</span>
                <span className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} />
                  ))}
                </span>
                <span className="text-xs text-neutral-400">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-700">{r.comment}</p>
            </div>
          ))}
        </div>
      )}

      {userRole === "buyer" && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-green hover:underline"
        >
          <MessageSquare size={16} aria-hidden />
          Write a review
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 rounded-lg border border-neutral-200 p-4">
          <label className="grid gap-2 text-sm font-medium text-neutral-700">
            Rating
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="text-amber-500"
                >
                  <Star size={22} fill={n <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </label>
          <label className="grid gap-2 text-sm font-medium text-neutral-700">
            Comment
            <textarea
              className="focus-ring rounded-md border border-neutral-300 px-4 py-3"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              minLength={5}
              required
            />
          </label>
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#006f43] disabled:opacity-70"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-neutral-600 hover:underline"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

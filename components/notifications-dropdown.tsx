"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  created_at: string;
  read: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationsDropdown({ open, onClose, onUnreadCountChange }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
      if (typeof data.unreadCount === "number") onUnreadCountChange(data.unreadCount);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  async function markAsRead(ids?: string[]) {
    setMarking(true);
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids ? { ids } : {}),
      });
      if (ids) {
        setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
        onUnreadCountChange(notifications.length - ids.length);
      } else {
        setNotifications([]);
        onUnreadCountChange(0);
      }
    } catch {
      // silently fail
    } finally {
      setMarking(false);
    }
  }

  if (!open) return null;

  const unread = notifications.filter((n) => !n.read);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-white shadow-warm-lg animate-scale-check"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-bold text-brand-black">Notifications</h3>
        {unread.length > 0 && (
          <button
            onClick={() => markAsRead()}
            disabled={marking}
            className="flex items-center gap-1 text-xs font-semibold text-brand-green transition hover:text-brand-green-deep disabled:opacity-50"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-muted" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Bell size={28} className="mb-2 text-muted" />
            <p className="text-sm text-muted">No notifications yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`group flex items-start gap-3 px-4 py-3 transition hover:bg-neutral-50 ${
                  !n.read ? "bg-blue-50/40" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-black">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-muted line-clamp-2">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-muted">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markAsRead([n.id])}
                    disabled={marking}
                    className="mt-0.5 shrink-0 rounded p-1 text-muted opacity-0 transition hover:text-brand-green group-hover:opacity-100"
                    aria-label="Mark as read"
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

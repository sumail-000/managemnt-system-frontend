import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export type NotificationType =
  | "security.password_reset"
  | "product.created"
  | "qr.created"
  | "system.info";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string; // ISO
  read_at?: string | null;
  metadata?: Record<string, any>;
  link?: string;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  addNotification: (
    n: Omit<AppNotification, "id" | "created_at" | "read_at"> & { id?: string; created_at?: string; read_at?: string | null },
    opts?: { userEmail?: string }
  ) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// ---------- Local persistence helpers (fallback when API not available) ----------
const MAX_STORED = 50;

function storageKeyForUser(userId?: number | string, email?: string) {
  if (userId) return `notifications:user:${userId}`;
  if (email) return `notifications:email:${email.toLowerCase()}`;
  return `notifications:guest`;
}

function pendingKeyForEmail(email: string) {
  return `notifications:pending:${email.toLowerCase()}`;
}

function loadFromStorage(key: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data as AppNotification[];
    return [];
  } catch {
    return [];
  }
}

function saveToStorage(key: string, list: AppNotification[]) {
  try {
    const trimmed = [...list]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, MAX_STORED);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

// ---------- Feature detection for backend notifications API ----------
const API_SUPPORT_KEY = "notifications:api:supported";
function isApiSupported(): boolean {
  try {
    const v = localStorage.getItem(API_SUPPORT_KEY);
    if (v === "false") return false;
    if (v === "true") return true;
  } catch {}
  // Unknown defaults to true to attempt a single probe
  return true;
}
function setApiSupported(val: boolean) {
  try {
    localStorage.setItem(API_SUPPORT_KEY, val ? "true" : "false");
  } catch {}
}

async function tryFetchFromApi(): Promise<AppNotification[] | null> {
  // Short-circuit if we already detected lack of support
  if (!isApiSupported()) return null;
  try {
    const res = await api.get("/user/notifications");
    // Expecting either array or { success, data }
    const data = Array.isArray(res) ? res : res?.data;
    if (Array.isArray(data)) {
      setApiSupported(true);
      return normalize(data);
    }
    // If structure isn't as expected, consider unsupported to stop noisy retries
    setApiSupported(false);
    return null;
  } catch {
    // Mark unsupported to avoid repeated 404 logs from api client interceptors
    setApiSupported(false);
    return null;
  }
}

async function tryMarkReadApi(id: string): Promise<boolean> {
  if (!isApiSupported()) return false;
  try {
    await api.patch(`/user/notifications/${id}/read`);
    return true;
  } catch {
    // If this fails (e.g., 404), mark unsupported to suppress future attempts
    setApiSupported(false);
    return false;
  }
}

async function tryMarkAllReadApi(): Promise<boolean> {
  if (!isApiSupported()) return false;
  try {
    await api.patch(`/user/notifications/mark-all-read`);
    return true;
  } catch {
    setApiSupported(false);
    return false;
  }
}

function normalize(list: any[]): AppNotification[] {
  return (list || []).map((n) => ({
    id: String(n.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    type: (n.type as NotificationType) ?? "system.info",
    title: n.title ?? "Notification",
    message: n.message ?? "",
    created_at: n.created_at ?? new Date().toISOString(),
    read_at: n.read_at ?? null,
    metadata: n.metadata ?? {},
    link: n.link ?? undefined,
  }));
}

// ---------- Provider ----------
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const initializedRef = useRef(false);

  const userStorageKey = useMemo(
    () => storageKeyForUser(user?.id, user?.email),
    [user?.id, user?.email]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read_at).length,
    [notifications]
  );

  const mergePendingForEmail = useCallback(
    (email?: string | null) => {
      if (!email) return;
      const pKey = pendingKeyForEmail(email);
      const pending = loadFromStorage(pKey);
      if (pending.length === 0) return;
      // Clear pending
      try {
        localStorage.removeItem(pKey);
      } catch {}
      // Merge unique by id
      setNotifications((prev) => {
        const map = new Map(prev.map((n) => [n.id, n]));
        for (const n of pending) {
          if (!map.has(n.id)) map.set(n.id, n);
        }
        const merged = Array.from(map.values());
        saveToStorage(userStorageKey, merged);
        return merged;
      });
    },
    [userStorageKey]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // Try API first
      const apiList = await tryFetchFromApi();
      if (apiList) {
        setNotifications(apiList);
        saveToStorage(userStorageKey, apiList);
      } else {
        // Fallback to local storage
        const local = loadFromStorage(userStorageKey);
        setNotifications(local);
      }
      // Merge any pending items for this email (for actions done while logged-out)
      mergePendingForEmail(user?.email);
    } finally {
      setLoading(false);
    }
  }, [user?.email, userStorageKey, mergePendingForEmail]);

  useEffect(() => {
    // On user switch, load their notifications
    if (!initializedRef.current) {
      initializedRef.current = true;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email]);

  // Persist changes locally
  useEffect(() => {
    saveToStorage(userStorageKey, notifications);
  }, [notifications, userStorageKey]);

  const addNotification: NotificationsContextValue["addNotification"] = useCallback(
    async (n, opts) => {
      const now = new Date().toISOString();
      const item: AppNotification = {
        id: n.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: n.type,
        title: n.title,
        message: n.message,
        created_at: n.created_at ?? now,
        read_at: n.read_at ?? null,
        metadata: n.metadata,
        link: n.link,
      };

      // If user is logged in (provider context), add to in-memory + user storage
      if (user?.id || user?.email) {
        setNotifications((prev) => {
          const updated = [item, ...prev];
          saveToStorage(userStorageKey, updated);
          return updated;
        });
        // Optional: try to POST to API if endpoint exists (ignore errors)
        if (isApiSupported()) {
          try {
            await api.post("/user/notifications", item);
            setApiSupported(true);
          } catch {
            // If the POST fails (e.g., 404), mark unsupported to stop future attempts
            setApiSupported(false);
          }
        }
      } else {
        // No user - store pending by email if provided
        const email = opts?.userEmail;
        const pKey = email ? pendingKeyForEmail(email) : storageKeyForUser();
        const current = loadFromStorage(pKey);
        const updated = [item, ...current];
        saveToStorage(pKey, updated);
      }
    },
    [user?.id, user?.email, userStorageKey]
  );

  const markAsRead: NotificationsContextValue["markAsRead"] = useCallback(async (id) => {
    const ts = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at ?? ts } : n))
    );
    // Try API
    await tryMarkReadApi(id);
  }, []);

  const markAllAsRead: NotificationsContextValue["markAllAsRead"] = useCallback(async () => {
    const ts = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? ts })));
    await tryMarkAllReadApi();
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      addNotification,
      markAsRead,
      markAllAsRead,
      refresh,
    }),
    [notifications, unreadCount, loading, addNotification, markAsRead, markAllAsRead, refresh]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
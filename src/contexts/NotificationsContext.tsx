import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export type NotificationType =
  | "security.password_reset"
  | "product.created"
  | "qr.created"
  | "system.info"
  | "support_ticket_created"
  | "support_reply"
  | "support_status";

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
  hasNew: boolean;
  addNotification: (
    n: Omit<AppNotification, "id" | "created_at" | "read_at"> & { id?: string; created_at?: string; read_at?: string | null },
    opts?: { userEmail?: string }
  ) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
  setSeenNow: () => void;
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

function lastSeenKeyForUser(userId?: number | string, email?: string) {
  if (userId) return `notifications:lastSeen:user:${userId}`;
  if (email) return `notifications:lastSeen:email:${String(email).toLowerCase()}`;
  return `notifications:lastSeen:guest`;
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
  // Always attempt API; previously cached failures could block future fetches
  return true;
}
function setApiSupported(val: boolean) {
  try {
    localStorage.setItem(API_SUPPORT_KEY, val ? "true" : "false");
  } catch {}
}

async function tryFetchFromApi(): Promise<AppNotification[] | null> {
  try {
    // Skip API notifications fetch on payment page to avoid 402 (payment required) noise
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/payment')) {
      return null;
    }
    const res = await api.get("/user/notifications");
    // Handle various shapes: [] or { data: [] } or { success, data: [] } or { data: { data: [] } }
    let list: any = null;
    if (Array.isArray(res)) {
      list = res;
    } else if (res && Array.isArray(res.data)) {
      list = res.data;
    } else if (res && res.data && Array.isArray(res.data.data)) {
      list = res.data.data;
    } else if (res && Array.isArray((res as any).items)) {
      list = (res as any).items;
    }
    if (Array.isArray(list)) {
      setApiSupported(true);
      return normalize(list);
    }
    // Fallback to an empty list rather than disabling API
    setApiSupported(true);
    return [];
  } catch (e: any) {
    // On 402 Payment Required (not paid yet), skip and fallback to local storage
    const status = e?.response?.status;
    if (status === 402) {
      return null;
    }
    // On other errors, return null to fallback to local storage this cycle
    try { setApiSupported(false); } catch {}
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
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const userStorageKey = useMemo(
    () => storageKeyForUser(user?.id, user?.email),
    [user?.id, user?.email]
  );
  const userLastSeenKey = useMemo(
    () => lastSeenKeyForUser(user?.id, user?.email),
    [user?.id, user?.email]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read_at).length,
    [notifications]
  );

  const hasNew = useMemo(() => {
    if (!notifications.length) return false;
    if (!lastSeenAt) return notifications.length > 0;
    const seenTs = new Date(lastSeenAt).getTime();
    return notifications.some((n) => {
      const t = new Date(n.created_at).getTime();
      return t > seenTs;
    });
  }, [notifications, lastSeenAt]);

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
      if (token) {
        // Authenticated: try API first
        const apiList = await tryFetchFromApi();
        if (apiList) {
          setNotifications(apiList);
          saveToStorage(userStorageKey, apiList);
        } else {
          // Fallback to local storage for this cycle
          const local = loadFromStorage(userStorageKey);
          setNotifications(local);
        }
      } else {
        // Not authenticated: do NOT hit API. Load any locally stored notifications.
        const local = loadFromStorage(userStorageKey);
        setNotifications(local);
      }
      // Merge any pending items for this email (for actions done while logged-out)
      mergePendingForEmail(user?.email);
    } finally {
      setLoading(false);
    }
  }, [token, user?.email, userStorageKey, mergePendingForEmail]);

  useEffect(() => {
    // Load last seen timestamp for the current user
    try {
      const v = localStorage.getItem(userLastSeenKey);
      if (v) setLastSeenAt(v);
    } catch {}
  }, [userLastSeenKey]);

  useEffect(() => {
    // On user switch, load their notifications
    if (!initializedRef.current) {
      initializedRef.current = true;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email]);

  // Lightweight polling for new notifications
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      refresh().catch(() => {});
    }, 10000);
    return () => clearInterval(id);
  }, [token, refresh]);

  // When token becomes available (user logs in), perform an immediate refresh
  useEffect(() => {
    if (token) {
      refresh().catch(() => {});
    }
  }, [token, refresh]);

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

  const setSeenNow = useCallback(() => {
    const now = new Date().toISOString();
    setLastSeenAt(now);
    try { localStorage.setItem(userLastSeenKey, now); } catch {}
  }, [userLastSeenKey]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      hasNew,
      addNotification,
      markAsRead,
      markAllAsRead,
      refresh,
      setSeenNow,
    }),
    [notifications, unreadCount, loading, hasNew, addNotification, markAsRead, markAllAsRead, refresh, setSeenNow]
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
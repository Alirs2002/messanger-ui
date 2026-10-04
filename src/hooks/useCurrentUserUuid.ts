import { useState, useEffect } from "react";
import { authStorage } from "../services/auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/messenger/api";

interface MeResponse {
  userId?: string;
  id?: string;
  [key: string]: unknown;
}

export function useCurrentUserUuid(): string | undefined {
  const [uuid, setUuid] = useState<string | undefined>(
    authStorage.getUserUuid() ?? undefined,
  );

  useEffect(() => {
    // Return early if already cached from a previous session
    const cached = authStorage.getUserUuid();
    if (cached) {
      setUuid(cached);
      return;
    }

    const token = authStorage.getToken();
    if (!token) return;

    let cancelled = false;

    fetch(`${BASE_URL}/users/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`[API] ${res.status} — /users/me`);
        return res.json() as Promise<MeResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        // Accommodate both common field name conventions
        const id = data.userId ?? data.id;
        if (typeof id === "string" && id.length > 0) {
          authStorage.setUserUuid(id);
          setUuid(id);
        }
      })
      .catch((err) => {
        console.error("[useCurrentUserUuid] failed to fetch /users/me:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return uuid;
}

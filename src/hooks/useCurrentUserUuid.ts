import { useState, useEffect } from "react";
import { authStorage } from "../services/auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * Returns the current user's UUID (matches authorUserId in the messages API).
 * Reads from localStorage cache first; fetches /users/me only when missing.
 */
export function useCurrentUserUuid(): string | null {
  const [uuid, setUuid] = useState<string | null>(authStorage.getUserUuid());

  useEffect(() => {
    if (uuid) return; // already cached

    const token = authStorage.getToken();
    if (!token) return;

    fetch(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`/users/me responded ${res.status}`);
        return res.json();
      })
      .then((data: Record<string, unknown>) => {
        // Adjust the field name if your API uses a different key (userId, uuid, etc.)
        const userUuid =
          (data.id as string) ??
          (data.userId as string) ??
          (data.uuid as string);

        if (userUuid) {
          authStorage.setUserUuid(userUuid);
          setUuid(userUuid);
        }
      })
      .catch(() => {
        // silently fail — isOutgoing stays false until the next mount
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return uuid;
}

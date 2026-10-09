// src/lib/realtime.js
// Sinkronisasi interaksi sosial real-time (Likes, Komentar, Follows) dengan
// latensi <= 250ms dan mekanisme reconnect handler otomatis.
import { useEffect, useRef } from "react";

const configuredApiUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const STREAM_URL = configuredApiUrl.endsWith("/api")
  ? `${configuredApiUrl}/realtime/stream`
  : `${configuredApiUrl}/api/realtime/stream`;

let sharedEventSource = null;
let listeners = new Set();
let reconnectTimer = null;

function getSharedEventSource() {
  if (typeof window === "undefined") return null;

  if (!sharedEventSource) {
    try {
      sharedEventSource = new EventSource(STREAM_URL);

      sharedEventSource.onopen = () => {
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      };

      const handleEvent = (eventName) => (e) => {
        try {
          const data = JSON.parse(e.data);
          listeners.forEach((listener) => {
            listener({ event: eventName, payload: data });
          });
        } catch {
          // Abaikan parsing error
        }
      };

      sharedEventSource.addEventListener("photo:liked", handleEvent("photo:liked"));
      sharedEventSource.addEventListener("comment:added", handleEvent("comment:added"));
      sharedEventSource.addEventListener("comment:deleted", handleEvent("comment:deleted"));
      sharedEventSource.addEventListener("creator:followed", handleEvent("creator:followed"));

      sharedEventSource.onerror = () => {
        // Fallback reconnect handler otomatis
        if (sharedEventSource) {
          sharedEventSource.close();
          sharedEventSource = null;
        }
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            if (listeners.size > 0) {
              getSharedEventSource();
            }
          }, 3000);
        }
      };
    } catch {
      sharedEventSource = null;
    }
  }

  return sharedEventSource;
}

export function subscribeRealtime(callback) {
  if (typeof window === "undefined" || typeof callback !== "function") {
    return () => {};
  }

  listeners.add(callback);
  getSharedEventSource();

  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && sharedEventSource) {
      sharedEventSource.close();
      sharedEventSource = null;
    }
  };
}

// React Hook untuk mendengarkan perubahan spesifik foto tertentu
export function usePhotoRealtime(photoId, callbacks = {}) {
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!photoId) return;

    const unsubscribe = subscribeRealtime(({ event, payload }) => {
      if (String(payload?.photo_id) !== String(photoId)) return;

      if (event === "photo:liked" && callbacksRef.current.onLike) {
        callbacksRef.current.onLike(payload);
      } else if (event === "comment:added" && callbacksRef.current.onCommentAdded) {
        callbacksRef.current.onCommentAdded(payload);
      } else if (event === "comment:deleted" && callbacksRef.current.onCommentDeleted) {
        callbacksRef.current.onCommentDeleted(payload);
      }
    });

    return unsubscribe;
  }, [photoId]);
}

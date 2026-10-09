// lib/realtime.js
// Pengirim event real-time terpadu (Supabase Realtime Channel Broadcast + SSE Event Stream).
// Memastikan latency interaksi <= 250ms dan broadcast instan ke seluruh klien aktif.

import { EventEmitter } from "events";
import supabase from "../config/supabase.js";

const emitter = new EventEmitter();
emitter.setMaxListeners(100);

let supabaseChannel = null;

// Inisialisasi channel broadcast Supabase Realtime
try {
  supabaseChannel = supabase.channel("picflow-social-updates");
  supabaseChannel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      console.log("Supabase Realtime channel connected: picflow-social-updates");
    }
  });
} catch (err) {
  console.warn("Failed to initialize Supabase Realtime channel:", err.message);
}

export function broadcastEvent(event, payload) {
  // 1. Emit ke SSE clients lokal
  emitter.emit("message", { event, payload, timestamp: Date.now() });

  // 2. Broadcast ke Supabase Realtime WebSocket channel jika aktif
  if (supabaseChannel) {
    supabaseChannel
      .send({
        type: "broadcast",
        event,
        payload,
      })
      .catch(() => {});
  }
}

export function subscribeLocalEvents(listener) {
  emitter.on("message", listener);
  return () => {
    emitter.off("message", listener);
  };
}

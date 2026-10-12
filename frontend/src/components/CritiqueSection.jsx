"use client";

// src/components/CritiqueSection.jsx
// Panel Kritik & Saran Konstruktif Fotografi:
// - Ringkasan 4 Pilar: Komposisi, Pencahayaan, Warna/Tone, Ide/Konsep (1-5)
// - Form masukan terstruktur: Rating 4 pilar + Poin Kekuatan + Saran Pengembangan
// - Feed ulasan real-time dengan optimistic update & sinkronisasi SSE/WebSocket
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Star,
  ThumbsUp,
  Lightbulb,
  Trash2,
  Plus,
  X,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import {
  getPhotoCritiques,
  addPhotoCritique,
  deletePhotoCritique,
} from "@/lib/api";
import { usePhotoRealtime } from "@/lib/realtime";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import ApertureLoader from "@/components/ui/ApertureLoader";
import Button from "@/components/ui/Button";

const PILLARS = [
  { key: "rating_composition", label: "Komposisi", hint: "Framing & Rule of Thirds" },
  { key: "rating_lighting", label: "Pencahayaan", hint: "Exposure & Shadow/Highlight" },
  { key: "rating_color", label: "Warna & Tone", hint: "Grading & Keseimbangan sRGB" },
  { key: "rating_concept", label: "Ide & Konsep", hint: "Storytelling & Pesan Visual" },
];

export default function CritiqueSection({
  photoId,
  photoOwnerId,
  className = "",
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [prevPhotoId, setPrevPhotoId] = useState(photoId);
  const [critiques, setCritiques] = useState([]);
  const [stats, setStats] = useState({
    total_critiques: 0,
    avg_composition: 0,
    avg_lighting: 0,
    avg_color: 0,
    avg_concept: 0,
    overall_avg: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (photoId !== prevPhotoId) {
    setPrevPhotoId(photoId);
    setLoading(true);
  }

  // Form State
  const [formData, setFormData] = useState({
    rating_composition: 4,
    rating_lighting: 4,
    rating_color: 4,
    rating_concept: 4,
    strengths: "",
    improvements: "",
  });

  const isOwner = Boolean(
    user && (user.id_user === photoOwnerId || user.id === photoOwnerId)
  );

  // Muat kritik awal
  useEffect(() => {
    if (!photoId) return;
    let active = true;

    getPhotoCritiques(photoId)
      .then((res) => {
        if (active && res.data) {
          setCritiques(res.data.critiques || []);
          setStats(res.data.stats || {});
        }
      })
      .catch((err) => {
        if (active) console.error("Failed to load critiques:", err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [photoId]);

  // Dengarkan siaran real-time
  usePhotoRealtime(photoId, {
    onCritiqueAdded: (payload) => {
      if (!payload?.critique) return;
      setCritiques((prev) => {
        if (
          prev.some(
            (c) => String(c.id_critique) === String(payload.critique.id_critique)
          )
        ) {
          return prev;
        }
        const updated = [payload.critique, ...prev];
        recalcStats(updated);
        return updated;
      });
    },
    onCritiqueDeleted: (payload) => {
      if (!payload?.critique_id) return;
      setCritiques((prev) => {
        const updated = prev.filter(
          (c) => String(c.id_critique) !== String(payload.critique_id)
        );
        recalcStats(updated);
        return updated;
      });
    },
  });

  function recalcStats(list) {
    if (!list || list.length === 0) {
      setStats({
        total_critiques: 0,
        avg_composition: 0,
        avg_lighting: 0,
        avg_color: 0,
        avg_concept: 0,
        overall_avg: 0,
      });
      return;
    }
    const sum = list.reduce(
      (acc, c) => ({
        composition: acc.composition + Number(c.rating_composition || 0),
        lighting: acc.lighting + Number(c.rating_lighting || 0),
        color: acc.color + Number(c.rating_color || 0),
        concept: acc.concept + Number(c.rating_concept || 0),
      }),
      { composition: 0, lighting: 0, color: 0, concept: 0 }
    );
    const n = list.length;
    const avg_composition = +(sum.composition / n).toFixed(1);
    const avg_lighting = +(sum.lighting / n).toFixed(1);
    const avg_color = +(sum.color / n).toFixed(1);
    const avg_concept = +(sum.concept / n).toFixed(1);
    const overall_avg = +(
      (avg_composition + avg_lighting + avg_color + avg_concept) /
      4
    ).toFixed(1);

    setStats({
      total_critiques: n,
      avg_composition,
      avg_lighting,
      avg_color,
      avg_concept,
      overall_avg,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    if (!formData.strengths.trim() || !formData.improvements.trim()) {
      toast.error("Mohon isi poin kekuatan dan saran perbaikan.");
      return;
    }

    setSubmitting(true);
    const tempId = `temp-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "optimistic"}`;
    const overallScore = +(
      (formData.rating_composition +
        formData.rating_lighting +
        formData.rating_color +
        formData.rating_concept) /
      4
    ).toFixed(1);

    const optimisticCritique = {
      id_critique: tempId,
      id_photo: photoId,
      id_user: user?.id_user || user?.id,
      rating_composition: formData.rating_composition,
      rating_lighting: formData.rating_lighting,
      rating_color: formData.rating_color,
      rating_concept: formData.rating_concept,
      overall_score: overallScore,
      strengths: formData.strengths.trim(),
      improvements: formData.improvements.trim(),
      created_at: new Date().toISOString(),
      user: {
        id_user: user?.id_user || user?.id,
        username: user?.username || "You",
        avatar_url: user?.profile_picture_url,
      },
      is_owner: true,
      pending: true,
    };

    setCritiques((prev) => [optimisticCritique, ...prev]);
    recalcStats([optimisticCritique, ...critiques]);
    setIsFormOpen(false);

    try {
      const res = await addPhotoCritique(photoId, formData);
      if (res?.data) {
        setCritiques((prev) =>
          prev.map((c) => (c.id_critique === tempId ? res.data : c))
        );
        toast.success("Kritik konstruktif berhasil dikirim!");
        setFormData({
          rating_composition: 4,
          rating_lighting: 4,
          rating_color: 4,
          rating_concept: 4,
          strengths: "",
          improvements: "",
        });
      }
    } catch (err) {
      setCritiques((prev) => prev.filter((c) => c.id_critique !== tempId));
      recalcStats(critiques);
      toast.error(err.message || "Gagal mengirim kritik.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(critiqueId) {
    if (!critiqueId) return;
    const prevCritiques = [...critiques];
    const filtered = critiques.filter((c) => c.id_critique !== critiqueId);
    setCritiques(filtered);
    recalcStats(filtered);

    try {
      await deletePhotoCritique(photoId, critiqueId);
      toast.success("Kritik dihapus.");
    } catch (err) {
      setCritiques(prevCritiques);
      recalcStats(prevCritiques);
      toast.error(err.message || "Gagal menghapus kritik.");
    }
  }

  return (
    <div
      className={`flex flex-col rounded-[var(--radius-md)] border border-line bg-[var(--surface)] p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line/60 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
            Kritik Konstruktif &amp; Saran
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] font-medium text-muted">
            {stats.total_critiques} Ulasan
          </span>
          {!isOwner && (
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  toast.info("Silakan masuk atau daftar untuk memberikan kritik & saran.");
                  return;
                }
                setIsFormOpen((prev) => !prev);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
            >
              {isFormOpen ? (
                <>
                  <X size={12} /> Batal
                </>
              ) : (
                <>
                  <Plus size={12} /> Beri Kritik
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan Skor 4 Pilar */}
      <div className="mt-3 rounded-[var(--radius-sm)] border border-line/50 bg-[var(--bg-elevated)]/60 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xl font-bold text-ink">
              {stats.overall_avg > 0 ? stats.overall_avg.toFixed(1) : "—"}
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-muted">
                Skor Rata-rata Komunitas
              </span>
              <div className="flex items-center gap-0.5 text-accent">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={11}
                    className={
                      star <= Math.round(stats.overall_avg)
                        ? "fill-current text-accent"
                        : "text-line"
                    }
                  />
                ))}
              </div>
            </div>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
            Skala 1 - 5
          </span>
        </div>

        {/* 4 Pilar Grid */}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line/40 pt-2.5 sm:grid-cols-4">
          <ScorePill
            label="Komposisi"
            value={stats.avg_composition}
            color="text-accent"
          />
          <ScorePill
            label="Pencahayaan"
            value={stats.avg_lighting}
            color="text-amber-400"
          />
          <ScorePill
            label="Warna & Tone"
            value={stats.avg_color}
            color="text-emerald-400"
          />
          <ScorePill
            label="Ide & Konsep"
            value={stats.avg_concept}
            color="text-sky-400"
          />
        </div>
      </div>

      {/* Pesan jika pemilik foto melihat panel ini */}
      {isOwner && (
        <p className="mt-2 text-center text-[11px] text-faint">
          Kritik teknis dari komunitas akan membantu mengevaluasi framing dan tone karyamu.
        </p>
      )}

      {/* Collapsible Form Kritik Baru */}
      <AnimatePresence>
        {isFormOpen && !isOwner && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="mt-3 overflow-hidden rounded-[var(--radius-sm)] border border-accent/40 bg-[var(--bg-elevated)] p-3.5"
          >
            <div className="flex items-center gap-1.5 pb-2 text-xs font-semibold text-ink">
              <SlidersHorizontal size={13} className="text-accent" />
              <span>Formulir Kritik Konstruktif</span>
            </div>

            {/* Input Slider / Rating 4 Pilar */}
            <div className="grid grid-cols-1 gap-2.5 py-2 sm:grid-cols-2">
              {PILLARS.map(({ key, label, hint }) => (
                <div
                  key={key}
                  className="rounded-[var(--radius-sm)] border border-line/60 bg-[var(--surface)] p-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink">{label}</span>
                    <span className="font-mono font-bold text-accent">
                      {formData[key]} / 5
                    </span>
                  </div>
                  <p className="text-[10px] text-faint">{hint}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, [key]: val }))
                        }
                        className={`flex h-6 flex-1 items-center justify-center rounded text-xs font-mono font-semibold transition-all ${
                          formData[key] >= val
                            ? "bg-accent/20 text-accent border border-accent/50"
                            : "bg-[var(--bg-elevated)] text-faint border border-line/50 hover:text-ink"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Poin Kekuatan */}
            <div className="mt-2.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <ThumbsUp size={12} />
                <span>Poin Kekuatan (Apa yang paling memukau dari foto ini?)</span>
              </label>
              <textarea
                value={formData.strengths}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, strengths: e.target.value }))
                }
                rows={2}
                maxLength={2000}
                placeholder="Misal: Penempatan leading lines sempurna dan ketajaman fokus di mata subjek sangat presisi..."
                required
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-line bg-[var(--surface)] p-2 text-xs text-ink placeholder:text-faint focus:border-emerald-400 focus:outline-none"
              />
            </div>

            {/* Saran Pengembangan */}
            <div className="mt-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-sky-400">
                <Lightbulb size={12} />
                <span>Saran Pengembangan (Apa yang bisa disempurnakan?)</span>
              </label>
              <textarea
                value={formData.improvements}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, improvements: e.target.value }))
                }
                rows={2}
                maxLength={2000}
                placeholder="Misal: Area highlight di awan agak blown out, bisa ditarik sedikit saat color grading..."
                required
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-line bg-[var(--surface)] p-2 text-xs text-ink placeholder:text-faint focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsFormOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                loading={submitting}
                className="text-xs"
              >
                <Send size={12} className="mr-1" /> Kirim Kritik
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Daftar Kritik */}
      <div className="my-3 flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <ApertureLoader size={22} />
          </div>
        ) : critiques.length === 0 ? (
          <p className="py-6 text-center text-xs text-faint">
            Belum ada ulasan teknis. Jadilah fotografer pertama yang memberikan kritik konstruktif!
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {critiques.map((c) => {
              const authorName = c.user?.username || "Kritikus";
              const authorAvatar = c.user?.avatar_url;
              const dateStr = c.created_at
                ? new Date(c.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })
                : "";

              return (
                <motion.div
                  key={c.id_critique}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-[var(--radius-sm)] border border-line/60 bg-[var(--bg-elevated)]/50 p-3 transition-colors hover:border-line"
                >
                  {/* Header Item */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-[var(--surface)] text-[9px] font-bold text-ink">
                        {authorAvatar ? (
                          <Image
                            src={authorAvatar}
                            alt={authorName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          authorName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-xs font-semibold text-ink">
                        {authorName}
                      </span>
                      <span className="text-[10px] text-faint">{dateStr}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[10px] font-bold text-accent">
                        <Star size={9} className="fill-current" />
                        {Number(c.overall_score || 0).toFixed(1)}
                      </span>
                      {c.is_owner && !c.pending && (
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id_critique)}
                          aria-label="Hapus kritik"
                          className="text-faint transition-colors hover:text-danger"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Micro Breakdown 4 Pilar */}
                  <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[9px] text-muted">
                    <span className="rounded bg-[var(--surface)] px-1.5 py-0.5 border border-line/40">
                      Komp: <strong className="text-ink">{c.rating_composition}</strong>
                    </span>
                    <span className="rounded bg-[var(--surface)] px-1.5 py-0.5 border border-line/40">
                      Cahaya: <strong className="text-ink">{c.rating_lighting}</strong>
                    </span>
                    <span className="rounded bg-[var(--surface)] px-1.5 py-0.5 border border-line/40">
                      Warna: <strong className="text-ink">{c.rating_color}</strong>
                    </span>
                    <span className="rounded bg-[var(--surface)] px-1.5 py-0.5 border border-line/40">
                      Konsep: <strong className="text-ink">{c.rating_concept}</strong>
                    </span>
                  </div>

                  {/* Poin Kekuatan */}
                  {c.strengths && (
                    <div className="mt-2.5 rounded bg-emerald-950/20 p-2 text-xs border border-emerald-900/30">
                      <div className="flex items-center gap-1 font-semibold text-emerald-400 text-[10px]">
                        <ThumbsUp size={10} />
                        <span>Kekuatan Visual</span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink/90 leading-relaxed">
                        {c.strengths}
                      </p>
                    </div>
                  )}

                  {/* Saran Perbaikan */}
                  {c.improvements && (
                    <div className="mt-1.5 rounded bg-sky-950/20 p-2 text-xs border border-sky-900/30">
                      <div className="flex items-center gap-1 font-semibold text-sky-400 text-[10px]">
                        <Lightbulb size={10} />
                        <span>Saran Perbaikan</span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink/90 leading-relaxed">
                        {c.improvements}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function ScorePill({ label, value, color }) {
  return (
    <div className="flex flex-col rounded bg-[var(--surface)] p-1.5 border border-line/40">
      <span className="text-[10px] text-faint truncate">{label}</span>
      <span className={`font-mono text-xs font-bold ${color}`}>
        {value > 0 ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}

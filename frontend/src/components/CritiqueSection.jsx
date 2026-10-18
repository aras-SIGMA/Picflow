"use client";

// src/components/CritiqueSection.jsx
// Panel Kritik & Saran Konstruktif Fotografi:
// - Desain bersih berpedoman ketat pada .md/DESIGN/design.md
// - Ringkasan 4 Pilar: Komposisi, Pencahayaan, Warna/Tone, Ide/Konsep (skala 1-5)
// - Form masukan terstruktur: Rating 4 pilar + Poin Kekuatan + Saran Pengembangan
// - Feed ulasan real-time dengan deduplikasi aman & sinkronisasi SSE
import { useState, useEffect, useRef, useMemo } from "react";
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
  Loader2,
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

const PILLARS = [
  { key: "rating_composition", label: "Composition", hint: "Framing & Rule of Thirds" },
  { key: "rating_lighting", label: "Lighting", hint: "Exposure & Dynamic Range" },
  { key: "rating_color", label: "Color & Tone", hint: "Grading & sRGB Fidelity" },
  { key: "rating_concept", label: "Concept & Narrative", hint: "Storytelling & Visual Intent" },
];

function createTempId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? `temp-${crypto.randomUUID()}`
    : `temp-${Date.now()}`;
}

export default function CritiqueSection({
  photoId,
  photoOwnerId,
  className = "",
  embedded = false,
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
  const submittingRef = useRef(false);

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
      const newCritique = payload.critique;

      setCritiques((prev) => {
        if (
          prev.some(
            (c) => String(c.id_critique) === String(newCritique.id_critique)
          )
        ) {
          return prev;
        }

        // Gantikan item pending jika user dan isi cocok
        const pendingIdx = prev.findIndex(
          (c) =>
            c.pending &&
            String(c.id_user) === String(newCritique.id_user) &&
            c.strengths === newCritique.strengths
        );

        if (pendingIdx !== -1) {
          const next = [...prev];
          next[pendingIdx] = {
            ...newCritique,
            is_owner: Boolean(user?.id_user && newCritique.id_user === user.id_user),
          };
          recalcStats(next);
          return next;
        }

        const updated = [
          {
            ...newCritique,
            is_owner: Boolean(user?.id_user && newCritique.id_user === user.id_user),
          },
          ...prev,
        ];
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
    if (submittingRef.current) return;

    if (!formData.strengths.trim() || !formData.improvements.trim()) {
      toast.error("Mohon isi poin kekuatan dan saran perbaikan.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);

    const tempId = createTempId();
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
        avatar_url: user?.profile_picture_url || user?.avatar_url,
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
        const saved = res.data;
        setCritiques((prev) => {
          const alreadyExists = prev.some(
            (c) => String(c.id_critique) === String(saved.id_critique)
          );
          if (alreadyExists) {
            return prev.filter((c) => c.id_critique !== tempId);
          }
          return prev.map((c) =>
            c.id_critique === tempId ? { ...saved, is_owner: true } : c
          );
        });
        toast.success("Constructive critique submitted successfully!");
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
      toast.error(err.message || "Failed to submit critique.");
    } finally {
      submittingRef.current = false;
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
      toast.success("Critique deleted.");
    } catch (err) {
      setCritiques(prevCritiques);
      recalcStats(prevCritiques);
      toast.error(err.message || "Failed to delete critique.");
    }
  }

  // Deduplikasi tampilan unik berdasarkan id_critique
  const displayCritiques = useMemo(() => {
    const seen = new Set();
    return critiques.filter((c) => {
      if (!c?.id_critique || seen.has(c.id_critique)) return false;
      seen.add(c.id_critique);
      return true;
    });
  }, [critiques]);

  const containerClass = embedded
    ? "flex flex-col"
    : `flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-card ${className}`;

  return (
    <div className={containerClass}>
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
            Constructive Critique &amp; Feedback
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            {stats.total_critiques} Reviews
          </span>
          {!isOwner && (
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  toast.info("Please sign in or register to provide critique & feedback.");
                  return;
                }
                setIsFormOpen((prev) => !prev);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {isFormOpen ? (
                <>
                  <X size={12} /> Cancel
                </>
              ) : (
                <>
                  <Plus size={12} /> Add Critique
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan Skor 4 Pilar */}
      <div className="mt-3.5 rounded-2xl border border-gray-200 bg-stone-50/70 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-2xl font-extrabold text-stone-900">
              {stats.overall_avg > 0 ? stats.overall_avg.toFixed(1) : "—"}
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-stone-600">
                Community Average Score
              </span>
              <div className="flex items-center gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={12}
                    className={
                      star <= Math.round(stats.overall_avg)
                        ? "fill-current text-amber-500"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
            </div>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
            Scale 1 - 5
          </span>
        </div>

        {/* 4 Pilar Grid */}
        <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-gray-200/60 pt-3 sm:grid-cols-4">
          <ScorePill
            label="Composition"
            value={stats.avg_composition}
            color="text-blue-600"
          />
          <ScorePill
            label="Lighting"
            value={stats.avg_lighting}
            color="text-amber-500"
          />
          <ScorePill
            label="Color & Tone"
            value={stats.avg_color}
            color="text-emerald-600"
          />
          <ScorePill
            label="Concept"
            value={stats.avg_concept}
            color="text-sky-600"
          />
        </div>
      </div>

      {/* Catatan jika pemilik foto melihat panel ini */}
      {isOwner && (
        <p className="mt-2 text-center text-[11px] text-stone-500">
          Technical critiques from fellow photographers evaluate your framing, color grading, and concept.
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
            className="mt-3.5 overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/30 p-4"
          >
            <div className="flex items-center gap-1.5 pb-2.5 text-xs font-bold text-stone-900 border-b border-blue-100">
              <SlidersHorizontal size={14} className="text-blue-600" />
              <span>Submit 4-Pillar Constructive Critique</span>
            </div>

            {/* Input Slider / Rating 4 Pilar */}
            <div className="grid grid-cols-1 gap-2.5 py-3 sm:grid-cols-2">
              {PILLARS.map(({ key, label, hint }) => (
                <div
                  key={key}
                  className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900">{label}</span>
                    <span className="font-mono font-extrabold text-blue-600">
                      {formData[key]} / 5
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-0.5">{hint}</p>
                  <div className="mt-2 flex items-center justify-between gap-1.5">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, [key]: val }))
                        }
                        className={`flex h-7 flex-1 items-center justify-center rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          formData[key] === val
                            ? "bg-blue-600 text-white shadow-xs"
                            : formData[key] > val
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-gray-100 text-stone-600 hover:bg-gray-200"
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
            <div className="mt-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <ThumbsUp size={13} />
                <span>Strengths (What stands out technically &amp; artistically?)</span>
              </label>
              <textarea
                value={formData.strengths}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, strengths: e.target.value }))
                }
                rows={2}
                maxLength={2000}
                placeholder="e.g. Leading lines are impeccable and subject focus is pin-sharp with natural bokeh..."
                required
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-stone-900 placeholder:text-gray-400 shadow-2xs focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>

            {/* Saran Pengembangan */}
            <div className="mt-2.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                <Lightbulb size={13} />
                <span>Areas for Growth (What can be refined or improved?)</span>
              </label>
              <textarea
                value={formData.improvements}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, improvements: e.target.value }))
                }
                rows={2}
                maxLength={2000}
                placeholder="e.g. Highlight roll-off in the clouds is slightly clipped, consider recovering highlights in post..."
                required
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-stone-900 placeholder:text-gray-400 shadow-2xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
              />
            </div>

            <div className="mt-3.5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                <span>Submit Critique</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Daftar Kritik */}
      <div
        className={`my-3.5 flex flex-col gap-3 ${embedded ? "" : "max-h-80 overflow-y-auto pr-1"}`}
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <ApertureLoader size={22} />
          </div>
        ) : displayCritiques.length === 0 ? (
          <p className="py-6 text-center text-xs text-stone-400 italic">
            No technical reviews yet. Be the first photographer to provide constructive critique!
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {displayCritiques.map((c) => {
              const authorName = c.user?.username || "Critic";
              const authorAvatar = c.user?.avatar_url;
              const dateStr = c.created_at
                ? new Date(c.created_at).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                  })
                : "";
              const isCritiqueOwner = Boolean(
                c.is_owner || (user?.id_user && c.id_user === user.id_user)
              );
              const isAdmin = user?.role === "admin";
              const canDeleteCritique = isCritiqueOwner || isAdmin;

              return (
                <motion.div
                  key={c.id_critique}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 transition-colors hover:bg-gray-100/60"
                >
                  {/* Header Item */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-stone-900 text-[10px] font-bold text-white shadow-2xs">
                        {authorAvatar ? (
                          <Image
                            src={authorAvatar}
                            alt={authorName}
                            fill
                            sizes="28px"
                            className="object-cover"
                          />
                        ) : (
                          authorName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-xs font-bold text-stone-900">
                        {authorName}
                      </span>
                      <span className="text-[11px] text-stone-400">·</span>
                      <span className="text-[11px] text-stone-400">{dateStr}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 font-mono text-xs font-bold text-blue-700">
                        <Star size={10} className="fill-blue-600 text-blue-600" />
                        {Number(c.overall_score || 0).toFixed(1)}
                      </span>
                      {canDeleteCritique && !c.pending && (
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id_critique)}
                          aria-label={
                            isCritiqueOwner ? "Delete critique" : "Delete critique as admin"
                          }
                          title={
                            isCritiqueOwner ? "Delete critique" : "Moderate: delete as admin"
                          }
                          className={`transition-colors p-0.5 cursor-pointer ${
                            isCritiqueOwner
                              ? "text-stone-400 hover:text-red-600"
                              : "text-blue-500 hover:text-red-600"
                          }`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Micro Breakdown 4 Pilar */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5 font-mono text-[10px] text-stone-600">
                    <span className="rounded-md bg-white px-2 py-0.5 border border-gray-200">
                      Comp: <strong className="text-stone-900">{c.rating_composition}</strong>
                    </span>
                    <span className="rounded-md bg-white px-2 py-0.5 border border-gray-200">
                      Light: <strong className="text-stone-900">{c.rating_lighting}</strong>
                    </span>
                    <span className="rounded-md bg-white px-2 py-0.5 border border-gray-200">
                      Color: <strong className="text-stone-900">{c.rating_color}</strong>
                    </span>
                    <span className="rounded-md bg-white px-2 py-0.5 border border-gray-200">
                      Concept: <strong className="text-stone-900">{c.rating_concept}</strong>
                    </span>
                  </div>

                  {/* Poin Kekuatan */}
                  {c.strengths && (
                    <div className="mt-3 rounded-xl bg-emerald-50/80 p-3 text-xs border border-emerald-200/80">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px]">
                        <ThumbsUp size={12} className="text-emerald-600" />
                        <span>Visual Strengths</span>
                      </div>
                      <p className="mt-1 text-xs text-stone-800 leading-relaxed">
                        {c.strengths}
                      </p>
                    </div>
                  )}

                  {/* Saran Perbaikan */}
                  {c.improvements && (
                    <div className="mt-2 rounded-xl bg-blue-50/80 p-3 text-xs border border-blue-200/80">
                      <div className="flex items-center gap-1.5 font-bold text-blue-800 text-[11px]">
                        <Lightbulb size={12} className="text-blue-600" />
                        <span>Improvement Suggestions</span>
                      </div>
                      <p className="mt-1 text-xs text-stone-800 leading-relaxed">
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
    <div className="flex flex-col rounded-xl bg-white p-2.5 border border-gray-200 shadow-2xs">
      <span className="text-[10px] font-semibold text-stone-500 truncate">{label}</span>
      <span className={`font-mono text-sm font-extrabold ${color} mt-0.5`}>
        {value > 0 ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}

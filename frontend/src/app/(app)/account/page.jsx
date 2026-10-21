"use client";

// src/app/account/page.jsx
// ACCOUNT: GET /api/auth/me + kelola kategori (GET/POST/DELETE) + upload
// foto profil (PUT /auth/profile-picture) + hapus foto (DELETE /photos/:id).
// Semua logika lama dipertahankan. UI: header profil dengan avatar ring
// gradient + tombol Logout, kartu statistik count-up, kategori, dan grid
// "My photos" masonry dengan konfirmasi hapus via modal custom.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, FolderPlus, ImagePlus, LogOut, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import {
  getToken,
  getMe,
  listCategories,
  createCategory,
  deleteCategory,
  listPhotos,
  deletePhoto,
  uploadProfilePicture,
} from "@/lib/api";
import { buildCloudinaryUrl } from "@/lib/cloudinary";
import { useAuth } from "@/context/AuthContext";
import PhotoCard from "@/components/PhotoCard";
import MasonryGrid from "@/components/MasonryGrid";
import Lightbox from "@/components/Lightbox";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import PillBadge from "@/components/ui/PillBadge";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  CountUp,
  PageTransition,
  Reveal,
  RevealGroup,
  SpotlightCard,
  WordReveal,
} from "@/components/ui/Motion";
import { fadeUp } from "@/components/ui/motion";

export default function AccountPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [newName, setNewName] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState("");
  const profilePreviewUrlRef = useRef("");
  const profileInputRef = useRef(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  // LOAD: profil + categories + my photos.
  // fetchAll tidak menyentuh setState, jadi aman dipanggil dari effect
  // maupun event handler (aturan react-hooks/set-state-in-effect).
  const fetchAll = useCallback(
    () => Promise.all([getMe(), listCategories(), listPhotos({ feed: "my" })]),
    [],
  );

  const onData = useCallback(([me, cats, ph]) => {
    setProfile(me.data);
    setCategories(cats.data || []);
    setPhotos(ph.data || []);
  }, []);

  const onError = useCallback(
    (err) => {
      if (err.status === 401) router.replace("/login");
      else setError(err.message);
    },
    [router],
  );

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    fetchAll()
      .then(onData)
      .catch(onError)
      .finally(() => setLoading(false));
  }, [router, fetchAll, onData, onError]);

  // Retry manual dari event handler.
  function retryLoad() {
    setError("");
    setLoading(true);
    fetchAll()
      .then(onData)
      .catch(onError)
      .finally(() => setLoading(false));
  }

  // Bersihkan blob URL profil saat unmount.
  useEffect(() => {
    return () => {
      if (profilePreviewUrlRef.current) {
        URL.revokeObjectURL(profilePreviewUrlRef.current);
      }
    };
  }, []);

  function clearProfilePreview() {
    if (profilePreviewUrlRef.current) {
      URL.revokeObjectURL(profilePreviewUrlRef.current);
      profilePreviewUrlRef.current = "";
    }
    setProfilePreview("");
  }

  function openAvatarModal() {
    setAvatarError("");
    setAvatarModalOpen(true);
  }

  function closeAvatarModal() {
    if (profileBusy) return;
    setAvatarModalOpen(false);
    setProfileFile(null);
    clearProfilePreview();
    setAvatarError("");
  }

  function handleAvatarSelect(selectedFile) {
    setAvatarError("");
    if (!selectedFile) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setAvatarError("Please use a JPG, PNG, WEBP, or GIF image.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setAvatarError("Profile image size must be under 5MB.");
      return;
    }

    setProfileFile(selectedFile);
    clearProfilePreview();
    const objectUrl = URL.createObjectURL(selectedFile);
    profilePreviewUrlRef.current = objectUrl;
    setProfilePreview(objectUrl);
  }

  async function handleProfilePictureSubmit(event) {
    if (event) event.preventDefault();
    setAvatarError("");

    if (!profileFile) {
      setAvatarError("Please choose a profile image first.");
      return;
    }

    setProfileBusy(true);
    try {
      const formData = new FormData();
      formData.append("image", profileFile);
      const response = await uploadProfilePicture(formData);
      setProfile((current) => ({
        ...current,
        profile_picture_url: response.data.profile_picture_url,
      }));
      setProfileFile(null);
      clearProfilePreview();
      setAvatarModalOpen(false);
      toast.success("Profile picture updated successfully.");
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      setAvatarError(err.errors?.join(", ") || err.message);
    } finally {
      setProfileBusy(false);
    }
  }

  // CREATE kategori: POST /api/categories
  async function handleAdd(e) {
    e.preventDefault();
    setCategoryError("");
    if (!newName.trim()) return;
    try {
      const res = await createCategory(newName.trim());
      setCategories((prev) => [...prev, res.data]);
      setNewName("");
      toast.success("Category added.");
    } catch (err) {
      setCategoryError(err.message);
    }
  }

  // DELETE kategori: DELETE /api/categories/:id
  async function handleDeleteCategory(id) {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id_category !== id));
      toast.success("Category deleted.");
    } catch (err) {
      toast.error(err.message);
    }
  }

  // DELETE foto: DELETE /api/photos/:id (modal custom, bukan confirm())
  async function handleDeleteConfirmed() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deletePhoto(pendingDelete.id_photo);
      setPhotos((prev) => prev.filter((p) => p.id_photo !== pendingDelete.id_photo));
      toast.success(`"${pendingDelete.title}" deleted.`);
      setPendingDelete(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // Upload terakhir = created_at paling baru (bukan asumsi urutan array).
  const latestUpload = useMemo(() => {
    const times = photos
      .map((p) => (p.created_at ? new Date(p.created_at).getTime() : 0))
      .filter((t) => !Number.isNaN(t) && t > 0);
    if (times.length === 0) return "—";
    return new Date(Math.max(...times)).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [photos]);

  const stats = useMemo(
    () => [
      { label: "Total Photos", value: photos.length },
      { label: "Categories", value: categories.length },
      { label: "Latest Upload", text: latestUpload },
    ],
    [photos.length, categories.length, latestUpload],
  );

  // ====== SKELETON LOADING ======
  if (loading) {
    return (
      <PageTransition>
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-4 w-56" />
            </div>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
            {[280, 200, 240, 180].map((h, i) => (
              <Skeleton key={i} className="mb-4 break-inside-avoid" style={{ height: h }} />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!profile) {
    return (
      <PageTransition>
        <div className="mx-auto w-full max-w-6xl flex-1 flex-col items-center gap-4 px-4 py-24 text-center">
          <p className="text-sm text-danger" role="alert">
            {error || "Unable to load profile."}
          </p>
          <Button variant="ghost" onClick={retryLoad}>
            Try again
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-10">
        {/* ============ HEADER PROFIL ============ */}
        <Reveal>
          <section className="relative overflow-hidden">
            {/* Glow sebagai anak (pointer-events:none tidak di-inherit) */}
            <div aria-hidden="true" className="hero-glow" />
            <div className="relative flex flex-wrap items-center gap-4">
              {/* Avatar dengan ring gradient brand baru + trigger modal upload */}
              <div className="relative shrink-0 group">
                <button
                  type="button"
                  onClick={openAvatarModal}
                  aria-label="Change profile picture"
                  className="relative block h-20 w-20 sm:h-24 sm:w-24 rounded-full p-[2.5px] bg-gradient-to-tr from-[#D62B2B] via-[#16A34A] to-[#2563EB] shadow-card transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <div className="relative h-full w-full rounded-full bg-[#FFFDF6] p-[2px] overflow-hidden">
                    {profile.profile_picture_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={buildCloudinaryUrl(profile.profile_picture_url, {
                          width: 256,
                          crop: "fill",
                        })}
                        alt="Profile picture"
                        className="h-full w-full rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#F5EFE6] text-2xl sm:text-3xl font-extrabold text-stone-800">
                        {profile.username?.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Hover Camera Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-[1px]">
                      <Camera size={18} />
                      <span className="mt-0.5 text-[10px] font-medium tracking-tight">Edit</span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={openAvatarModal}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-[#DCD0BE] bg-[#FFFDF6] text-stone-700 shadow-sm transition-all hover:bg-stone-100 hover:text-stone-900 hover:scale-110"
                  title="Change avatar"
                  aria-label="Change avatar button"
                >
                  <Camera size={13} />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <PillBadge>Your vault</PillBadge>
                  {profile.role === "admin" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                      <ShieldCheck size={11} />
                      Admin
                    </span>
                  )}
                </div>
                <h1 className="mt-2 truncate text-xl font-semibold tracking-tight text-ink">
                  {profile.username}
                </h1>
                <p className="mt-0.5 truncate text-sm text-muted">{profile.email}</p>
                {error && (
                  <p className="mt-2 text-sm text-danger" role="alert">
                    {error}
                  </p>
                )}
              </div>

              {/* Logout di halaman Account (sesuai spesifikasi) */}
              <Button variant="ghost" size="sm" onClick={logout} className="shrink-0">
                <LogOut size={14} />
                Logout
              </Button>
            </div>
          </section>
        </Reveal>

        {/* ============ STATISTIK (count-up) ============ */}
        <RevealGroup className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp}>
              <SpotlightCard className="rounded-[var(--radius-md)] border border-line bg-[var(--bg-elevated)] p-5 shadow-card">
                <p className="text-xs uppercase tracking-wider text-faint">{s.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                  {s.text !== undefined ? <span>{s.text}</span> : <CountUp value={s.value} />}
                </p>
              </SpotlightCard>
            </motion.div>
          ))}
        </RevealGroup>

        {/* ============ KATEGORI (Khusus Admin) ============ */}
        {profile.role === "admin" && (
          <Reveal>
            <section className="mt-14">
              <div className="flex items-center gap-2">
                <h2 className="display-2 text-xl!">Categories</h2>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  Admin Manage
                </span>
              </div>
              <form onSubmit={handleAdd} className="mt-4 flex max-w-md gap-2">
                <div className="relative flex-1">
                  <FolderPlus
                    size={15}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint"
                  />
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New category name"
                    aria-label="New category name"
                    className="w-full rounded-full border border-line bg-[var(--bg-elevated)] py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none"
                  />
                </div>
                <Button type="submit" size="sm">
                  Add
                </Button>
              </form>
              {categoryError && (
                <p className="mt-2 text-sm text-danger" role="alert">
                  {categoryError}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span
                    key={c.id_category}
                    className="group inline-flex items-center gap-2 rounded-full border border-line bg-[var(--bg-elevated)] px-4 py-1.5 text-xs text-muted transition-colors hover:border-white/25 hover:text-ink"
                  >
                    {c.name}
                    <button
                      onClick={() => handleDeleteCategory(c.id_category)}
                      aria-label={`Delete category ${c.name}`}
                      className="text-faint transition-colors hover:text-[var(--danger)]"
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-faint">
                    No categories yet — add one to start organizing.
                  </p>
                )}
              </div>
            </section>
          </Reveal>
        )}

        {/* ============ MY PHOTOS ============ */}
        <section className="mt-14">
          <div className="flex items-end justify-between">
            <WordReveal
              as="h2"
              text="My photos"
              accentWord="photos"
              className="display-2 text-2xl!"
            />
            <Link
              href="/addphoto"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs text-ink transition-colors hover:border-white/40"
            >
              <ImagePlus size={14} />
              Add Photo
            </Link>
          </div>

          {photos.length === 0 ? (
            <div className="mt-8 flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-white/10 py-16 text-center">
              <ImagePlus size={24} className="text-faint" />
              <p className="text-sm text-muted">No photos in your vault yet.</p>
              <Link href="/addphoto" className="text-sm text-accent hover:underline">
                Upload your first work →
              </Link>
            </div>
          ) : (
            <MasonryGrid className="mt-6">
              {photos.map((p) => (
                <PhotoCard
                  key={p.id_photo}
                  photo={p}
                  layoutId="account-photo"
                  onOpen={setSelected}
                  onDelete={setPendingDelete}
                  showActions
                />
              ))}
            </MasonryGrid>
          )}
        </section>
      </div>

      {/* ============ LIGHTBOX & MODAL HAPUS ============ */}
      <AnimatePresence>
        {selected && (
          <Lightbox
            photo={photos.find((p) => p.id_photo === selected.id_photo) || selected}
            layoutId="account-photo"
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        labelledBy="delete-photo-title"
      >
        <h2 id="delete-photo-title" className="display-2 text-lg!">
          Delete this photo?
        </h2>
        <p className="mt-2 text-sm text-muted">
          &ldquo;{pendingDelete?.title}&rdquo; will be permanently deleted along with its file.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDeleteConfirmed}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* ============ MODAL UPLOAD FOTO PROFIL ============ */}
      <Modal
        open={avatarModalOpen}
        onClose={closeAvatarModal}
        labelledBy="avatar-modal-title"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5EFE6] text-stone-800 border border-[#E8DEC9]">
            <Camera size={22} className="text-stone-700" />
          </div>

          <h2 id="avatar-modal-title" className="mt-3 text-lg font-bold text-stone-900 tracking-tight">
            Update Profile Picture
          </h2>
          <p className="mt-1 text-xs text-stone-500 max-w-xs">
            Upload a high-resolution photo for your creator profile and critique reviews.
          </p>

          {/* Avatar Preview Stage */}
          <div className="relative mt-6 flex flex-col items-center">
            <div className="relative h-28 w-28 rounded-full border-4 border-[#FFFDF6] bg-[#F5EFE6] p-1 shadow-card overflow-hidden ring-2 ring-[#E8DEC9]">
              {profilePreview || profile.profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    profilePreview ||
                    buildCloudinaryUrl(profile.profile_picture_url, {
                      width: 256,
                      crop: "fill",
                    })
                  }
                  alt="Preview"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-[#EFE7D8] text-3xl font-extrabold text-stone-700">
                  {profile.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {profileFile && (
              <span className="mt-2 text-[11px] font-medium text-stone-600 truncate max-w-[220px]">
                {profileFile.name} ({(profileFile.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            )}
          </div>

          {/* Error Message */}
          {avatarError && (
            <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg w-full" role="alert">
              {avatarError}
            </p>
          )}

          {/* Dropzone / File Picker */}
          <div className="mt-5 w-full">
            <input
              ref={profileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                handleAvatarSelect(e.target.files?.[0] || null);
                e.target.value = "";
              }}
              className="sr-only"
            />

            <div
              onClick={() => profileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleAvatarSelect(e.dataTransfer.files?.[0] || null);
              }}
              className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#DCD0BE] bg-[#F8F3E8]/60 p-5 cursor-pointer transition-all hover:border-blue-500 hover:bg-[#F5EFE6]"
            >
              <UploadCloud size={24} className="text-stone-400 transition-colors group-hover:text-blue-600" />
              <p className="mt-2 text-xs font-semibold text-stone-700 group-hover:text-stone-900">
                {profileFile ? "Choose a different image" : "Click to browse or drag & drop"}
              </p>
              <p className="mt-0.5 text-[10px] text-stone-400">
                JPG, PNG, WEBP, or GIF (max 5MB)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex w-full gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={closeAvatarModal}
              disabled={profileBusy}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleProfilePictureSubmit}
              disabled={!profileFile || profileBusy}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              {profileBusy ? "Saving..." : "Save Avatar"}
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}

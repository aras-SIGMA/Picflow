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
import { FolderPlus, ImagePlus, LogOut, Trash2 } from "lucide-react";
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
  const [profileBusy, setProfileBusy] = useState(false);
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

  function handleProfileFileChange(event) {
    const selectedFile = event.target.files?.[0] || null;
    setError("");

    if (!selectedFile) {
      setProfileFile(null);
      clearProfilePreview();
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setProfileFile(null);
      clearProfilePreview();
      event.target.value = "";
      setError("Gunakan gambar JPG, PNG, WEBP, atau GIF.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setProfileFile(null);
      clearProfilePreview();
      event.target.value = "";
      setError("Ukuran gambar maksimal 5MB.");
      return;
    }

    setProfileFile(selectedFile);
    clearProfilePreview();
    const objectUrl = URL.createObjectURL(selectedFile);
    profilePreviewUrlRef.current = objectUrl;
    setProfilePreview(objectUrl);
  }

  async function handleProfilePictureSubmit(event) {
    event.preventDefault();
    setError("");

    if (!profileFile) {
      setError("Pilih gambar profil terlebih dahulu.");
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
      toast.success("Foto profil berhasil diperbarui.");
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      setError(err.errors?.join(", ") || err.message);
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
      toast.success("Kategori ditambahkan.");
    } catch (err) {
      setCategoryError(err.message);
    }
  }

  // DELETE kategori: DELETE /api/categories/:id
  async function handleDeleteCategory(id) {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id_category !== id));
      toast.success("Kategori dihapus.");
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
      toast.success(`"${pendingDelete.title}" dihapus.`);
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
      { label: "Total foto", value: photos.length },
      { label: "Kategori", value: categories.length },
      { label: "Upload terakhir", text: latestUpload },
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
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-4 px-4 py-24 text-center">
          <p className="text-sm text-danger" role="alert">
            {error || "Profil tidak dapat dimuat."}
          </p>
          <Button variant="ghost" onClick={retryLoad}>
            Coba lagi
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
              {/* Avatar dengan ring gradient + upload foto profil */}
              <form onSubmit={handleProfilePictureSubmit} className="group relative shrink-0">
                <div className="rounded-full bg-gradient-to-tr from-[var(--accent)] via-[var(--accent-2)] to-transparent p-[2px]">
                  <div className="rounded-full bg-[var(--bg)] p-[2px]">
                    {profilePreview || profile.profile_picture_url ? (
                      // Preview blob & URL Cloudinary memakai img biasa.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          profilePreview ||
                          buildCloudinaryUrl(profile.profile_picture_url, {
                            width: 128,
                            crop: "fill",
                          })
                        }
                        alt="Foto profil"
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface)] text-lg font-bold text-ink">
                        {profile.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <label
                  htmlFor="profile-picture"
                  className="absolute -bottom-1 -right-1 cursor-pointer rounded-full border border-line bg-[var(--surface)] px-2.5 py-1 text-[10px] font-medium text-muted transition-colors hover:text-ink"
                >
                  {profileBusy ? "..." : "Ubah"}
                </label>
                <input
                  id="profile-picture"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleProfileFileChange}
                  className="sr-only"
                />
                {profileFile && (
                  <button
                    type="submit"
                    disabled={profileBusy}
                    className="absolute -top-1 -right-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-black disabled:opacity-50"
                  >
                    {profileBusy ? "..." : "Simpan"}
                  </button>
                )}
              </form>

              <div className="min-w-0 flex-1">
                <PillBadge>Your vault</PillBadge>
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
              <SpotlightCard className="rounded-[var(--radius-md)] border border-line bg-[var(--bg-elevated)] p-5">
                <p className="text-xs uppercase tracking-wider text-faint">{s.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                  {s.text !== undefined ? <span>{s.text}</span> : <CountUp value={s.value} />}
                </p>
              </SpotlightCard>
            </motion.div>
          ))}
        </RevealGroup>

        {/* ============ KATEGORI ============ */}
        <Reveal>
          <section className="mt-14">
            <h2 className="display-2 text-xl!">Kategori</h2>
            <form onSubmit={handleAdd} className="mt-4 flex max-w-md gap-2">
              <div className="relative flex-1">
                <FolderPlus
                  size={15}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint"
                />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nama kategori baru"
                  aria-label="Nama kategori baru"
                  className="w-full rounded-full border border-line bg-[var(--bg-elevated)] py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none"
                />
              </div>
              <Button type="submit" size="sm">
                Tambah
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
                    aria-label={`Hapus kategori ${c.name}`}
                    className="text-faint transition-colors hover:text-[var(--danger)]"
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-faint">
                  Belum ada kategori — tambah satu untuk mulai merapikan.
                </p>
              )}
            </div>
          </section>
        </Reveal>

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
              Tambah
            </Link>
          </div>

          {photos.length === 0 ? (
            <div className="mt-8 flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-white/10 py-16 text-center">
              <ImagePlus size={24} className="text-faint" />
              <p className="text-sm text-muted">Belum ada foto di vault-mu.</p>
              <Link href="/addphoto" className="text-sm text-accent hover:underline">
                Upload karya pertamamu →
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
          Hapus foto ini?
        </h2>
        <p className="mt-2 text-sm text-muted">
          &ldquo;{pendingDelete?.title}&rdquo; akan dihapus permanen beserta filenya.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>
            Batal
          </Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDeleteConfirmed}>
            Hapus
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}

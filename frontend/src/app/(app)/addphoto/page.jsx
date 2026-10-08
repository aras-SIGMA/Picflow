"use client";

// src/app/addphoto/page.jsx
// ADD/EDIT: POST /api/photos (FormData + file image) atau PUT /api/photos/:id.
// ?id=xxx = mode edit (useSearchParams wajib dalam Suspense di Next 16).
// UI: dua kolom (dropzone + form), floating label, counter karakter,
// validasi inline (bukan alert), shutter flash saat sukses.
// Logika tidak berubah dari versi sebelumnya.
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Image as ImageIcon } from "lucide-react";
import {
  getToken,
  listCategories,
  getPhoto,
  createPhoto,
  updatePhoto,
  fileUrl,
} from "@/lib/api";
import Dropzone from "@/components/ui/Dropzone";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import PillBadge from "@/components/ui/PillBadge";
import ApertureLoader from "@/components/ui/ApertureLoader";
import { useToast } from "@/components/ui/Toast";
import { EASE } from "@/components/ui/motion";
import { PageTransition, WordReveal } from "@/components/ui/Motion";

const DESC_MAX = 300;

function AddPhotoForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const editId = params.get("id");

  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState("");
  const [idCategory, setIdCategory] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const previewUrlRef = useRef("");
  const [oldImage, setOldImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);

  // LOAD: categories + kalau edit, isi form dari GET /photos/:id
  useEffect(() => {
    let active = true;

    async function load() {
      if (!getToken()) {
        router.replace("/login");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const [categoryResponse, photoResponse] = await Promise.all([
          listCategories(),
          editId ? getPhoto(editId) : Promise.resolve(null),
        ]);

        if (!active) return;
        setCategories(categoryResponse.data || []);
        if (photoResponse) {
          setTitle(photoResponse.data.title);
          setIdCategory(String(photoResponse.data.id_category));
          setDescription(photoResponse.data.description || "");
          setOldImage(fileUrl(photoResponse.data.image_url));
        }
      } catch (err) {
        if (err.status === 401) router.replace("/login");
        else if (active) setError(err.errors?.join(", ") || err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [editId, router]);

  // Bersihkan blob URL saat unmount.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function clearPreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setPreviewUrl("");
  }

  // Handler dari Dropzone: file boleh null (berarti hapus pilihan).
  function handleFileChange(selectedFile, validationError) {
    setError(validationError || "");
    if (validationError) return;
    clearPreview();
    if (!selectedFile) {
      setFile(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setFile(selectedFile);
  }

  const titleInvalid = submitted && !title.trim();
  const categoryInvalid = submitted && !idCategory;
  const imageInvalid = submitted && !editId && !file;
  const canSubmit =
    Boolean(title.trim()) && Boolean(idCategory) && Boolean(editId || file);

  // SAVE: kirim FormData (title, id_category, description, image?)
  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitted(true);
    if (!title.trim() || !idCategory || (!editId && !file)) return;

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("id_category", idCategory);
      if (description) fd.append("description", description);
      if (file) fd.append("image", file);
      if (editId) await updatePhoto(editId, fd);
      else await createPhoto(fd);

      // Sukses: toast + shutter flash singkat lalu ke galeri (perilaku lama).
      toast.success(editId ? "Foto berhasil diperbarui." : "Foto berhasil diunggah.");
      setFlash(true);
      setTimeout(() => router.push("/home"), 1000);
    } catch (err) {
      setError(err.errors?.join(", ") || err.message);
      setBusy(false);
    }
  }

  // ====== LOADING ======
  if (loading) {
    return (
      <PageTransition>
        <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-24">
          <div className="flex flex-col items-center gap-4">
            <ApertureLoader size={30} />
            <p className="text-sm text-muted">Memuat form...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      {/* Shutter flash + centang saat sukses */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-white"
          >
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4, ease: EASE }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-white"
            >
              <Check size={28} />
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-14">
        <PillBadge dotColor={editId ? "bg-[var(--accent-2)]" : "bg-[var(--success)]"}>
          {editId ? "Editing existing work" : "New work"}
        </PillBadge>
        <WordReveal
          as="h1"
          text={editId ? "Refine the frame." : "Add a new shot."}
          accentWord={editId ? "frame" : "shot"}
          className="display-1 mt-5"
        />

        <form onSubmit={onSubmit} className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Kiri: dropzone / preview */}
          <div>
            <Dropzone
              file={file}
              onFileChange={handleFileChange}
              previewUrl={previewUrl}
              oldImage={oldImage}
              label={
                editId ? "Ganti gambar (opsional)" : "Tarik & lepas gambarmu di sini"
              }
            />
            <p className={`mt-3 text-xs ${imageInvalid ? "text-danger" : "text-faint"}`}>
              {imageInvalid
                ? "File gambar wajib dipilih."
                : file
                  ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`
                  : editId
                    ? "Biarkan kosong jika tidak ingin mengganti gambar."
                    : "JPG, PNG, WEBP, atau GIF · maksimal 5MB."}
            </p>
          </div>

          {/* Kanan: form */}
          <div className="flex flex-col gap-5">
            <Field label="Title" error={titleInvalid ? "Title wajib diisi." : null}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>

            <div>
              <p className="mb-2 text-xs font-medium text-muted">Category</p>
              <Select
                id="photo-category"
                label="Category"
                value={idCategory}
                onChange={(v) => setIdCategory(v)}
                placeholder="Pilih kategori"
                required
                error={categoryInvalid ? "Kategori wajib dipilih." : null}
                options={categories.map((c) => ({
                  value: String(c.id_category),
                  label: c.name,
                }))}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="photo-desc" className="text-xs font-medium text-muted">
                  Description <span className="text-faint">(opsional)</span>
                </label>
                <span
                  className={`text-xs ${description.length >= DESC_MAX ? "text-danger" : "text-faint"}`}
                >
                  {description.length}/{DESC_MAX}
                </span>
              </div>
              <textarea
                id="photo-desc"
                rows={4}
                maxLength={DESC_MAX}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ceritakan konteks foto ini..."
                className="w-full rounded-[var(--radius-sm)] border border-line bg-[var(--bg-elevated)] px-4 py-3 text-sm text-ink placeholder:text-faint transition-colors focus:border-accent focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}

            <div className="mt-2 flex items-center gap-3">
              <Button
                type="submit"
                loading={busy}
                magnetic
                disabled={!canSubmit && submitted}
              >
                {busy ? "Menyimpan..." : editId ? "Update foto" : "Upload foto"}
              </Button>
              <button
                type="button"
                onClick={() => router.push("/home")}
                className="text-sm text-muted transition-colors hover:text-ink"
              >
                Batal
              </button>
            </div>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}

export default function AddPhotoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
          <ApertureLoader size={30} />
          <p className="text-sm text-muted">Memuat form...</p>
        </div>
      }
    >
      <AddPhotoForm />
    </Suspense>
  );
}

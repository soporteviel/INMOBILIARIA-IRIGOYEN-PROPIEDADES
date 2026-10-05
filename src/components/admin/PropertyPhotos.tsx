"use client";

import { MAX_PROPERTY_PHOTOS, MAX_UPLOAD_BYTES, PHOTO_UPLOAD_CONCURRENCY, isAcceptedPhotoType, unsupportedPhotoMessage } from "@/lib/photos/limits";
import { devEvent, devTiming } from "@/lib/dev/timing";
import { fitPhotoFile } from "@/lib/photos/fit-client";
import { App, Button, Modal, Progress } from "antd";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

function TileIcon({ kind, filled = false }: { kind: "close" | "left" | "right" | "star"; filled?: boolean }) {
  if (kind === "star") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill={filled ? "currentColor" : "none"}>
        <path
          d="m8 2.2 1.6 3.3 3.6.5-2.6 2.5.6 3.6L8 10.4 4.8 12.1l.6-3.6L2.8 6l3.6-.5L8 2.2Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  const path =
    kind === "close"
      ? "M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8"
      : kind === "left"
        ? "M9.5 3.8 5.3 8l4.2 4.2"
        : "M6.5 3.8 10.7 8 6.5 12.2";
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="none">
      <path d={path} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

type PhotoItem = {
  key: string;
  name: string;
  serverId?: string;
  reservedId?: string;
  file?: File;
  previewUrl: string;
  ownedUrl: boolean;
  invalid: boolean;
  error?: string;
  phase: "ready" | "new" | "uploading" | "processing" | "error";
  progress: number;
};

type PhotoDraft = {
  items: PhotoItem[];
  coverKey: string | null;
  pendingDeletes: string[];
};

export type PhotoSummary = {
  total: number;
  pending: boolean;
  coverUrl: string | null;
  thumbs: { key: string; url: string; cover: boolean }[];
  message: string | null;
  load: "idle" | "loading" | "ready" | "error";
};

export type PropertyPhotosHandle = {
  hasUnsaved: () => boolean;
  invalidMessage: () => string | null;
  summary: () => PhotoSummary;
  reload: () => void;
  open: (returnFocus?: HTMLElement | null) => void;
  uploadCommitted: (
    propertyId: string,
    onProgress: (done: number, total: number, failed: number) => void,
    options?: { refreshPublic?: boolean; filesOnly?: boolean },
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
};

function fileProblem(file: File) {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif" || /\.(heic|heif)$/i.test(file.name)) {
    return unsupportedPhotoMessage(file.name);
  }
  if (!isAcceptedPhotoType(type)) {
    return "Solo se aceptan JPEG, PNG y WebP. HEIC no está soportado.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "La foto supera los 15 MB.";
  }
  if (file.size <= 0) {
    return "El archivo está vacío.";
  }
  return null;
}

async function readError(response: Response) {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return body?.message || "No se pudo completar la operación.";
}

function putFile(url: string, file: File, contentType: string, onProgress: (value: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error("No se pudo subir la foto."));
    };
    xhr.onerror = () => reject(new Error("No se pudo subir la foto."));
    xhr.send(file);
  });
}

function cloneDraft(draft: PhotoDraft): PhotoDraft {
  return {
    items: draft.items.map((item) => ({ ...item })),
    coverKey: draft.coverKey,
    pendingDeletes: [...draft.pendingDeletes],
  };
}

function emptyDraft(): PhotoDraft {
  return { items: [], coverKey: null, pendingDeletes: [] };
}

export const PropertyPhotos = forwardRef<
  PropertyPhotosHandle,
  {
    propertyId: string | null;
    onChange: (summary: PhotoSummary) => void;
  }
>(function PropertyPhotos({ propertyId, onChange }, ref) {
  const { modal } = App.useApp();
  const committedRef = useRef<PhotoDraft>(emptyDraft());
  const baselineRef = useRef({ order: "", coverId: "" });
  const [draft, setDraft] = useState<PhotoDraft | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const createdUrls = useRef(new Set<string>());
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadRef = useRef<PhotoSummary["load"]>("idle");
  const uploadingRef = useRef(false);
  const uploadRef = useRef<PropertyPhotosHandle["uploadCommitted"] | null>(null);
  const tailRef = useRef(Promise.resolve());
  const [reloadToken, setReloadToken] = useState(0);

  function summaryOf(source: PhotoDraft, note = message): PhotoSummary {
    const cover = source.items.find((item) => item.key === source.coverKey);
    const pending =
      source.pendingDeletes.length > 0 ||
      source.items.some((item) => !item.serverId || item.phase === "error") ||
      source.items.flatMap((item) => (item.serverId ? [item.serverId] : [])).join(",") !== baselineRef.current.order ||
      (cover?.serverId ?? "") !== baselineRef.current.coverId;
    const problems = source.items
      .filter((item) => item.error)
      .map((item) => `${item.name}: ${item.error}`)
      .join(" ");
    return {
      total: source.items.length,
      pending,
      coverUrl: cover?.previewUrl || null,
      thumbs: source.items.map((item) => ({
        key: item.key,
        url: item.previewUrl,
        cover: item.key === source.coverKey,
      })),
      message: note ?? (problems || null),
      load: loadRef.current,
    };
  }

  function remember(next: PhotoDraft, note = message) {
    committedRef.current = next;
    onChange(summaryOf(next, note));
  }

  useEffect(() => {
    return () => {
      for (const item of committedRef.current.items) {
        if (item.ownedUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!propertyId) {
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    let active = true;
    let settled = false;
    loadRef.current = "loading";
    devEvent("fotos-estado", "loading");
    devEvent("fotos", "solicitud-inicio", propertyId);
    onChange(summaryOf(committedRef.current, null));
    const started = performance.now();
    void fetch(`/api/admin/propiedades/${propertyId}/fotos`, { signal: controller.signal })
      .then(async (response) => {
        if (!active) {
          return;
        }
        settled = true;
        if (!response.ok) {
          const note = await readError(response);
          loadRef.current = "error";
          devTiming("fotos", "solicitud-fin", started, `http ${response.status}`);
          devEvent("fotos-estado", "error");
          setMessage(note);
          onChange(summaryOf(committedRef.current, note));
          return;
        }
        const body = (await response.json()) as { photos?: unknown };
        if (!active) {
          return;
        }
        if (!body || !Array.isArray(body.photos)) {
          loadRef.current = "error";
          devTiming("fotos", "solicitud-fin", started, "formato");
          devEvent("fotos-estado", "error");
          const note = "La respuesta de fotos no tiene el formato esperado.";
          setMessage(note);
          onChange(summaryOf(committedRef.current, note));
          return;
        }
        const photos = body.photos as { id: string; isCover: boolean; previewUrl: string | null; status: string }[];
        const items: PhotoItem[] = photos
          .filter((photo) => photo.status === "ready" || photo.status === "pending")
          .map((photo) => ({
            key: photo.id,
            name: photo.isCover ? "Portada" : "Foto",
            serverId: photo.status === "ready" ? photo.id : undefined,
            reservedId: photo.status === "pending" ? photo.id : undefined,
            previewUrl: photo.previewUrl ?? "",
            ownedUrl: false,
            invalid: false,
            phase: photo.status === "ready" ? "ready" : "error",
            error: photo.status === "pending" ? "Esta foto quedó sin terminar. Volvé a elegir el archivo para reintentar." : undefined,
            progress: photo.status === "ready" ? 100 : 0,
          }));
        loadRef.current = "ready";
        devTiming("fotos", "solicitud-fin", started, `200 ${items.length}`);
        devEvent("fotos-estado", "ready");
        if (committedRef.current.items.some((item) => item.ownedUrl) || committedRef.current.pendingDeletes.length > 0) {
          const known = new Set(
            committedRef.current.items.flatMap((item) =>
              [item.key, item.serverId, item.reservedId].filter((value): value is string => Boolean(value)),
            ),
          );
          const missing = items.filter(
            (item) => !known.has(item.key) && !known.has(item.serverId ?? "") && !known.has(item.reservedId ?? ""),
          );
          if (missing.length > 0) {
            remember({ ...cloneDraft(committedRef.current), items: [...committedRef.current.items, ...missing] }, null);
            return;
          }
          onChange(summaryOf(committedRef.current, null));
          return;
        }
        const kept: PhotoItem[] = [];
        for (const item of items) {
          if (!item.reservedId || !propertyId) {
            kept.push(item);
            continue;
          }
          const released = await fetch(`/api/admin/propiedades/${propertyId}/fotos/${item.reservedId}`, { method: "DELETE" });
          if (!released.ok && released.status !== 502) {
            kept.push(item);
          }
        }
        if (!active) {
          return;
        }
        const cover = photos.find((photo) => photo.isCover && kept.some((item) => item.serverId === photo.id))?.id ?? null;
        baselineRef.current = {
          order: kept.flatMap((item) => (item.serverId ? [item.serverId] : [])).join(","),
          coverId: cover ?? "",
        };
        remember({ items: kept, coverKey: cover, pendingDeletes: [] }, null);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        settled = true;
        const aborted = error instanceof DOMException && error.name === "AbortError";
        loadRef.current = "error";
        const note = aborted
          ? "La carga de fotos tardó demasiado. Podés reintentar."
          : "No se pudieron cargar las fotos.";
        devEvent("fotos", aborted ? "solicitud-cancelada" : "solicitud-error", note);
        devEvent("fotos-estado", "error");
        setMessage(note);
        onChange(summaryOf(committedRef.current, note));
      });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      if (!settled) {
        controller.abort();
        devEvent("fotos", "solicitud-cancelada", "cleanup");
      }
    };
    // La carga se repite solo al cambiar la propiedad o al reintentar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, reloadToken]);

  function unsaved(source: PhotoDraft) {
    return summaryOf(source).pending;
  }

  function knownPhotoIds() {
    return committedRef.current.items.flatMap((item) => {
      const id = item.serverId ?? item.reservedId;
      return id ? [id] : [];
    });
  }

  async function idsInClientOrder(targetPropertyId: string) {
    const known = knownPhotoIds();
    const response = await fetch(`/api/admin/propiedades/${targetPropertyId}/fotos`);
    if (!response.ok) {
      return { known, ids: known };
    }
    const body = (await response.json().catch(() => null)) as { photos?: { id?: string; status?: string }[] } | null;
    const remote = Array.isArray(body?.photos) ? body.photos : [];
    const seen = new Set(known);
    const extras = remote.flatMap((photo) => {
      if (!photo.id || seen.has(photo.id) || (photo.status !== "ready" && photo.status !== "pending")) {
        return [];
      }
      return [photo.id];
    });
    return { known, ids: [...known, ...extras] };
  }

  async function uploadOne(targetPropertyId: string, item: PhotoItem, patch: (next: Partial<PhotoItem>) => void) {
    if (!item.file) {
      patch({ phase: "error", error: "Elegí de nuevo el archivo para reintentar." });
      return;
    }
    const problem = fileProblem(item.file);
    if (problem) {
      patch({ phase: "error", invalid: true, error: problem, progress: 0 });
      return;
    }
    patch({ phase: "uploading", error: undefined, invalid: false, progress: 0 });
    let reservedPhotoId = item.reservedId;
    try {
      const fitted = await fitPhotoFile(item.file);
      const file = fitted.file;
      const prepared = file.type === "image/webp" && fitted.width > 0 && fitted.height > 0;
      const reservePath = reservedPhotoId
        ? `/api/admin/propiedades/${targetPropertyId}/fotos/${reservedPhotoId}/reintentar`
        : `/api/admin/propiedades/${targetPropertyId}/fotos`;
      const reserved = await fetch(reservePath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, byteSize: file.size }),
      });
      if (!reserved.ok) {
        const text = await readError(reserved);
        if (reservedPhotoId && text.includes("ya está lista")) {
          patch({ phase: "ready", serverId: reservedPhotoId, progress: 100, error: undefined });
          return;
        }
        throw new Error(text);
      }
      const ticket = (await reserved.json()) as { photoId: string; uploadUrl: string; contentType: string };
      reservedPhotoId = ticket.photoId;
      patch({ reservedId: ticket.photoId, progress: 5 });
      const uploadStarted = performance.now();
      await putFile(ticket.uploadUrl, file, ticket.contentType, (progress) => {
        patch({ progress: Math.max(5, Math.min(90, progress)) });
      });
      devTiming("foto", "subida", uploadStarted, item.name);
      patch({ phase: "processing", progress: 95 });
      const processStarted = performance.now();
      const completed = await fetch(`/api/admin/propiedades/${targetPropertyId}/fotos/${ticket.photoId}/completar`, {
        method: "POST",
        headers: prepared ? { "Content-Type": "application/json" } : undefined,
        body: prepared ? JSON.stringify({ width: fitted.width, height: fitted.height, byteSize: file.size }) : undefined,
      });
      devTiming("foto", "procesamiento-respuesta", processStarted, item.name);
      if (!completed.ok) {
        throw new Error(await readError(completed));
      }
      patch({ phase: "ready", serverId: ticket.photoId, reservedId: ticket.photoId, progress: 100, error: undefined, invalid: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo subir la foto.";
      if (reservedPhotoId) {
        const released = await fetch(`/api/admin/propiedades/${targetPropertyId}/fotos/${reservedPhotoId}`, { method: "DELETE" });
        if (released.ok || released.status === 502) {
          patch({ phase: "error", progress: 0, error: message, reservedId: undefined, serverId: undefined });
          return;
        }
      }
      patch({
        phase: "error",
        progress: 0,
        error: message,
        reservedId: reservedPhotoId,
      });
    }
  }

  useImperativeHandle(ref, () => {
    const api: PropertyPhotosHandle = {
    hasUnsaved: () => unsaved(committedRef.current),
    invalidMessage: () => {
      const invalid = committedRef.current.items.find((item) => item.invalid);
      return invalid ? `${invalid.name}: ${invalid.error}` : null;
    },
    summary: () => summaryOf(committedRef.current),
    reload: () => setReloadToken((value) => value + 1),
    open: (returnFocus) => {
      if (uploadingRef.current || (propertyId && loadRef.current !== "ready")) {
        return;
      }
      returnFocusRef.current = returnFocus ?? null;
      createdUrls.current = new Set();
      setMessage(null);
      setDraft(cloneDraft(committedRef.current));
    },
    uploadCommitted: async (targetPropertyId, onProgress, options) => {
      uploadingRef.current = true;
      try {
      const source = committedRef.current;
      const deletes = options?.filesOnly ? [] : [...source.pendingDeletes];
      for (const photoId of deletes) {
        const response = await fetch(`/api/admin/propiedades/${targetPropertyId}/fotos/${photoId}`, { method: "DELETE" });
        if (!response.ok) {
          return { ok: false as const, message: await readError(response) };
        }
        remember({
          ...committedRef.current,
          pendingDeletes: committedRef.current.pendingDeletes.filter((id) => id !== photoId),
        });
      }
      const pending = committedRef.current.items.filter((item) => item.phase !== "ready");
      const batchStarted = performance.now();
      let done = 0;
      let failedCount = 0;
      onProgress(0, pending.length, 0);
      let cursor = 0;
      async function runNext() {
        while (cursor < pending.length) {
          const index = cursor;
          cursor += 1;
          const current = committedRef.current.items.find((item) => item.key === pending[index].key);
          if (!current || current.phase === "ready") {
            done += 1;
            onProgress(done, pending.length, failedCount);
            continue;
          }
          await uploadOne(targetPropertyId, current, (patch) => {
            const next = cloneDraft(committedRef.current);
            next.items = next.items.map((item) => (item.key === current.key ? { ...item, ...patch } : item));
            remember(next);
          });
          const updated = committedRef.current.items.find((item) => item.key === current.key);
          if (!updated || updated.phase !== "ready") {
            failedCount += 1;
          }
          done += 1;
          onProgress(done, pending.length, failedCount);
        }
      }
      const workers = Array.from({ length: Math.min(PHOTO_UPLOAD_CONCURRENCY, pending.length) }, () => runNext());
      await Promise.all(workers);
      devTiming("fotos", "lote", batchStarted, `${pending.length} nuevas, ${failedCount} con error`);
      const failed = committedRef.current.items.filter((item) => item.phase !== "ready");
      const changed = deletes.length > 0 || pending.length > 0;
      async function refreshPublicView() {
        if (!options?.refreshPublic || !changed) {
          return { ok: true as const };
        }
        const refreshStarted = performance.now();
        const response = await fetch(`/api/admin/propiedades/${targetPropertyId}/vista`, { method: "POST" });
        devTiming("fotos", "invalidacion-publica", refreshStarted);
        if (!response.ok) {
          return {
            ok: false as const,
            message: "Las fotos se guardaron, pero no se pudo actualizar el sitio público. Podés reintentar sin volver a subirlas.",
          };
        }
        return { ok: true as const };
      }
      if (failed.length > 0 || committedRef.current.items.some((item) => item.invalid)) {
        await refreshPublicView();
        const pendingLeft = failed.length;
        const detail = failed.some((item) => item.error)
          ? failed.map((item) => `${item.name}: ${item.error}`).join(" ")
          : "Algunas fotos no se subieron.";
        return {
          ok: false as const,
          message: `${pendingLeft} ${pendingLeft === 1 ? "foto sigue pendiente" : "fotos siguen pendientes"}. ${detail}`,
        };
      }
      const listed = await idsInClientOrder(targetPropertyId);
      const cover = committedRef.current.items.find((item) => item.key === committedRef.current.coverKey && item.serverId);
      const nextOrder = listed.known.join(",");
      const nextCover = cover?.serverId ?? "";
      const placementPending = options?.filesOnly && committedRef.current.pendingDeletes.length > 0;
      if (!placementPending && listed.ids.length > 0 && (nextOrder !== baselineRef.current.order || listed.ids.length !== listed.known.length)) {
        const ordered = await fetch(`/api/admin/propiedades/${targetPropertyId}/fotos/orden`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: listed.ids }),
        });
        if (!ordered.ok) {
          await refreshPublicView();
          return { ok: false as const, message: await readError(ordered) };
        }
      }
      if (!placementPending && nextCover && nextCover !== baselineRef.current.coverId) {
        const coverResponse = await fetch(`/api/admin/propiedades/${targetPropertyId}/fotos/${nextCover}/portada`, {
          method: "POST",
        });
        if (!coverResponse.ok) {
          await refreshPublicView();
          return { ok: false as const, message: await readError(coverResponse) };
        }
      }
      const refreshed = await refreshPublicView();
      if (!refreshed.ok) {
        return refreshed;
      }
      if (!placementPending) {
        baselineRef.current = {
          order: nextOrder,
          coverId: nextCover || baselineRef.current.coverId,
        };
        remember({ ...committedRef.current, pendingDeletes: [] });
      }
      return { ok: true as const };
      } finally {
        uploadingRef.current = false;
      }
    },
  };
    uploadRef.current = api.uploadCommitted;
    return {
      ...api,
      uploadCommitted: (targetPropertyId, onProgress, options) => enqueueUpload(targetPropertyId, onProgress, options),
    };
  });

  function enqueueUpload(
    targetPropertyId: string,
    onProgress: (done: number, total: number, failed: number) => void,
    options?: { refreshPublic?: boolean; filesOnly?: boolean },
  ) {
    const run = tailRef.current.then(() => {
      const upload = uploadRef.current;
      if (!upload) {
        return { ok: false as const, message: "No se pudieron subir las fotos." };
      }
      return upload(targetPropertyId, onProgress, options);
    });
    tailRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  function updateDraft(recipe: (current: PhotoDraft) => PhotoDraft) {
    setDraft((current) => (current ? recipe(current) : current));
  }

  function addFiles(files: File[]) {
    if (!draft) {
      return;
    }
    const room = MAX_PROPERTY_PHOTOS - draft.items.length;
    const accepted = files.slice(0, Math.max(room, 0));
    setMessage(files.length > accepted.length ? "Solo se pueden elegir 20 fotos." : null);
    const items = [...draft.items];
    accepted.forEach((file, index) => {
      const problem = fileProblem(file);
      const previewUrl = URL.createObjectURL(file);
      createdUrls.current.add(previewUrl);
      items.push({
        key: `${file.name}-${file.size}-${Date.now()}-${index}`,
        name: file.name,
        file,
        previewUrl,
        ownedUrl: true,
        invalid: Boolean(problem),
        error: problem ?? undefined,
        phase: problem ? "error" : "new",
        progress: 0,
      });
    });
    setDraft({
      ...draft,
      items,
      coverKey: draft.coverKey ?? items.find((item) => !item.invalid)?.key ?? null,
    });
  }

  function move(key: string, direction: -1 | 1) {
    updateDraft((current) => {
      const items = [...current.items];
      const index = items.findIndex((item) => item.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= items.length) {
        return current;
      }
      const [item] = items.splice(index, 1);
      items.splice(target, 0, item);
      return { ...current, items };
    });
  }

  function remove(key: string) {
    updateDraft((current) => {
      const item = current.items.find((entry) => entry.key === key);
      if (!item) {
        return current;
      }
      const pendingDeletes = [...current.pendingDeletes];
      const serverKey = item.serverId ?? item.reservedId;
      if (serverKey) {
        pendingDeletes.push(serverKey);
      }
      const items = current.items.filter((entry) => entry.key !== key);
      const coverKey = current.coverKey === key ? (items.find((entry) => !entry.invalid)?.key ?? null) : current.coverKey;
      return { ...current, items, coverKey, pendingDeletes };
    });
  }

  function sameDraft(left: PhotoDraft, right: PhotoDraft) {
    return JSON.stringify({
      keys: left.items.map((item) => item.key),
      cover: left.coverKey,
      deleted: left.pendingDeletes,
    }) === JSON.stringify({
      keys: right.items.map((item) => item.key),
      cover: right.coverKey,
      deleted: right.pendingDeletes,
    });
  }

  function discardDraft() {
    if (!draft) {
      return;
    }
    const kept = new Set(committedRef.current.items.map((item) => item.previewUrl));
    for (const url of createdUrls.current) {
      if (!kept.has(url)) {
        URL.revokeObjectURL(url);
      }
    }
    createdUrls.current = new Set();
    setDraft(null);
    setMessage(null);
  }

  function requestClose() {
    if (!draft) {
      return;
    }
    if (sameDraft(draft, committedRef.current)) {
      discardDraft();
      return;
    }
    modal.confirm({
      title: "Descartar cambios de las fotos",
      content: "Se pierden los cambios de este cuadro. El resto del formulario queda igual.",
      okText: "Descartar",
      cancelText: "Seguir editando",
      onOk: discardDraft,
    });
  }

  function applyDraft() {
    if (!draft || uploadingRef.current) {
      return;
    }
    const kept = new Set(draft.items.map((item) => item.previewUrl));
    for (const item of committedRef.current.items) {
      if (item.ownedUrl && !kept.has(item.previewUrl)) {
        URL.revokeObjectURL(item.previewUrl);
      }
    }
    createdUrls.current = new Set();
    const next = cloneDraft(draft);
    remember(next, null);
    setDraft(null);
    setMessage(null);
  }

  const editing = draft !== null;

  return (
    <Modal
      open={editing}
      title="Administrar fotos"
      width="min(760px, calc(100vw - 24px))"
      destroyOnHidden
      maskClosable={false}
      focusTriggerAfterClose
      afterClose={() => returnFocusRef.current?.focus()}
      onCancel={requestClose}
      styles={{ body: { maxHeight: "min(62vh, 560px)", overflowY: "auto", paddingTop: 8 } }}
      footer={[
        <Button key="cancel" htmlType="button" onClick={requestClose}>
          Cancelar
        </Button>,
        <Button key="apply" htmlType="button" type="primary" onClick={applyDraft}>
          Aplicar
        </Button>,
      ]}
    >
      {draft ? (
        <div>
          <div className="flex items-end justify-between gap-3">
            <p className="text-sm text-[#5c5854]">
              JPEG, PNG o WebP. Hasta 15 MB. Arrastrá para ordenar. La estrella elige la portada. Las fotos nuevas se suben al guardar la propiedad.
            </p>
            <p className="shrink-0 text-sm text-[#2a2a2a]">
              {draft.items.length}/{MAX_PROPERTY_PHOTOS}
            </p>
          </div>
          {message ? (
            <p className="mt-2 text-sm text-[#9f2d2d]" role="alert">
              {message}
            </p>
          ) : null}
          <div
            className="mt-3 rounded-xl border border-dashed border-[#c5d4c8] bg-[#fbfaf7] px-4 py-5 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              addFiles([...event.dataTransfer.files]);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                const selected = event.target.files ? [...event.target.files] : [];
                event.target.value = "";
                addFiles(selected);
              }}
            />
            <button
              type="button"
              disabled={draft.items.length >= MAX_PROPERTY_PHOTOS}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 cursor-pointer items-center rounded-full px-4 text-sm font-medium text-white transition-colors hover:bg-[#0c332e] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
              style={{ backgroundColor: "#155547", color: "#ffffff" }}
            >
              Elegir fotos
            </button>
            <p className="mt-2 text-sm text-[#5c5854]">o soltalas acá</p>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {draft.items.map((photo, index) => {
              const cover = photo.key === draft.coverKey;
              return (
                <li
                  key={photo.key}
                  title={photo.name}
                  draggable
                  onDragStart={(event) => {
                    if ((event.target as HTMLElement).closest("button")) {
                      event.preventDefault();
                      return;
                    }
                    setDragging(photo.key);
                  }}
                  onDragEnd={() => setDragging(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (!dragging || dragging === photo.key) {
                      setDragging(null);
                      return;
                    }
                    const source = dragging;
                    updateDraft((current) => {
                      const items = [...current.items];
                      const from = items.findIndex((item) => item.key === source);
                      const to = items.findIndex((item) => item.key === photo.key);
                      if (from < 0 || to < 0) {
                        return current;
                      }
                      const [moved] = items.splice(from, 1);
                      items.splice(to, 0, moved);
                      return { ...current, items };
                    });
                    setDragging(null);
                  }}
                  className={`group relative aspect-[4/3] cursor-grab overflow-hidden rounded-xl bg-[#f6f3ed] active:cursor-grabbing ${
                    dragging === photo.key ? "opacity-40" : ""
                  } ${photo.invalid ? "ring-2 ring-[#9f2d2d]" : ""}`}
                >
                  {photo.previewUrl ? (
                    // La miniatura es local o una vista firmada del admin.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.previewUrl} alt="" draggable={false} className="h-full w-full object-cover" />
                  ) : null}
                  {cover ? (
                    <span className="absolute left-2 top-2 rounded-full bg-[#155547] px-2 py-0.5 text-[11px] font-medium text-white">
                      Portada
                    </span>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`Quitar ${photo.name}`}
                    onClick={() => remove(photo.key)}
                    className="absolute right-2 top-2 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#2a2a2a] shadow-sm hover:text-[#9f2d2d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
                  >
                    <TileIcon kind="close" />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-6">
                    <button
                      type="button"
                      aria-label="Mover hacia la izquierda"
                      disabled={index === 0}
                      onClick={() => move(photo.key, -1)}
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <TileIcon kind="left" />
                    </button>
                    <button
                      type="button"
                      aria-label={cover ? "Portada actual" : `Usar ${photo.name} como portada`}
                      aria-pressed={cover}
                      disabled={photo.invalid || cover}
                      onClick={() => updateDraft((current) => ({ ...current, coverKey: photo.key }))}
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#155547] disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <TileIcon kind="star" filled={cover} />
                    </button>
                    <button
                      type="button"
                      aria-label="Mover hacia la derecha"
                      disabled={index === draft.items.length - 1}
                      onClick={() => move(photo.key, 1)}
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <TileIcon kind="right" />
                    </button>
                  </div>
                  {photo.phase === "uploading" || photo.phase === "processing" ? (
                    <div className="absolute inset-x-2 top-2">
                      <Progress percent={photo.progress} size="small" showInfo={false} />
                    </div>
                  ) : null}
                  {photo.error ? (
                    <p className="absolute inset-x-2 bottom-12 rounded-md bg-white/95 px-2 py-1 text-[11px] text-[#9f2d2d]" role="alert">
                      {photo.error}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </Modal>
  );
});

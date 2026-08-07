<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { adminGuard, authHeaders } from '$lib/adminGuard';
  import AdminBreadcrumb from '$lib/components/AdminBreadcrumb.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  // ── Types ──────────────────────────────────────────────────────────────────
  type Photo = {
    id: string;
    filename: string;
    original_name: string;
    size: number;
    created_at: string;
  };

  type SessionDetail = {
    id: string;
    user_name: string;
    user_id: string;
    frame_name: string | null;
    status: string;
    created_at: string;
    photos: Photo[];
  };

  // ── State ──────────────────────────────────────────────────────────────────
  let session = $state<SessionDetail | null>(null);
  let loading = $state(true);
  let uploading = $state(false);
  let uploadError = $state('');
  let uploadSuccess = $state(0);
  let deletePhotoTarget = $state<Photo | null>(null);
  let dragOver = $state(false);

  let sessionId = $derived($page.params.id);

  // ── Data fetching ──────────────────────────────────────────────────────────
  onMount(async () => {
    if (!adminGuard()) return;
    await loadSession();
  });

  async function loadSession() {
    try {
      const res = await fetch(`$apiDomain/api/sessions/${sessionId}`, { headers: authHeaders() });
      if (res.ok) session = await res.json();
    } catch { session = null; }
    finally { loading = false; }
  }

  // ── Upload foto ────────────────────────────────────────────────────────────
  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    uploading = true; uploadError = ''; uploadSuccess = 0;

    let successCount = 0;
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append('session_id', sessionId);
        fd.append('file', file);

        const res = await fetch('https://photobox.fajarjaya.site$apiDomain/api/photos/upload', {
          method:  'POST',
          headers: authHeaders(),
          body:    fd,
        });

        if (res.ok) {
          const d = await res.json();
          const uploaded: Photo[] = d.uploaded ?? [];
          if (session) {
            session = { ...session, photos: [...(session.photos ?? []), ...uploaded] };
          }
          successCount++;
        } else {
          const err = await res.json().catch(() => ({}));
          uploadError = err.message ?? `Gagal mengupload ${file.name}`;
        }
      } catch {
        uploadError = `Koneksi gagal saat mengupload ${file.name}`;
      }
    }

    uploadSuccess = successCount;
    uploading = false;
  }

  function onFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    handleUpload(input.files);
    input.value = '';
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    handleUpload(e.dataTransfer?.files ?? null);
  }

  // ── Hapus foto ─────────────────────────────────────────────────────────────
  async function handleDeletePhoto() {
    if (!deletePhotoTarget || !session) return;
    try {
      const res = await fetch(`$apiDomain/api/photos/${deletePhotoTarget.id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (res.ok) {
        session = { ...session, photos: session.photos.filter(p => p.id !== deletePhotoTarget?.id) };
      }
    } catch { /* silent */ }
    finally { deletePhotoTarget = null; }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function formatDate(iso: string) {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(new Date(iso));
    } catch { return iso; }
  }

  function formatSize(bytes: number) {
    if (!bytes) return '—';
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  const statusLabel: Record<string, string> = {
    pending:   'Menunggu',
    active:    'Aktif',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  };
  const statusColor: Record<string, string> = {
    pending:   '#ffaa00',
    active:    '#00d9d9',
    completed: '#22c55e',
    cancelled: '#8e8a96',
  };
</script>

<svelte:head>
  <title>VELVET.FILM — Detail Sesi</title>
</svelte:head>

<!-- Modal hapus foto -->
{#if deletePhotoTarget}
  <ConfirmModal
    title="Hapus Foto?"
    message="<strong>{deletePhotoTarget.original_name}</strong> akan dihapus permanen dari sesi ini."
    confirmLabel="Hapus"
    onConfirm={handleDeletePhoto}
    onCancel={() => deletePhotoTarget = null}
  />
{/if}

<section class="min-h-screen relative" style="background:linear-gradient(180deg,#1a1625 0%,#0f0d15 100%);">
  <div class="relative max-w-container mx-auto px-5 md:px-8 py-10">

    <AdminBreadcrumb current="Detail Sesi" backHref="/sessions" backLabel="← Semua Sesi" />

    {#if loading}
      <div class="space-y-4">
        <div class="animate-pulse h-10 w-64 rounded-xl" style="background:#2a2332;"></div>
        <div class="animate-pulse h-48 rounded-2xl" style="background:#1f1a28;border:1px solid #49454e;"></div>
      </div>

    {:else if session}
      <!-- Info sesi -->
      <div class="rounded-2xl p-5 mb-8" style="background:#1f1a28;border:1px solid #49454e;">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div class="space-y-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span style="
                display:inline-flex;padding:3px 10px;border-radius:9999px;
                font-size:11px;font-weight:600;letter-spacing:.04em;
                background:rgba(0,217,217,.1);color:{statusColor[session.status]??'#8e8a96'};
                border:1px solid {statusColor[session.status]??'#49454e'}33;
              ">{statusLabel[session.status] ?? session.status}</span>
              {#if session.frame_name}
                <span class="badge">{session.frame_name}</span>
              {/if}
            </div>
            <h1 class="text-on-surface font-semibold"
              style="font-family:'Space Grotesk',sans-serif;font-size:20px;">
              {session.user_name}
            </h1>
            <p class="text-on-surface-variant text-label-sm">{formatDate(session.created_at)}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-on-surface font-semibold" style="font-size:28px;font-family:'Space Grotesk',sans-serif;color:#00d9d9;">
              {session.photos?.length ?? 0}
            </p>
            <p class="text-on-surface-variant text-label-sm">foto tersimpan</p>
          </div>
        </div>
      </div>

      <!-- Area upload -->
      <div class="mb-8">
        <p class="section-label mb-4">Upload Foto</p>

        <!-- Notifikasi sukses -->
        {#if uploadSuccess > 0 && !uploading}
          <div class="mb-4 px-4 py-3 rounded-xl text-label-md"
            style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);color:#22c55e;">
            ✓ {uploadSuccess} foto berhasil diupload.
          </div>
        {/if}
        {#if uploadError}
          <div class="mb-4 px-4 py-3 rounded-xl text-label-md" role="alert"
            style="background:rgba(255,71,87,.08);border:1px solid rgba(255,71,87,.25);color:#ff4757;">
            {uploadError}
          </div>
        {/if}

        <!-- Drop zone -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="relative rounded-2xl transition-all duration-200 cursor-pointer"
          style="
            border: 2px dashed {dragOver ? '#00d9d9' : '#49454e'};
            background: {dragOver ? 'rgba(0,217,217,.06)' : '#15121d'};
            padding: 48px 24px;
            text-align: center;
            box-shadow: {dragOver ? '0 0 0 3px rgba(0,217,217,.15)' : 'none'};
          "
          ondragover={(e) => { e.preventDefault(); dragOver = true; }}
          ondragleave={() => dragOver = false}
          ondrop={onDrop}
          onclick={() => document.getElementById('photo-upload-input')?.click()}
          onkeydown={(e) => e.key === 'Enter' && document.getElementById('photo-upload-input')?.click()}
          role="button"
          tabindex="0"
          aria-label="Klik atau seret foto untuk diupload"
        >
          <input
            id="photo-upload-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            class="hidden"
            onchange={onFileInput}
          />

          {#if uploading}
            <svg class="animate-spin w-8 h-8 mx-auto mb-3" style="color:#00d9d9;" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p class="text-on-surface font-medium text-label-md">Mengupload…</p>
          {:else}
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24"
              style="color:#8e8a96;margin:0 auto 12px;" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
            </svg>
            <p class="text-on-surface font-medium text-label-md mb-1">
              {dragOver ? 'Lepas untuk upload' : 'Klik atau seret foto ke sini'}
            </p>
            <p class="text-on-surface-variant" style="font-size:13px;">
              JPG, PNG, WebP — beberapa file sekaligus
            </p>
          {/if}
        </div>
      </div>

      <!-- Grid foto yang sudah ada -->
      {#if session.photos && session.photos.length > 0}
        <div>
          <p class="section-label mb-4">Foto dalam Sesi ({session.photos.length})</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {#each session.photos as photo, i (photo.id)}
              <div class="rounded-xl overflow-hidden group relative" style="background:#1f1a28;border:1px solid #49454e;">
                <!-- Thumbnail -->
                <div class="relative" style="aspect-ratio:3/4;">
                  <img
                    src="$apiDomain/uploads/{photo.filename}"
                    alt={photo.original_name}
                    class="w-full h-full object-cover"
                    loading="lazy"
                    onerror={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <!-- Fallback placeholder -->
                  <div class="hidden w-full h-full items-center justify-center absolute inset-0"
                    style="background:linear-gradient(160deg,{['#6b1b7a,#d946ef','#004d4d,#00d9d9','#8b0050,#ff006e','#1f1a28,#6b1b7a'][i%4]},transparent);">
                  </div>
                  <!-- Overlay aksi -->
                  <div class="absolute inset-0 flex items-end justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onclick={() => deletePhotoTarget = photo}
                      class="w-7 h-7 rounded-lg flex items-center justify-center"
                      style="background:rgba(255,71,87,.85);color:white;"
                      title="Hapus foto"
                    >
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <!-- Info -->
                <div class="px-2.5 py-2">
                  <p class="text-on-surface text-label-sm font-medium truncate">{photo.original_name}</p>
                  <p class="text-on-surface-variant mt-0.5" style="font-size:10px;">{formatSize(photo.size)}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="rounded-2xl px-6 py-10 text-center" style="background:#1f1a28;border:1px solid #49454e;">
          <p class="text-on-surface-variant text-body-md">Belum ada foto di sesi ini.</p>
          <p class="text-on-surface-variant mt-1" style="font-size:13px;">Upload foto menggunakan area di atas.</p>
        </div>
      {/if}

    {:else}
      <div class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-16 h-16 rounded-full flex items-center justify-center mb-5"
          style="background:rgba(255,71,87,.08);border:1px solid rgba(255,71,87,.2);">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#ff4757" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
          </svg>
        </div>
        <h2 class="text-on-surface mb-2" style="font-family:'Instrument Serif',serif;font-size:24px;">Sesi tidak ditemukan.</h2>
        <p class="text-on-surface-variant text-body-md mb-6">Sesi ini mungkin sudah dihapus.</p>
        <a href="/admin/sessions" class="btn-secondary">← Kembali ke Daftar Sesi</a>
      </div>
    {/if}

  </div>
</section>

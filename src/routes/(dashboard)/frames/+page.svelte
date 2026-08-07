<script lang="ts">
  import { onMount } from 'svelte';
  import { adminGuard, authHeaders } from '$lib/adminGuard';
  import AdminBreadcrumb from '$lib/components/AdminBreadcrumb.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';

  type Frame = {
    id: string;
    label: string;
    previewUrl?: string;
    isActive: boolean;
    createdAt: string;
    usageCount: number;
  };

  let frames: Frame[] = $state([]);
  let loading = $state(true);
  let showModal = $state(false);
  let editTarget = $state<Frame | null>(null);
  let formLabel = $state('');
  let formFile = $state<File | null>(null);
  let formActive = $state(true);
  let formError = $state('');
  let formLoading = $state(false);
  let deleteTarget = $state<Frame | null>(null);

  const IS_DEV = import.meta.env.DEV;

  const demoFrames: Frame[] = [
    { id: 'f1', label: 'Neon Pink Frame',   isActive: true,  createdAt: '2026-05-01', usageCount: 42, previewUrl: undefined },
    { id: 'f2', label: 'Minimalist White',  isActive: true,  createdAt: '2026-05-10', usageCount: 28, previewUrl: undefined },
    { id: 'f3', label: 'Gold Classic',      isActive: true,  createdAt: '2026-06-01', usageCount: 19, previewUrl: undefined },
    { id: 'f4', label: 'Neon Cyan Frame',   isActive: false, createdAt: '2026-06-15', usageCount: 7,  previewUrl: undefined },
    { id: 'f5', label: 'Dark Glitter',      isActive: false, createdAt: '2026-07-01', usageCount: 3,  previewUrl: undefined },
  ];

  const frameGradients = [
    'linear-gradient(135deg,#6b1b7a,#d946ef,#ff006e)',
    'linear-gradient(135deg,#e8e8e8,#ffffff,#cccccc)',
    'linear-gradient(135deg,#7c5c00,#e8b800,#fff0a0)',
    'linear-gradient(135deg,#003333,#00d9d9,#d946ef)',
    'linear-gradient(135deg,#1a1625,#2a2332,#6b1b7a)',
  ];

  onMount(async () => {
    if (!adminGuard()) return;
    try {
      // GET /api/frames — returns array langsung
      const res = await fetch('https://photobox.fajarjaya.site/api/frames', { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        frames = (Array.isArray(d) ? d : d.frames ?? []).map((f: {
          id: string; name: string; filename: string | null; created_at: string; usage_count?: number;
        }) => ({
          id:         f.id,
          label:      f.name,
          previewUrl: f.filename ? `https://photobox.fajarjaya.site/uploads/${f.filename}` : undefined,
          isActive:   true,   // backend belum ada field isActive
          createdAt:  f.created_at,
          usageCount: f.usage_count || 0,
        }));
      }
    } catch { /* demo */ }
    finally { loading = false; }
  });

  let showDemo = $derived(!loading && frames.length === 0 && IS_DEV);
  let display  = $derived(showDemo ? demoFrames : frames);

  function openAdd() {
    editTarget = null; formLabel = ''; formFile = null; formActive = true; formError = '';
    showModal = true;
  }

  function openEdit(f: Frame) {
    editTarget = f; formLabel = f.label; formFile = null; formActive = f.isActive; formError = '';
    showModal = true;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!formLabel.trim()) { formError = 'Nama frame wajib diisi.'; return; }
    formLoading = true; formError = '';
    try {
      // POST/PUT /api/frames — multipart (name sebagai field)
      // Untuk tambah/edit sederhana tanpa upload gambar, kirim sebagai JSON via PUT text fields
      const body = { name: formLabel.trim() };
      const url = editTarget ? `https://photobox.fajarjaya.site/api/frames/${editTarget.id}` : 'https://photobox.fajarjaya.site/api/frames';
      // Frame POST/PUT pakai multipart, send field via FormData
      const fd = new FormData();
      fd.append('name', formLabel.trim());
      if (formFile) {
        fd.append('image', formFile);
      }
      const method = editTarget ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),   // tanpa Content-Type — browser set boundary multipart
        body: fd,
      });
      if (res.ok) {
        const d = await res.json();
        const mapped = {
          id: d.id, label: d.name,
          previewUrl: d.filename ? `https://photobox.fajarjaya.site/uploads/${d.filename}` : undefined,
          isActive: true, createdAt: d.created_at, usageCount: 0,
        };
        frames = !editTarget ? [mapped, ...frames] : frames.map(f => f.id === editTarget?.id ? mapped : f);
        showModal = false;
      } else {
        const err = await res.json();
        formError = err.message ?? err.error ?? 'Terjadi kesalahan.';
      }
    } catch { formError = 'Tidak bisa terhubung ke server.'; }
    finally { formLoading = false; }
  }

  // DELETE /api/frames/:id
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`https://photobox.fajarjaya.site/api/frames/${deleteTarget.id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) frames = frames.filter(f => f.id !== deleteTarget?.id);
    } catch { /* silent */ }
    finally { deleteTarget = null; }
  }

  // Toggle aktif: backend belum ada field, cukup update UI lokal
  function toggleActive(f: Frame) {
    frames = frames.map(fr => fr.id === f.id ? { ...fr, isActive: !fr.isActive } : fr);
  }
</script>

<svelte:head><title>FM.PHOTO — Kelola Frame</title></svelte:head>

<!-- Modal tambah/edit -->
{#if showModal}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background:var(--admin-modal-backdrop);backdrop-filter:blur(8px);"
    onclick={(e) => { if (e.target===e.currentTarget) showModal=false; }}
    onkeydown={(e) => e.key==='Escape' && (showModal=false)}
    role="dialog" aria-modal="true">
    <div class="w-full max-w-md rounded-2xl p-6" style="background:var(--admin-card-bg);border:1px solid var(--admin-card-border);box-shadow:0 24px 60px rgba(0,0,0,.6);">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-on-surface font-semibold" style="font-family:'Space Grotesk',sans-serif;font-size:18px;">
          {editTarget ? 'Edit Frame' : 'Tambah Frame'}
        </h2>
        <button onclick={() => showModal=false} class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant" style="background:var(--admin-close-bg);">✕</button>
      </div>
      {#if formError}
        <div class="mb-4 px-4 py-2 rounded-xl text-sm" style="background:rgba(255,71,87,.1);border:1px solid rgba(255,71,87,.3);color:#ff4757;">{formError}</div>
      {/if}
      <form onsubmit={handleSubmit} class="space-y-4">
        <div>
          <label class="block text-label-sm text-on-surface-variant mb-1.5" style="text-transform:uppercase;letter-spacing:.05em;font-size:11px;">Nama Frame</label>
          <input bind:value={formLabel} type="text" required placeholder="cth. Neon Pink Frame" class="input-field" style="border-radius:12px;" />
        </div>
        <div>
          <label class="block text-label-sm text-on-surface-variant mb-1.5" style="text-transform:uppercase;letter-spacing:.05em;font-size:11px;">File Gambar</label>
          <input type="file" accept="image/*" class="w-full text-sm text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[rgba(0,217,217,.1)] file:text-[#00d9d9] hover:file:bg-[rgba(0,217,217,.2)]" style="background:var(--admin-input-bg); border:1px solid var(--admin-card-border); border-radius:12px; padding: 6px;" onchange={(e) => { const t = e.target as HTMLInputElement; if (t.files) formFile = t.files[0]; }} required={!editTarget} />
        </div>
        <div class="flex items-center gap-3 py-1">
          <button type="button"
            onclick={() => formActive = !formActive}
            class="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
            style="background:{formActive?'#00d9d9':'var(--admin-card-border)'};"
            aria-checked={formActive} role="switch">
            <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
              style="transform:{formActive?'translateX(20px)':'translateX(0)'};">
            </span>
          </button>
          <span class="text-on-surface-variant text-label-md">Frame aktif (bisa dipilih)</span>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" onclick={() => showModal=false} class="btn-secondary flex-1">Batal</button>
          <button type="submit" disabled={formLoading} class="btn-primary flex-1"
            style="{formLoading?'opacity:.7;cursor:not-allowed;':''}">
            {formLoading ? 'Menyimpan…' : editTarget ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal hapus -->
{#if deleteTarget}
  <ConfirmModal
    title="Hapus Frame?"
    message="Frame <strong>{deleteTarget.label}</strong> akan dihapus permanen."
    confirmLabel="Hapus"
    onConfirm={handleDelete}
    onCancel={() => deleteTarget = null}
  />
{/if}

<section class="min-h-screen relative">
  <div class="relative max-w-container mx-auto px-5 md:px-8 py-10">

    <AdminBreadcrumb current="Frame Photobooth">
      <a href="/frames/add" class="btn-primary flex items-center" style="height:44px;padding:0 20px;font-size:14px;">+ Tambah Frame</a>
    </AdminBreadcrumb>

    {#if loading}
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {#each Array(5) as _}
          <div class="animate-pulse rounded-2xl" style="height:220px;background:var(--admin-card-bg);border:1px solid var(--admin-card-border);"></div>
        {/each}
      </div>
    {:else if display.length > 0}
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {#each display as f, i (f.id)}
          <div class="rounded-2xl overflow-hidden flex flex-col" style="background:var(--admin-card-bg);border:1px solid var(--admin-card-border);">
            <!-- Preview with Checkerboard Background -->
            <div class="relative w-full p-3 flex justify-center items-center overflow-hidden rounded-t-2xl" style="background-color: #f0f0f0; background-image: linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%); background-size: 16px 16px; background-position: 0 0, 0 8px, 8px -8px, -8px 0px; height: 280px;">
              

              {#if f.previewUrl}
                <img loading="lazy" src={f.previewUrl} alt={f.label} class="max-w-full max-h-full object-contain drop-shadow-xl" />
              {:else}
                <div class="w-full h-full rounded shadow-xl" style="background:{frameGradients[i % frameGradients.length]};"></div>
              {/if}
            </div>

            <!-- Info + aksi -->
            <div class="p-3 flex flex-col items-center flex-1">
              <h3 class="text-on-surface text-sm font-bold text-center truncate w-full mb-0.5">{f.label}</h3>
              <p class="text-on-surface-variant text-[10px] text-center mb-2">Dipakai {f.usageCount} sesi</p>

              <!-- Toggle Aktif -->
              <div class="w-full flex items-center justify-between p-2 mb-2 rounded-xl" style="background: rgba(255,255,255,0.03); border: 1px solid var(--admin-card-border);">
                <span class="text-xs font-bold text-on-surface">Aktifkan frame</span>
                <button onclick={() => toggleActive(f)}
                  class="relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none"
                  style="background:{f.isActive?'#10b981':'rgba(255,255,255,0.2)'};">
                  <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                    style="transform:{f.isActive?'translateX(20px)':'translateX(0)'};">
                  </span>
                </button>
              </div>

              <!-- Actions -->
              <div class="flex gap-2 w-full mt-auto">
                <button onclick={() => openEdit(f)} class="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex justify-center items-center gap-1.5" style="background:rgba(0,217,217,.1);color:#00d9d9;">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                  Edit
                </button>
                <button onclick={() => deleteTarget = f} class="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex justify-center items-center gap-1.5" style="background:rgba(255,71,87,.1);color:#ff4757;">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  Hapus
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <EmptyState title="Belum ada frame." description="Tambahkan frame untuk digunakan di sesi photobooth.">
        <a href="/frames/add" class="btn-primary inline-flex items-center">+ Tambah Frame</a>
      </EmptyState>
    {/if}

  </div>
</section>

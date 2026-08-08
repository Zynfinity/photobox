<script lang="ts">
  import { onMount } from 'svelte';
  import { adminGuard, authHeaders } from '$lib/adminGuard';
  import AdminBreadcrumb from '$lib/components/AdminBreadcrumb.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  type PrintJob = {
    id: string;
    userName: string;
    photoTitle: string;
    copies: number;
    status: 'antri' | 'mencetak' | 'selesai' | 'gagal';
    createdAt: string;
  };

  type PrinterStatus = {
    connected: boolean;
    name: string;
    paperLevel: number;
    inkLevel: number;
  };

  let jobs: PrintJob[] = $state([]);
  let printer = $state<PrinterStatus | null>(null);
  let loading = $state(true);
  let deleteTarget = $state<PrintJob | null>(null);

  const IS_DEV = import.meta.env.DEV;

  const demoJobs: PrintJob[] = [
    { id: 'pj-1', userName: 'Ayu Pratiwi',    photoTitle: 'Strip_001.jpg', copies: 1, status: 'selesai',  createdAt: '2026-08-04T10:15:00' },
    { id: 'pj-2', userName: 'Bima Santoso',   photoTitle: 'Strip_002.jpg', copies: 2, status: 'selesai',  createdAt: '2026-08-04T10:32:00' },
    { id: 'pj-3', userName: 'Cinta Maharani', photoTitle: 'Strip_003.jpg', copies: 1, status: 'mencetak', createdAt: '2026-08-04T11:01:00' },
    { id: 'pj-4', userName: 'Dito Arman',     photoTitle: 'Strip_004.jpg', copies: 1, status: 'antri',    createdAt: '2026-08-04T11:04:00' },
    { id: 'pj-5', userName: 'Elisa Putri',    photoTitle: 'Strip_005.jpg', copies: 3, status: 'gagal',    createdAt: '2026-08-03T15:20:00' },
  ];

  const demoPrinter: PrinterStatus = {
    connected: true, name: 'DNP DS620', paperLevel: 72, inkLevel: 58,
  };

  onMount(async () => {
    if (!adminGuard()) return;
    try {
      // GET /api/print — mengembalikan semua print jobs (admin lihat semua)
      const res = await fetch('https://panel.tail11f9ba.ts.net/api/print', { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        // Backend: { id, photo_id, user_id, copies, status, created_at, original_name, user_name }
        jobs = (Array.isArray(d) ? d : d.data ?? []).map((j: {
          id: string; user_name: string; original_name: string;
          copies: number; status: string; created_at: string;
        }) => ({
          id:         j.id,
          userName:   j.user_name ?? '—',
          photoTitle: j.original_name ?? '—',
          copies:     j.copies ?? 1,
          status:     mapStatus(j.status),
          createdAt:  j.created_at,
        }));
      }
      // Status printer tidak ada di backend — tampil demo saja
    } catch { /* demo */ }
    finally { loading = false; }
  });

  // Map backend status ke UI status
  function mapStatus(s: string): 'antri' | 'mencetak' | 'selesai' | 'gagal' {
    const map: Record<string, 'antri' | 'mencetak' | 'selesai' | 'gagal'> = {
      queued: 'antri', printing: 'mencetak', done: 'selesai', failed: 'gagal',
    };
    return map[s] ?? 'antri';
  }

  let showDemo      = $derived(!loading && jobs.length === 0 && IS_DEV);
  let displayJobs   = $derived(showDemo ? demoJobs : jobs);
  let displayPrinter = $derived(showDemo ? demoPrinter : printer);

  // PATCH /api/print/:id — ubah status
  async function retryJob(id: string) {
    try {
      const res = await fetch(`https://panel.tail11f9ba.ts.net/api/print/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status: 'queued' }),
      });
      if (res.ok) jobs = jobs.map(j => j.id === id ? { ...j, status: 'antri' } : j);
    } catch { /* silent */ }
  }

  // DELETE /api/print/:id
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`https://panel.tail11f9ba.ts.net/api/print/${deleteTarget.id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) jobs = jobs.filter(j => j.id !== deleteTarget?.id);
    } catch { /* silent */ }
    finally { deleteTarget = null; }
  }

  function formatTime(iso: string) {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short'
      }).format(new Date(iso));
    } catch { return iso; }
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    antri:    { label: 'Antri',    color: '#ffaa00', bg: 'rgba(255,170,0,.12)', border: 'rgba(255,170,0,.3)' },
    mencetak: { label: 'Mencetak', color: '#00d9d9', bg: 'rgba(0,217,217,.12)', border: 'rgba(0,217,217,.3)' },
    selesai:  { label: 'Selesai',  color: '#22c55e', bg: 'rgba(34,197,94,.12)', border: 'rgba(34,197,94,.3)' },
    gagal:    { label: 'Gagal',    color: '#ff4757', bg: 'rgba(255,71,87,.12)', border: 'rgba(255,71,87,.3)' },
  };
</script>

<svelte:head><title>VELVET.FILM — Antrian Cetak</title></svelte:head>

<!-- Modal Hapus Cetak -->
{#if deleteTarget}
  <ConfirmModal
    title="Batalkan Cetak?"
    message="Pesanan cetak untuk <strong>{deleteTarget.photoTitle}</strong> milik <strong>{deleteTarget.userName}</strong> akan dibatalkan."
    confirmLabel="Batalkan"
    onConfirm={handleDelete}
    onCancel={() => deleteTarget = null}
  />
{/if}

<section class="min-h-screen relative">
  <div class="relative max-w-container mx-auto px-5 md:px-8 py-10">

    <AdminBreadcrumb current="Antrian Cetak" />

    <!-- Status printer (hanya tampil di dev/demo) -->
    {#if displayPrinter}
      <div class="rounded-2xl p-4 md:p-5 mb-8" style="background:var(--admin-card-bg);border:1px solid var(--admin-card-border);">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full shrink-0" style="
              background:{displayPrinter.connected?'#22c55e':'#ff4757'};
              box-shadow:0 0 8px {displayPrinter.connected?'rgba(34,197,94,.5)':'rgba(255,71,87,.5)'};
            "></div>
            <div>
              <p class="text-on-surface font-medium text-label-md" style="font-family:'Space Grotesk',sans-serif;">
                {displayPrinter.name}
              </p>
              <p class="text-on-surface-variant" style="font-size:12px;">
                {displayPrinter.connected ? 'Terhubung' : 'Tidak terhubung'}
              </p>
            </div>
          </div>
          <div class="flex gap-6 sm:ml-auto">
            <div>
              <p class="text-label-sm text-on-surface-variant mb-1">Kertas</p>
              <div class="flex items-center gap-2">
                <div class="w-24 h-2 rounded-full" style="background:var(--admin-input-bg);">
                  <div class="h-full rounded-full" style="width:{displayPrinter.paperLevel}%;background:{displayPrinter.paperLevel>20?'#00d9d9':'#ff4757'};"></div>
                </div>
                <span class="text-label-sm text-on-surface">{displayPrinter.paperLevel}%</span>
              </div>
            </div>
            <div>
              <p class="text-label-sm text-on-surface-variant mb-1">Tinta</p>
              <div class="flex items-center gap-2">
                <div class="w-24 h-2 rounded-full" style="background:var(--admin-input-bg);">
                  <div class="h-full rounded-full" style="width:{displayPrinter.inkLevel}%;background:{displayPrinter.inkLevel>20?'#d946ef':'#ff4757'};"></div>
                </div>
                <span class="text-label-sm text-on-surface">{displayPrinter.inkLevel}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Antrian -->
    {#if loading}
      <div class="space-y-3">
        {#each Array(4) as _}
          <div class="animate-pulse rounded-xl" style="height:64px;background:var(--admin-card-bg);border:1px solid var(--admin-card-border);"></div>
        {/each}
      </div>
    {:else if displayJobs.length > 0}
      <div class="rounded-2xl overflow-hidden" style="border:1px solid var(--admin-card-border);">
        <div class="hidden md:grid px-5 py-3 text-label-sm text-on-surface-variant"
          style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) 140px 80px 80px;gap:12px;background:var(--admin-input-bg);border-bottom:1px solid var(--admin-card-border);align-items:center;">
          <span>Pengguna</span><span>Foto</span><span>Waktu</span><span>Status</span><span>Aksi</span>
        </div>

        {#each displayJobs as j, i (j.id)}
          {@const cfg = statusConfig[j.status] ?? statusConfig.antri}
          <div class="flex md:grid items-center gap-3 px-4 py-3 md:px-5 md:py-4"
            style="
              grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) 140px 80px 80px;
              gap:12px;
              align-items:center;
              background:{i%2===0?'var(--admin-row-even)':'var(--admin-row-odd)'};
              border-bottom:{i<displayJobs.length-1?'1px solid var(--admin-card-border)':'none'};
            ">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-label-sm font-semibold"
                style="background:rgba(0,217,217,.12);color:#00d9d9;border:1px solid rgba(0,217,217,.2);">
                {j.userName[0]?.toUpperCase()}
              </div>
              <div class="min-w-0">
                <p class="text-on-surface text-label-md font-medium truncate">{j.userName}</p>
                <p class="text-on-surface-variant md:hidden truncate" style="font-size:11px;">{j.photoTitle} · {j.copies}×</p>
              </div>
            </div>
            <div class="hidden md:block min-w-0">
              <p class="text-on-surface-variant text-label-sm truncate">{j.photoTitle}</p>
              <p class="text-on-surface-variant" style="font-size:11px;">{j.copies} salinan</p>
            </div>
            <p class="hidden md:block text-on-surface-variant text-label-sm whitespace-nowrap">{formatTime(j.createdAt)}</p>
            <span style="display:inline-flex;padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:600;letter-spacing:.04em;white-space:nowrap;background:{cfg.bg};color:{cfg.color};border:1px solid {cfg.border};">
              {cfg.label}
            </span>
            <div class="flex items-center gap-2 shrink-0">
              {#if j.status === 'gagal'}
                <button onclick={() => retryJob(j.id)}
                  class="px-3 h-7 rounded-lg text-label-sm font-medium"
                  style="background:rgba(255,170,0,.1);color:#ffaa00;border:1px solid rgba(255,170,0,.3);">
                  Coba lagi
                </button>
              {/if}
              {#if j.status === 'antri'}
                <button onclick={() => deleteTarget = j}
                  class="w-7 h-7 rounded-lg flex items-center justify-center"
                  style="background:rgba(255,71,87,.08);color:#ff4757;" title="Batalkan">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <EmptyState title="Antrian cetak kosong." description="Print job akan muncul di sini ketika ada pesanan cetak." />
    {/if}

  </div>
</section>

<script lang="ts">
  import { onMount } from 'svelte';
  import { adminGuard, authHeaders } from '$lib/adminGuard';
  import AdminBreadcrumb from '$lib/components/AdminBreadcrumb.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import { formatDate } from '$lib/utils';

  // ── Types ──────────────────────────────────────────────────────────────────
  type Session = {
    id: string;
    userId: string;
    userName: string;
    userPhone: string;
    status: string;
    payment_status: string;
    date: string;
    photoCount: number;
    frameCount: number;
    totalSize: string;
  };

  // ── State ──────────────────────────────────────────────────────────────────
  let sessions: Session[] = $state([]);
  let loading = $state(true);
  let search = $state('');
  let deleteTarget = $state<Session | null>(null);
  let qrTarget = $state<Session | null>(null);

  let showNewModal = $state(false);
  let formCustomerName  = $state('');
  let formCustomerPhone = $state('');
  let formLoading  = $state(false);
  let formError    = $state('');

  const IS_DEV = import.meta.env.DEV;

  const demoSessions: Session[] = [];

  onMount(async () => {
    if (!adminGuard()) return;
    try {
      const res = await fetch('https://photobox.fajarjaya.site/api/sessions', { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        const data = d.data || d;
        sessions = data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          userName: row.customer_name || 'Guest',
          userPhone: row.customer_phone || '',
          status: row.status || 'pending',
          payment_status: row.payment_status || 'unpaid',
          date: row.created_at,
          photoCount: row.photo_count || 0,
          frameCount: row.frame_count || 0,
          totalSize: '—'
        }));
        updateTimers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  });

  // ── Buat Sesi Baru (Hanya Info) ────────────────────────────────────────────
  async function openNewModal() {
    showNewModal = true;
    formCustomerName = ''; formCustomerPhone = ''; formError = '';
  }

  async function handleCreateSession(e: Event) {
    e.preventDefault();
    if (!formCustomerName) return;
    formLoading = true; formError = '';
    try {
      const res = await fetch('https://photobox.fajarjaya.site/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          customer_name: formCustomerName,
          customer_phone: formCustomerPhone
        })
      });
      if (res.ok) {
        const d = await res.json();
        const newSession: Session = {
          id: d.id,
          userId: d.user_id,
          userName: d.customer_name || 'Guest',
          userPhone: d.customer_phone || '',
          status: d.status || 'pending',
          payment_status: d.payment_status || 'unpaid',
          date: d.created_at,
          photoCount: 0,
          frameCount: 0,
          totalSize:  '—',
        };
        sessions = [...sessions, newSession];
        showNewModal = false;
      } else {
        const err = await res.json().catch(() => ({}));
        formError = err.message ?? err.error ?? 'Gagal membuat sesi.';
      }
    } catch (err) {
      formError = 'Terjadi kesalahan jaringan.';
    } finally {
      formLoading = false;
    }
  }

  // ── DELETE /api/sessions/:id ───────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`https://photobox.fajarjaya.site/api/sessions/${deleteTarget.id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) sessions = sessions.filter(s => s.id !== deleteTarget?.id);
    } catch { /* silent */ }
    finally { deleteTarget = null; }
  }

  // ── PATCH /api/sessions/:id ───────────────────────────────────────────────
  async function updateSessionStatus(id: string, updates: any) {
    try {
      const res = await fetch(`https://photobox.fajarjaya.site/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        sessions = sessions.map(s => s.id === id ? { ...s, ...updates } : s);
      }
    } catch { /* silent */ }
  }

  function handleMarkPaid(s: Session) {
    updateSessionStatus(s.id, { payment_status: 'paid' });
  }

  function handleActivate(s: Session) {
    updateSessionStatus(s.id, { status: 'active' });
  }

  function handleStop(s: Session) {
    updateSessionStatus(s.id, { status: 'completed' });
    // Beri sinyal ke tab photobooth agar reset
    localStorage.setItem(`session_command_${s.id}`, 'stop_' + Date.now());
  }

  let showDemo = $derived(!loading && sessions.length === 0 && IS_DEV);
  let display  = $derived(showDemo ? demoSessions : sessions);
  let filtered = $derived(
    search.trim()
      ? display.filter(s =>
          s.userName.toLowerCase().includes(search.toLowerCase()) ||
          s.frameLabel.toLowerCase().includes(search.toLowerCase()) ||
          s.date.includes(search)
        )
      : display
  );


  // ── Sync Timer Logic ───────────────────────────────────────────────────────
  let timers = $state<Record<string, number>>({});
  let timerInterval: number;

  onMount(() => {
    timerInterval = window.setInterval(updateTimers, 1000);
  });

  import { onDestroy } from 'svelte';
  onDestroy(() => {
    clearInterval(timerInterval);
  });

  function updateTimers() {
    const newTimers: Record<string, number> = {};
    for (const s of sessions) {
      if (s.status.startsWith('completed') || s.status === 'cancelled') continue;
      const startTimeStr = localStorage.getItem(`session_time_start_${s.id}`);
      if (startTimeStr) {
        const startTime = parseInt(startTimeStr, 10);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = (5 * 60) - elapsed;
        if (remaining > 0) {
          newTimers[s.id] = remaining;
        } else {
          newTimers[s.id] = 0;
        }
      }
    }
    timers = newTimers;
  }

  function formatTimeLeft(s: number) {
    if (s <= 0) return 'Habis';
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<svelte:head><title>VELVET.FILM — Sesi &amp; Galeri</title></svelte:head>

<!-- ── Modal buat sesi baru ─────────────────────────────────────────────── -->
{#if showNewModal}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background:var(--admin-modal-backdrop);backdrop-filter:blur(8px);"
    onclick={(e) => { if (e.target===e.currentTarget) showNewModal=false; }}
    onkeydown={(e) => e.key==='Escape' && (showNewModal=false)}
    role="dialog" aria-modal="true" aria-labelledby="new-session-title">

    <div class="w-full max-w-md rounded-2xl p-6"
      style="background:var(--admin-card-bg);border:1px solid var(--admin-card-border);box-shadow:0 24px 60px rgba(0,0,0,.6);">

      <!-- Top accent -->
      <div class="absolute top-0 left-8 right-8 h-0.5 rounded-full"
        style="background:linear-gradient(90deg,transparent,#00d9d9,#d946ef,transparent);"></div>

      <div class="flex items-center justify-between mb-6">
        <div>
          <p class="section-label mb-1">Sesi Baru</p>
          <h2 id="new-session-title" class="text-on-surface font-semibold"
            style="font-family:'Space Grotesk',sans-serif;font-size:18px;">
            Mulai Sesi Photobooth
          </h2>
        </div>
        <button onclick={() => showNewModal=false}
          class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface"
          style="background:var(--admin-close-bg);" aria-label="Tutup">✕</button>
      </div>

      {#if formError}
        <div class="mb-4 px-4 py-2 rounded-xl text-sm" role="alert"
          style="background:rgba(255,71,87,.1);border:1px solid rgba(255,71,87,.3);color:#ff4757;">
          {formError}
        </div>
      {/if}

      <form onsubmit={handleCreateSession} class="space-y-5">
        <!-- Nama Pelanggan -->
        <div>
          <label for="session-customer-name" class="block text-label-sm text-on-surface-variant mb-2"
            style="text-transform:uppercase;letter-spacing:.05em;font-size:11px;">
            Nama Pelanggan
          </label>
          <input id="session-customer-name" type="text" bind:value={formCustomerName} placeholder="Masukkan nama..." class="input-field w-full rounded-lg text-sm bg-black/20 text-gray-200" required />
        </div>

        <!-- No WA Pelanggan -->
        <div>
          <label for="session-customer-phone" class="block text-label-sm text-on-surface-variant mb-2"
            style="text-transform:uppercase;letter-spacing:.05em;font-size:11px;">
            No. WhatsApp (Opsional)
          </label>
          <input id="session-customer-phone" type="text" bind:value={formCustomerPhone} placeholder="08..." class="input-field w-full rounded-lg text-sm bg-black/20 text-gray-200" />
        </div>

        <!-- Info -->
        <div class="px-4 py-3 rounded-xl text-label-sm"
          style="background:rgba(0,217,217,.06);border:1px solid rgba(0,217,217,.15);color:#8e8a96;line-height:1.6;">
          Data pelanggan akan tersimpan di dalam daftar sesi.
        </div>

        <div class="flex gap-3 pt-1">
          <button type="button" onclick={() => showNewModal=false} class="btn-secondary flex-1">Batal</button>
          <button type="submit" disabled={formLoading || !formCustomerName} class="btn-primary flex-1"
            style="{(formLoading||!formCustomerName)?'opacity:.6;cursor:not-allowed;':''}">
            {#if formLoading}
              <svg class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Membuat…
            {:else}
              Buat Sesi
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- ── Modal hapus ───────────────────────────────────────────────────────── -->
{#if deleteTarget}
  <ConfirmModal
    title="Hapus Sesi?"
    message="Sesi milik <strong>{deleteTarget.userName}</strong> ({formatDate(deleteTarget.date)}) akan dihapus beserta semua fotonya."
    confirmLabel="Hapus"
    onConfirm={handleDelete}
    onCancel={() => deleteTarget = null}
  />
{/if}

<!-- ── Modal QR Galeri ───────────────────────────────────────────────────────── -->
{#if qrTarget}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background:var(--admin-modal-backdrop);backdrop-filter:blur(8px);"
    onclick={(e) => { if (e.target===e.currentTarget) qrTarget=null; }}
    onkeydown={(e) => e.key==='Escape' && (qrTarget=null)}
    role="dialog" aria-modal="true" aria-labelledby="qr-session-title">

    <div class="w-full max-w-sm rounded-3xl p-8 relative flex flex-col items-center text-center"
      style="background:var(--admin-card-bg);border:1px solid var(--admin-card-border);box-shadow:0 24px 60px rgba(0,0,0,.6);">

      <!-- Close btn -->
      <button onclick={() => qrTarget=null}
        class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface"
        style="background:var(--admin-close-bg);" aria-label="Tutup">✕</button>

      <!-- Title -->
      <h2 id="qr-session-title" class="text-xl font-bold mb-2 flex items-center justify-center gap-2" style="color: #00d9d9; font-family: 'Space Grotesk', sans-serif;">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
        Scan QR Galeri
      </h2>
      <p class="text-sm text-on-surface-variant mb-6">Pelanggan: <strong class="text-on-surface">{qrTarget.userName}</strong></p>

      <!-- QR Image -->
      <div class="p-4 rounded-2xl mb-6 bg-white w-56 h-56 flex items-center justify-center" style="border: 2px dashed var(--admin-card-border);">
        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '' + '/my-gallery/' + qrTarget.id)}`} alt="QR Code" class="w-48 h-48" />
      </div>

      <!-- Link Copy -->
      <p class="text-xs text-on-surface-variant mb-2">Atau salin link galeri di bawah ini:</p>
      <div class="flex w-full mb-6">
        <input type="text" readonly value="{typeof window !== 'undefined' ? window.location.origin : ''}/my-gallery/{qrTarget.id}" class="flex-1 px-3 py-2 text-xs bg-black/20 text-gray-300 border border-gray-600 border-r-0 outline-none" style="border-top-left-radius: 8px; border-bottom-left-radius: 8px;" />
        <button onclick={() => navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : ''}/my-gallery/${qrTarget.id}`)} class="px-4 bg-[#3b82f6] text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1" style="border-top-right-radius: 8px; border-bottom-right-radius: 8px;">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          Copy
        </button>
      </div>

      <!-- Open Browser -->
      <a href="/my-gallery/{qrTarget.id}" target="_blank" class="w-full py-3 rounded-full font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity" style="background: #10b981; text-decoration: none;">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        Buka Galeri di Browser
      </a>
    </div>
  </div>
{/if}

<section class="min-h-screen relative">
  <div class="relative max-w-container mx-auto px-5 md:px-8 py-10">

    <AdminBreadcrumb current="Sesi &amp; Galeri">
      <button onclick={openNewModal} class="btn-primary" style="height:44px;padding:0 20px;font-size:14px;">
        + Sesi Baru
      </button>
    </AdminBreadcrumb>

    <div class="mb-6 max-w-sm">
      <SearchInput bind:value={search} placeholder="Cari pengguna, frame, atau tanggal…" id="sessions-search" />
    </div>

    {#if loading}
      <div class="space-y-3">
        {#each Array(5) as _}
          <div class="animate-pulse rounded-xl" style="height:64px;background:var(--admin-card-bg);border:1px solid var(--admin-card-border);"></div>
        {/each}
      </div>
    {:else if filtered.length > 0}
      <div class="rounded-2xl overflow-hidden" style="border:1px solid var(--admin-card-border);">
        <div class="hidden md:grid px-5 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider"
          style="grid-template-columns:1.5fr 1fr 1fr 80px 300px;gap:12px;background:var(--admin-input-bg);border-bottom:1px solid var(--admin-card-border);align-items:center;">
          <span>Pelanggan</span><span>Status Kunjungan</span><span>Waktu Sesi</span><span class="text-center">Foto</span><span class="text-right">Aksi</span>
        </div>

        {#each filtered as s, i (s.id)}
          <div class="flex flex-col md:grid items-start md:items-center gap-4 px-4 py-4 md:px-5 md:py-4 relative"
            style="
              grid-template-columns:1.5fr 1fr 1fr 80px 300px;
              gap:12px;
              background:{i%2===0?'var(--admin-row-even)':'var(--admin-row-odd)'};
              border-bottom:{i<filtered.length-1?'1px solid var(--admin-card-border)':'none'};
            ">
            <!-- Left Accent Bar (for active session) -->
            {#if s.status === 'active'}
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-[#10b981]"></div>
            {/if}

            <!-- Pelanggan -->
            <div class="flex flex-col min-w-0">
              <p class="text-on-surface text-sm font-bold truncate">{s.userName}</p>
              {#if s.userPhone}
                <div class="flex items-center gap-1 text-on-surface-variant text-xs mt-1">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/></svg>
                  <span>{s.userPhone}</span>
                </div>
              {/if}
              <div class="flex items-center gap-1 text-on-surface-variant text-xs mt-0.5">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>{formatDate(s.date)}</span>
              </div>
            </div>

            <!-- Status Kunjungan -->
            <div class="flex flex-col gap-1 items-start">
              <div class="flex items-center gap-2">
                {#if s.status === 'active'}
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-[#3b82f6]">DI BILIK</span>
                {:else if s.status === 'pending'}
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-orange-500">MENUNGGU</span>
                {:else if s.status === 'completed'}
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold text-gray-500 bg-gray-200 dark:bg-gray-700">SELESAI</span>
                {:else}
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-red-500">DIBATALKAN</span>
                {/if}
              </div>
              {#if s.payment_status === 'unpaid'}
                <span class="px-2 py-0.5 rounded text-[10px] font-bold text-[#e11d48] bg-[#ffe4e6] dark:bg-[#e11d48]/20 mt-1">BELUM BAYAR</span>
              {:else}
                <span class="px-2 py-0.5 rounded text-[10px] font-bold text-[#10b981] bg-[#10b981]/20 mt-1">LUNAS</span>
              {/if}
            </div>

            <!-- Waktu Sesi -->
            <div class="flex flex-col gap-0.5 items-start">
              {#if timers[s.id] !== undefined}
                <div class="flex items-center gap-2">
                  <span class="relative flex h-2.5 w-2.5">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d9d9] opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00d9d9]"></span>
                  </span>
                  <p class="text-[#00d9d9] font-mono font-bold text-sm tracking-widest">{formatTimeLeft(timers[s.id])}</p>
                </div>
              {:else}
                <p class="text-on-surface-variant text-xs">—</p>
              {/if}
            </div>

            <!-- Foto / Frame -->
            <div class="flex flex-col items-center justify-center text-on-surface-variant text-sm font-semibold">
              <span>{s.photoCount > 0 ? s.photoCount + ' Foto' : '-'}</span>
              {#if s.frameCount > 0}
                <span class="text-xs text-[#00d9d9] mt-1">{s.frameCount} Frame</span>
                <span class="text-xs text-green-400">Rp {(s.frameCount * 5000).toLocaleString('id-ID')}</span>
              {/if}
            </div>

            <!-- Aksi -->
            <div class="flex justify-end gap-2 shrink-0 w-full md:w-auto">
              {#if s.payment_status === 'unpaid'}
                <button onclick={() => handleMarkPaid(s)} class="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#10b981] hover:opacity-80 transition-opacity whitespace-nowrap">
                  Lunas
                </button>
              {/if}
              {#if s.status === 'pending'}
                <button onclick={() => handleActivate(s)} class="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#3b82f6] hover:opacity-80 transition-opacity whitespace-nowrap">
                  Aktifkan Sesi
                </button>
              {/if}
              {#if s.status === 'active'}
                <button onclick={() => handleStop(s)} class="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gray-600 hover:opacity-80 transition-opacity whitespace-nowrap">
                  Stop Sesi
                </button>
              {/if}
              <button onclick={() => qrTarget = s} class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#8b5cf6] hover:opacity-80 transition-opacity whitespace-nowrap">
                Galeri
              </button>
              <button onclick={() => deleteTarget = s} class="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg text-white bg-[#e11d48] hover:opacity-80 transition-opacity" title="Hapus sesi">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        {/each}
      </div>
      <p class="text-label-sm text-on-surface-variant mt-3">{filtered.length} sesi</p>
    {:else}
      <EmptyState title="Belum ada sesi." description="Klik '+ Sesi Baru' untuk memulai sesi photobooth pertama.">
        <button onclick={openNewModal} class="btn-primary">+ Sesi Baru</button>
      </EmptyState>
    {/if}

  </div>
</section>

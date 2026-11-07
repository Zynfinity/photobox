<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth';
  // GET /api/sessions → { data: BackendSession[], meta: {...} }
  type BackendSession = {
    id: string;
    frame_id: string | null;
    user_id: string;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    created_at: string;
    updated_at: string | null;
    frame_name: string | null;
    user_name: string;
    photo_count: number;
  };

  type Session = {
    id: string;
    date: string;
    label?: string;
    photoCount: number;
    coverSrc?: string;
    totalSize?: string;
  };
  let sessions: Session[] = $state([]);
  let loading = $state(true);
  let currentUser = $state<{ name: string; email: string; role: string } | null>(null);
  let token = $state<string | null>(null);

  auth.user.subscribe((u) => (currentUser = u));
  auth.token.subscribe((t) => (token = t));
  function mapSession(s: BackendSession): Session {
    return {
      id: s.id,
      date: s.created_at.split('T')[0] ?? s.created_at,
      label: s.frame_name ?? undefined,
      photoCount: s.photo_count ?? 0,
    };
  }
  function formatDate(iso: string): string {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }).format(new Date(iso));
    } catch { return iso; }
  }

  function formatDateShort(iso: string): string {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
      }).format(new Date(iso));
    } catch { return iso; }
  }

  const sessionGradients = [
    'linear-gradient(135deg, #6b1b7a 0%, #d946ef 60%, #ff006e 100%)',
    'linear-gradient(135deg, #004d4d 0%, #00d9d9 60%, #d946ef 100%)',
    'linear-gradient(135deg, #8b0050 0%, #ff006e 60%, #d946ef 100%)',
    'linear-gradient(135deg, #1f1a28 0%, #6b1b7a 50%, #d946ef 100%)',
    'linear-gradient(135deg, #003333 0%, #00d9d9 100%)',
    'linear-gradient(135deg, #4d0030 0%, #ff006e 100%)',
  ];
  onMount(async () => {
    if (!token) {
      goto('/login?redirect=/my-gallery');
      return;
    }

    try {
      // GET /api/sessions — backend otomatis filter berdasarkan user dari JWT
      const res = await fetch(`https://panel.tail11f9ba.ts.net/api/sessions?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        auth.logout();
        goto('/login?redirect=/my-gallery');
        return;
      }

      const d = await res.json();
      const raw: BackendSession[] = d.data ?? d ?? [];
      sessions = raw.map(mapSession);
    } catch {
      sessions = [];
    } finally {
      loading = false;
    }
  });
  let displaySessions = $derived(sessions);
</script>

<svelte:head>
  <title>VELVET.FILM — Galeri Saya</title>
  <meta name="description" content="Galeri sesi photobooth pribadi kamu dari VELVET.FILM." />
</svelte:head>

<section class="min-h-screen relative" style="background: linear-gradient(180deg, #1a1625 0%, #0f0d15 100%);">
  <div class="absolute top-0 left-0 right-0 h-72 pointer-events-none overflow-hidden">
    <div class="absolute top-0 left-1/4 w-3/4 h-full opacity-10"
      style="background: radial-gradient(ellipse, #00d9d9 0%, transparent 70%); filter: blur(70px);"></div>
    <div class="absolute top-0 right-0 w-1/2 h-full opacity-8"
      style="background: radial-gradient(ellipse, #d946ef 0%, transparent 70%); filter: blur(80px);"></div>
  </div>

  <div class="relative max-w-container mx-auto px-5 md:px-8 py-12">

    <header class="mb-10">
      <p class="section-label mb-3">Galeri Pribadi</p>
      <h1 class="text-on-surface"
        style="font-family: 'Instrument Serif', serif; font-size: clamp(32px, 5vw, 52px); line-height: 1.1; letter-spacing: -0.015em;">
        Sesi Foto
        {#if currentUser?.name}
          <em style="font-style: italic; color: #00d9d9;">{currentUser.name}</em>
        {:else}Kamu{/if}
      </h1>
      <p class="text-on-surface-variant text-body-md mt-2">Pilih sesi untuk melihat dan download foto kamu.</p>

      {#if !loading}
        <p class="text-label-md text-on-surface-variant mt-4">
          {sessions.length} sesi tersimpan
        </p>
      {/if}
    </header>

    <!-- Loading skeleton -->
    {#if loading}
      <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {#each Array(4) as _}
          <div class="animate-pulse rounded-2xl" style="background: #1f1a28; border: 1px solid #49454e; height: 220px;"></div>
        {/each}
      </div>

    <!-- Session grid -->
    {:else if displaySessions.length > 0}
      <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {#each displaySessions as session, i (session.id)}
          <a
            href="/gallery/{session.id}"
            id="session-card-{session.id}"
            class="group block rounded-2xl overflow-hidden transition-all duration-300"
            style="background: #1f1a28; border: 1px solid #49454e; box-shadow: 0 4px 12px rgba(0,0,0,0.4); text-decoration: none;"
            onmouseenter={(e) => {
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,.6), 0 0 20px rgba(0,217,217,.08)';
              e.currentTarget.style.borderColor = 'rgba(0,217,217,.25)';
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onmouseleave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.4)';
              e.currentTarget.style.borderColor = '#49454e';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <!-- Cover -->
            <div class="relative overflow-hidden" style="height: clamp(100px, 28vw, 160px);">
              {#if session.coverSrc}
                <img loading="lazy" src={session.coverSrc} alt="Cover sesi {session.date}"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div class="absolute inset-0" style="background: linear-gradient(to bottom, transparent 40%, rgba(10,8,16,.85) 100%);"></div>
              {:else}
                <div class="w-full h-full transition-transform duration-500 group-hover:scale-105"
                  style="background: {sessionGradients[i % sessionGradients.length]};"></div>
                <div class="absolute inset-0 opacity-10"
                  style="background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,.6) 3px, rgba(0,0,0,.6) 4px);"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <svg width="36" height="36" fill="none" viewBox="0 0 24 24" style="opacity:.22;">
                    <path d="M2.25 12.75V7.5A2.25 2.25 0 014.5 5.25h4.086c.464 0 .909.184 1.237.513l1.414 1.414c.328.328.773.513 1.237.513H19.5a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 19.5v-6.75z" fill="white"/>
                  </svg>
                </div>
                <div class="absolute inset-0" style="background: linear-gradient(to bottom, transparent 30%, rgba(10,8,16,.9) 100%);"></div>
              {/if}

              <!-- Badge jumlah foto -->
              <div class="absolute top-2 right-2">
                <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);color:#ede9f0;font-size:11px;font-weight:500;padding:3px 8px;border-radius:9999px;font-family:'Space Grotesk',sans-serif;">
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm-3 6.75h9.75A2.25 2.25 0 0022.5 16.5V7.5a2.25 2.25 0 00-2.25-2.25H9a2.25 2.25 0 00-2.25 2.25v9A2.25 2.25 0 008.25 18.75z"/>
                  </svg>
                  {session.photoCount}
                </span>
              </div>
            </div>

            <!-- Card body -->
            <div class="px-3 py-3 md:px-5 md:py-4">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <h2 class="text-on-surface font-semibold"
                    style="font-family:'Space Grotesk',sans-serif;font-size:clamp(12px,3vw,15px);line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">
                    {formatDate(session.date)}
                  </h2>
                  {#if session.label}
                    <p class="text-on-surface-variant mt-0.5 truncate" style="font-size:11px;line-height:16px;">{session.label}</p>
                  {/if}
                </div>
                <div class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                  style="background:rgba(0,217,217,.08);border:1px solid rgba(0,217,217,.2);">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#00d9d9" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                  </svg>
                </div>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <span style="background:#004d4d;color:#00ffff;font-size:10px;font-weight:500;letter-spacing:.05em;text-transform:uppercase;padding:2px 8px;border-radius:9999px;font-family:'Space Grotesk',sans-serif;white-space:nowrap;">
                  {formatDateShort(session.date)}
                </span>
                {#if session.totalSize}
                  <span class="text-on-surface-variant truncate" style="font-size:11px;">{session.totalSize}</span>
                {/if}
              </div>
            </div>
          </a>
        {/each}
      </div>

    <!-- Empty state -->
    {:else}
      <div class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style="background:rgba(0,217,217,.08);border:1px solid rgba(0,217,217,.2);">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#00d9d9" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M2.25 12.75V7.5A2.25 2.25 0 014.5 5.25h4.086c.464 0 .909.184 1.237.513l1.414 1.414c.328.328.773.513 1.237.513H19.5a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 19.5v-6.75z"/>
          </svg>
        </div>
        <h2 class="text-on-surface mb-2" style="font-family:'Instrument Serif',serif;font-size:28px;">Belum ada sesi foto.</h2>
        <p class="text-on-surface-variant text-body-md mb-6">Foto dari sesi photobooth kamu akan muncul di sini setelah event selesai.</p>
        <a href="/" class="btn-secondary">← Kembali ke Beranda</a>
      </div>
    {/if}

  </div>
</section>

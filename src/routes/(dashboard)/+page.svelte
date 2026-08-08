<script lang="ts">
  import { onMount } from 'svelte';
  import { adminGuard, authHeaders } from '$lib/adminGuard';
  import { formatDate, formatCurrency } from '$lib/utils';
  import AdminBreadcrumb from '$lib/components/AdminBreadcrumb.svelte';

  type Stats = {
    totalUsers: number;
    totalSessions: number;
    totalPhotos: number;
    totalFrames: number;
    todaySessions: number;
    totalRevenue: number;
    dailyActivity: { day: string; sessions: number; photos: number }[];
    framePopularity: { label: string; count: number }[];
    recentSessions: {
      id: string;
      customer_name: string;
      status: string;
      payment_status: string;
      created_at: string;
      photo_count: number;
      frame_count: number;
    }[];
  };

  let stats = $state<Stats | null>(null);
  let loading = $state(true);

  const IS_DEV = import.meta.env.DEV;

  onMount(async () => {
    if (!adminGuard()) return;
    try {
      const res = await fetch('https://panel.tail11f9ba.ts.net/api/sessions/stats', { headers: authHeaders() });
      if (res.ok) {
        stats = await res.json();
      }
    } catch { /* fallback to demo */ }
    finally { loading = false; }
  });

  // Demo data for dev mode
  const demoStats: Stats = {
    totalUsers: 48, totalSessions: 124, totalPhotos: 1380, totalFrames: 12,
    todaySessions: 3, totalRevenue: 620000,
    dailyActivity: [
      { day: '2026-08-01', sessions: 5, photos: 20 },
      { day: '2026-08-02', sessions: 3, photos: 12 },
      { day: '2026-08-03', sessions: 7, photos: 35 },
      { day: '2026-08-04', sessions: 4, photos: 18 },
      { day: '2026-08-05', sessions: 6, photos: 28 },
      { day: '2026-08-06', sessions: 2, photos: 10 },
      { day: '2026-08-07', sessions: 3, photos: 14 },
    ],
    framePopularity: [
      { label: 'Neon Pink Frame', count: 42 },
      { label: 'Minimalist White', count: 28 },
      { label: 'Gold Classic', count: 19 },
      { label: 'Neon Cyan Frame', count: 14 },
    ],
    recentSessions: [
      { id: 's1', customer_name: 'Ayu Pratiwi', status: 'completed', payment_status: 'paid', created_at: '2026-08-04', photo_count: 12, frame_count: 1 },
      { id: 's2', customer_name: 'Bima Santoso', status: 'active', payment_status: 'unpaid', created_at: '2026-08-04', photo_count: 8, frame_count: 2 },
    ],
  };

  let showDemo = $derived(!loading && !stats && IS_DEV);
  let d = $derived(showDemo ? demoStats : stats);

  // Chart helpers
  let dailyData = $derived(d?.dailyActivity ?? []);
  let maxSessions = $derived(Math.max(...dailyData.map(x => x.sessions), 1));
  let maxPhotos = $derived(Math.max(...dailyData.map(x => x.photos), 1));

  let framePop = $derived(d?.framePopularity ?? []);
  let frameMaxCount = $derived(Math.max(...framePop.map(f => f.count), 1));

  const frameColors = ['#ff006e', '#00d9d9', '#e8b800', '#d946ef', '#3b82f6'];

  function dayLabel(iso: string): string {
    try {
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      return days[new Date(iso).getDay()];
    } catch { return iso; }
  }

  const statCards = [
    { label: 'Total Sesi',      key: 'totalSessions', color: '#d946ef', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"/>` },
    { label: 'Total Foto',      key: 'totalPhotos',   color: '#ff006e', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>` },
    { label: 'Total Frame',     key: 'totalFrames',   color: '#3b82f6', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm-3 6.75h9.75A2.25 2.25 0 0022.5 16.5V7.5a2.25 2.25 0 00-2.25-2.25H9a2.25 2.25 0 00-2.25 2.25v9A2.25 2.25 0 008.25 18.75z"/>` },
    { label: 'Sesi Hari Ini',   key: 'todaySessions', color: '#00d9d9', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>` },
    { label: 'Total Pengguna',  key: 'totalUsers',    color: '#10b981', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>` },
    { label: 'Total Pendapatan', key: 'totalRevenue', color: '#e8b800', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>` },
  ];

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':    return { label: 'AKTIF', bg: '#3b82f6' };
      case 'completed': return { label: 'SELESAI', bg: '#6b7280' };
      case 'pending':   return { label: 'MENUNGGU', bg: '#f97316' };
      default:          return { label: 'DIBATALKAN', bg: '#e11d48' };
    }
  }
</script>

<svelte:head><title>FM.PHOTO — Statistik</title></svelte:head>

<section class="min-h-screen relative">
  <div class="relative max-w-container mx-auto px-5 md:px-8 py-10">

    <AdminBreadcrumb current="Statistik" backLabel="" />

    <!-- ── Stat Cards ── -->
    {#if loading}
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {#each Array(6) as _}
          <div class="animate-pulse rounded-2xl" style="height:104px;background:var(--admin-card-bg);border:1px solid var(--admin-card-border);"></div>
        {/each}
      </div>
    {:else if d}
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {#each statCards as card}
          {@const val = d[card.key as keyof typeof d]}
          <div class="rounded-2xl p-5 flex flex-col gap-3" style="background:var(--admin-card-bg);border:1px solid var(--admin-card-border);">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:{card.color}14;">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={card.color} stroke-width="2">
                {@html card.icon}
              </svg>
            </div>
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wider mb-1 text-on-surface-variant">{card.label}</p>
              <p class="font-bold leading-none" style="font-size:clamp(22px,3vw,30px);color:{card.color};">
                {card.key === 'totalRevenue' ? formatCurrency(val as number) : (typeof val === 'number' ? val.toLocaleString('id-ID') : val)}
              </p>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- ── Charts Row ── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">

      <!-- Bar Chart: Aktivitas 7 Hari Terakhir -->
      <div class="rounded-2xl p-5" style="background:var(--admin-card-bg);border:1px solid var(--admin-card-border);">
        <div class="flex items-center justify-between mb-5">
          <p class="text-sm font-semibold text-on-surface">Aktivitas 7 Hari Terakhir</p>
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1.5 text-[10px] font-medium text-on-surface-variant">
              <span class="w-2.5 h-2.5 rounded-sm" style="background:#00d9d9;"></span> Sesi
            </span>
            <span class="flex items-center gap-1.5 text-[10px] font-medium text-on-surface-variant">
              <span class="w-2.5 h-2.5 rounded-sm" style="background:#d946ef;"></span> Foto
            </span>
          </div>
        </div>
        <div class="flex items-end gap-2" style="height:160px;">
          {#if dailyData.length > 0}
            {#each dailyData as day}
              <div class="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div class="w-full flex gap-0.5 items-end flex-1">
                  <div class="flex-1 flex flex-col items-center justify-end h-full">
                    <span class="text-[9px] font-bold mb-0.5" style="color:#00d9d9;">{day.sessions}</span>
                    <div class="w-full rounded-t-md transition-all duration-500"
                      style="height:{(day.sessions / maxSessions) * 100}%;background:linear-gradient(180deg,#00d9d9,#00b8b8);min-height:4px;"></div>
                  </div>
                  <div class="flex-1 flex flex-col items-center justify-end h-full">
                    <span class="text-[9px] font-bold mb-0.5" style="color:#d946ef;">{day.photos}</span>
                    <div class="w-full rounded-t-md transition-all duration-500"
                      style="height:{(day.photos / maxPhotos) * 100}%;background:linear-gradient(180deg,#d946ef,#b030cc);min-height:4px;"></div>
                  </div>
                </div>
                <span class="text-[10px] font-semibold mt-1 text-on-surface-variant">{dayLabel(day.day)}</span>
              </div>
            {/each}
          {:else}
            <div class="w-full h-full flex items-center justify-center">
              <p class="text-on-surface-variant text-sm">Belum ada data aktivitas.</p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Horizontal Chart: Frame Terpopuler -->
      <div class="rounded-2xl p-5" style="background:var(--admin-card-bg);border:1px solid var(--admin-card-border);">
        <p class="text-sm font-semibold mb-5 text-on-surface">Frame Terpopuler</p>
        {#if framePop.length > 0}
          <div class="space-y-4">
            {#each framePop as frame, i}
              {@const color = frameColors[i % frameColors.length]}
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[13px] font-medium text-on-surface">{frame.label}</span>
                  <span class="text-[12px] font-bold" style="color:{color};">{frame.count} sesi</span>
                </div>
                <div class="w-full rounded-full overflow-hidden" style="height:8px;background:var(--admin-input-bg);">
                  <div class="h-full rounded-full transition-all duration-700"
                    style="width:{(frame.count / frameMaxCount) * 100}%;background:linear-gradient(90deg,{color},{color}aa);"></div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-on-surface-variant text-sm text-center py-8">Belum ada data frame.</p>
        {/if}
      </div>
    </div>

    <!-- ── Sesi Terbaru ── -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <p class="text-[11px] font-bold tracking-[0.12em] uppercase text-on-surface-variant">Sesi Terbaru</p>
        <a href="/sessions" class="text-xs font-semibold transition-opacity hover:opacity-70" style="color:#00d9d9;">
          Lihat semua →
        </a>
      </div>

      {#if loading}
        <div class="space-y-2">
          {#each Array(4) as _}
            <div class="animate-pulse rounded-xl" style="height:60px;background:var(--admin-card-bg);border:1px solid var(--admin-card-border);"></div>
          {/each}
        </div>
      {:else if d && d.recentSessions.length > 0}
        <div class="rounded-2xl overflow-hidden" style="border:1px solid var(--admin-card-border);">
          {#each d.recentSessions as s, i (s.id)}
            {@const badge = getStatusBadge(s.status)}
            <div class="flex items-center gap-3 px-5 py-3.5"
              style="background:{i % 2 === 0 ? 'var(--admin-row-even)' : 'var(--admin-row-odd)'};border-bottom:{i < d.recentSessions.length - 1 ? '1px solid var(--admin-card-border)' : 'none'};">
              <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold" style="background:rgba(0,217,217,0.12);color:#00d9d9;border:1px solid rgba(0,217,217,0.2);">
                {s.customer_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold truncate text-on-surface">{s.customer_name ?? '—'}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style="background:{badge.bg};">{badge.label}</span>
                  {#if s.payment_status === 'unpaid'}
                    <span class="text-[9px] font-bold" style="color:#e11d48;">BELUM BAYAR</span>
                  {:else}
                    <span class="text-[9px] font-bold" style="color:#10b981;">LUNAS</span>
                  {/if}
                </div>
              </div>
              <div class="shrink-0 text-right hidden sm:block">
                <p class="text-[11px] text-on-surface-variant">{formatDate(s.created_at)}</p>
                <p class="text-[11px] font-semibold text-on-surface-variant">{s.photo_count} foto · {s.frame_count} frame</p>
              </div>
              <a href="/sessions/{s.id}" class="shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="var(--admin-card-border)" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                </svg>
              </a>
            </div>
          {/each}
        </div>
      {:else}
        <div class="rounded-2xl px-6 py-10 text-center" style="background:var(--admin-card-bg);border:1px solid var(--admin-card-border);">
          <p class="text-on-surface-variant">Belum ada sesi yang tercatat.</p>
        </div>
      {/if}
    </div>

  </div>
</section>

<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let sessionId = $derived($page.params.sessionId);
  let session = $state<any>(null);
  let allSessions = $state<any[]>([]);
  let frames = $state<Record<string, any>>({});
  let loading = $state(true);
  let error = $state(false);

  onMount(async () => {
    try {
      // 1. Fetch related sessions
      const custRes = await fetch(`https://panel.tail11f9ba.ts.net/api/sessions/related/${sessionId}`);
      if (custRes.ok) {
        const fetchedSessions = await custRes.json();
        
        let framesList = [];
        for (const s of fetchedSessions) {
          if (s.session_frames && s.session_frames.length > 0) {
            for (const sf of s.session_frames) {
              const sfPhotos = s.photos ? s.photos.filter((p: any) => p.session_frame_id === sf.session_frame_id) : [];
              framesList.push({
                ...s,
                session_frame_id: sf.session_frame_id,
                frame_id: sf.frame_id,
                created_at: sf.created_at,
                photos: sfPhotos,
                parent_session_id: s.id
              });
            }
          } else {
             framesList.push(s);
          }
        }
        
        allSessions = framesList;
        session = fetchedSessions.find((s: any) => s.id === sessionId) || fetchedSessions[0];
      } else {
        throw new Error('Failed to load sessions');
      }

      // 2. Fetch unique frames
      const uniqueFrameIds = [...new Set(allSessions.map((s: any) => s.frame_id).filter(Boolean))];
      await Promise.all(uniqueFrameIds.map(async (fId) => {
        const frameRes = await fetch(`https://panel.tail11f9ba.ts.net/api/frames/${fId}`);
        if (frameRes.ok) {
          const frameData = await frameRes.json();
          if (frameData.description) {
            try {
              const parsed = JSON.parse(frameData.description);
              frameData.holes = parsed.holes || [];
            } catch (e) {
              frameData.holes = [];
            }
          }
          frames[fId as string] = frameData;
        }
      }));
    } catch (e) {
      console.error(e);
      error = true;
    } finally {
      loading = false;
    }
  });

  function formatDate(iso: string): string {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }
</script>

<svelte:head>
  <title>Galeri - FMPhoto</title>
</svelte:head>

<div class="min-h-screen p-6 md:p-12 flex flex-col items-center w-full" style="background: var(--admin-page-bg); font-family: 'Space Grotesk', sans-serif;">
  {#if loading}
    <div class="flex flex-col items-center justify-center mt-32 gap-4">
      <p style="color: #00d9d9; font-size: 14px; font-weight: 600;">MEMUAT GALERI...</p>
    </div>
  {:else if error || !session}
    <div class="flex flex-col items-center justify-center mt-32 gap-4 text-center">
      <p style="color: #ff4757; font-size: 16px; font-weight: 600;">Sesi tidak ditemukan.</p>
    </div>
  {:else}
    {#if session.payment_status !== 'paid'}
      <div class="flex flex-col items-center justify-center mt-32 gap-6 text-center max-w-md mx-auto p-8 rounded-3xl shadow-2xl" style="background: var(--admin-card-bg); border: 1px solid var(--admin-card-border);">
        <div class="w-16 h-16 rounded-full flex items-center justify-center mb-2" style="background: rgba(225, 29, 72, 0.1); color: #e11d48;">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-on-surface">Menunggu Pembayaran</h2>
        <p class="text-on-surface-variant text-sm leading-relaxed mb-2">Halo Kak <span style="color: #00d9d9; font-weight: 700;">{session.customer_name || 'Guest'}</span>!<br>Silakan selesaikan pembayaran terlebih dahulu di kasir untuk dapat melihat dan mengunduh foto Anda.</p>
      </div>
    {:else}
      <header class="text-center mb-10 mt-4 leading-relaxed">
        <h1 class="text-3xl md:text-4xl mb-4 font-bold" style="color: #00d9d9; letter-spacing: -0.02em;">FMPhoto</h1>
        <h2 class="text-xl md:text-2xl font-medium" style="color: var(--admin-text);">
          Galeri Kak <span style="color: #00d9d9; font-weight: 700;">{session.customer_name || 'Guest'}</span>
        </h2>
      </header>

    <div class="flex flex-wrap justify-center gap-4 md:gap-8 w-full max-w-6xl mx-auto">
      {#each allSessions as s, idx}
        <!-- Card -->
        <div class="flex flex-col items-center rounded-2xl shadow-xl transition-transform hover:-translate-y-1 w-[calc(50%-8px)] sm:w-[calc(33.33%-11px)] lg:w-[calc(25%-24px)] max-w-[240px] p-3 pb-4 md:p-4 md:pb-5" style="background: var(--admin-card-bg); border: 1px solid var(--admin-card-border);">
          <!-- Photostrip Render -->
          <div class="relative overflow-hidden mb-3 md:mb-5 w-full" style="border-radius: 10px; background: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            {#if s.photos && s.photos.find((p: any) => p.original_name === 'final_frame.jpg')}
              <img 
                src={`https://panel.tail11f9ba.ts.net/uploads/${s.photos.find((p: any) => p.original_name === 'final_frame.jpg').filename}`} 
                alt="Photostrip" 
                class="w-full h-auto object-cover block" 
              />
              <a href="/my-gallery/detail/{s.parent_session_id || s.id}?frame={s.session_frame_id || ''}&base={sessionId}" class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm" style="background: rgba(0,0,0,0.6); text-decoration: none;">
                <span class="px-5 py-2.5 font-bold text-sm rounded-full shadow-lg flex items-center gap-2 text-white" style="background: #00d9d9; font-family: 'Space Grotesk', sans-serif;">
                  Lihat Detail
                </span>
              </a>
            {:else if s.frame_id && frames[s.frame_id] && frames[s.frame_id].holes}
              {#each frames[s.frame_id].holes as hole, i}
                {#if s.photos && s.photos.filter((p: any) => p.original_name !== 'final_frame.jpg')[i]}
                  <img 
                    src={`https://panel.tail11f9ba.ts.net/uploads/${s.photos.filter((p: any) => p.original_name !== 'final_frame.jpg')[i].filename}`}
                    class="absolute object-cover" 
                    style="top:{hole.y}%; left:{hole.x}%; width:{hole.w}%; height:{hole.h}%; z-index:5;" 
                    alt="Captured {i}" 
                  />
                {/if}
              {/each}
              <img 
                src={`https://panel.tail11f9ba.ts.net/uploads/${frames[s.frame_id].filename}`} 
                alt="Frame" 
                class="relative w-full h-auto block object-cover z-10 pointer-events-none" 
              />
              <a href="/my-gallery/detail/{s.parent_session_id || s.id}?frame={s.session_frame_id || ''}&base={sessionId}" class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm z-20" style="background: rgba(0,0,0,0.6); text-decoration: none;">
                <span class="px-5 py-2.5 font-bold text-sm rounded-full shadow-lg flex items-center gap-2 text-white" style="background: #00d9d9; font-family: 'Space Grotesk', sans-serif;">
                  Lihat Detail
                </span>
              </a>
            {:else}
              <!-- Fallback if no frame layout -->
              <div class="w-full flex flex-col items-center p-1 gap-1 bg-black">
                {#if s.photos}
                  {#each s.photos.filter((p: any) => p.original_name !== 'final_frame.jpg' && p.original_name !== 'boomerang.mp4' && p.original_name !== 'boomerang.gif') as photo}
                    <img src={`https://panel.tail11f9ba.ts.net/uploads/${photo.filename}`} class="w-full h-auto block object-cover rounded flex-1" alt="Photo" />
                  {/each}
                {/if}
              </div>
              <a href="/my-gallery/detail/{s.parent_session_id || s.id}?frame={s.session_frame_id || ''}&base={sessionId}" class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm z-20" style="background: rgba(0,0,0,0.6); text-decoration: none;">
                <span class="px-5 py-2.5 font-bold text-sm rounded-full shadow-lg flex items-center gap-2 text-white" style="background: #00d9d9; font-family: 'Space Grotesk', sans-serif;">
                  Lihat Detail
                </span>
              </a>
            {/if}
          </div>

          <!-- Info Badge -->
          <div class="flex flex-col items-center text-center gap-2 mt-1">
            <span style="color: var(--admin-text); font-weight: 600; font-size: 16px;">
              Sesi #{idx + 1}
            </span>
            <span style="color: var(--admin-text-muted); font-size: 13px; font-weight: 500;">
              {formatDate(s.created_at)}
            </span>
            <a href="/my-gallery/detail/{s.parent_session_id || s.id}?frame={s.session_frame_id || ''}&base={sessionId}" class="mt-3 btn-primary !h-10 text-sm w-full" style="text-decoration: none;">
              Lihat Detail
            </a>
          </div>
        </div>
      {/each}
    </div>
    {/if}
  {/if}
</div>

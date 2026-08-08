<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let id = $derived($page.params.id);
  let baseId = $derived($page.url.searchParams.get('base') || id);
  let frameIdQuery = $derived($page.url.searchParams.get('frame') || '');
  let session = $state<any>(null);
  let frameData = $state<any>(null);
  let loading = $state(true);
  let error = $state(false);
  let generatingBoomerang = $state(false);

  async function generateBoomerang() {
    if (!session || generatingBoomerang) return;
    generatingBoomerang = true;
    try {
      const res = await fetch(`https://panel.tail11f9ba.ts.net/api/sessions/${session.id}/boomerang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_frame_id: frameIdQuery })
      });
      if (res.ok) {
        // Reload page to fetch new photos
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal membuat boomerang');
      }
    } catch (e) {
      alert('Gagal membuat boomerang');
    } finally {
      generatingBoomerang = false;
    }
  }

  // Derive final frame and individual photos
  let finalFrame = $derived(session?.photos?.find((p: any) => p.original_name === 'final_frame.jpg' && (!frameIdQuery || p.session_frame_id === frameIdQuery)));
  let singlePhotos = $derived(session?.photos?.filter((p: any) => p.original_name !== 'final_frame.jpg' && p.original_name !== 'boomerang.mp4' && p.original_name !== 'boomerang.gif' && (!frameIdQuery || p.session_frame_id === frameIdQuery)) || []);
  let boomerang = $derived(session?.photos?.find((p: any) => (p.original_name === 'boomerang.mp4' || p.original_name === 'boomerang.gif') && (!frameIdQuery || p.session_frame_id === frameIdQuery)));

  onMount(async () => {
    try {
      // Fetch related sessions using the id
      const res = await fetch(`https://panel.tail11f9ba.ts.net/api/sessions/related/${id}`);
      if (res.ok) {
        const allSessions = await res.json();
        session = allSessions.find((s: any) => s.id === id);
        if (!session) throw new Error('Session not found in related list');
        
        let targetFrameId = session.frame_id;
        
        if (frameIdQuery && session.session_frames) {
          const sf = session.session_frames.find((f: any) => f.session_frame_id === frameIdQuery);
          if (sf) targetFrameId = sf.frame_id;
        }
        
        // Fetch frame details if session has a frame
        if (targetFrameId) {
          const frameRes = await fetch(`https://panel.tail11f9ba.ts.net/api/frames/${targetFrameId}`);
          if (frameRes.ok) {
            frameData = await frameRes.json();
            if (frameData.description) {
              try {
                const parsed = JSON.parse(frameData.description);
                frameData.holes = parsed.holes || [];
              } catch (e) {
                frameData.holes = [];
              }
            }
          }
        }
      } else {
        throw new Error('Failed to load session');
      }
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
  <title>Detail Sesi - FMPhoto</title>
</svelte:head>

<div class="min-h-screen w-full flex flex-col items-center p-4 md:p-8" style="background: var(--admin-page-bg); font-family: 'Space Grotesk', sans-serif;">
  
  <!-- Header -->
  <header class="text-center mb-8 mt-4 leading-relaxed w-full">
    <h1 class="text-3xl md:text-4xl mb-4 font-bold" style="color: #00d9d9; letter-spacing: -0.02em;">FMPhoto</h1>
    <h2 class="text-xl md:text-2xl font-medium" style="color: var(--admin-text);">
      Galeri Kak <span style="color: #00d9d9; font-weight: 700;">{session?.customer_name || 'Guest'}</span>
    </h2>
  </header>

  {#if loading}
    <div class="flex flex-col items-center justify-center mt-20 gap-4">
      <p style="color: #00d9d9; font-size: 14px; font-weight: 600;">MEMUAT SESI...</p>
    </div>
  {:else if error || !session}
    <div class="flex flex-col items-center justify-center mt-20 gap-4 text-center">
      <p style="color: #ff4757; font-size: 16px; font-weight: 600;">Sesi tidak ditemukan.</p>
      <a href="/my-gallery/{baseId}" class="btn-primary" style="text-decoration: none;">
        Kembali ke Galeri
      </a>
    </div>
  {:else}
    <!-- Content Area -->
    <div class="w-full max-w-5xl">
      <!-- Top Bar: Back & Info -->
      <div class="flex justify-between items-end mb-6">
        <a href="/my-gallery/{baseId}" class="btn-secondary !h-10 !px-5" style="text-decoration: none;">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Kembali
        </a>
        <div class="text-right">
          <div style="color: #00d9d9; font-weight: 700; font-size: 15px;">Sesi Terpilih</div>
          <div style="color: var(--admin-text-muted); font-size: 13px; font-weight: 500;">{formatDate(session.created_at)}</div>
        </div>
      </div>

      <!-- Main Card -->
      <div class="flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 gap-8" style="background: var(--admin-card-bg); border: 1px solid var(--admin-card-border);">
        
        <!-- Left Column: Photostrip -->
        <div class="flex flex-col items-center shrink-0 w-full md:w-auto">
          <div class="rounded-xl overflow-hidden shadow-2xl mb-6 bg-black w-40 sm:w-48 md:w-56 lg:w-[260px]" style="border: 1px solid var(--admin-card-border);">
            {#if finalFrame}
              <img src={`https://panel.tail11f9ba.ts.net/uploads/${finalFrame.filename}`} class="w-full h-auto block object-cover" alt="Photostrip" />
            {:else if frameData && frameData.holes}
              <div class="relative w-full">
                {#each frameData.holes as hole, i}
                  {#if singlePhotos[i]}
                    <img 
                      src={`https://panel.tail11f9ba.ts.net/uploads/${singlePhotos[i].filename}`}
                      class="absolute object-cover" 
                      style="top:{hole.y}%; left:{hole.x}%; width:{hole.w}%; height:{hole.h}%; z-index:5;" 
                      alt="Captured {i}" 
                    />
                  {/if}
                {/each}
                <img 
                  src={`https://panel.tail11f9ba.ts.net/uploads/${frameData.filename}`} 
                  alt="Frame" 
                  class="relative w-full h-auto block object-cover z-10 pointer-events-none" 
                />
              </div>
            {:else}
              <div class="w-full flex flex-col items-center p-1 gap-1 bg-black">
                {#each singlePhotos as photo}
                  <img src={`https://panel.tail11f9ba.ts.net/uploads/${photo.filename}`} class="w-full h-auto object-cover rounded flex-1" alt="Photo" />
                {/each}
              </div>
            {/if}
          </div>

          <div class="flex flex-col gap-3 w-40 sm:w-48 md:w-56 lg:w-[260px]">
            <a 
              href={finalFrame ? `https://panel.tail11f9ba.ts.net/api/photos/${finalFrame.id}/download` : '#'} 
              class="btn-primary !h-12 w-full mt-auto text-sm"
              style="cursor: {finalFrame ? 'pointer' : 'not-allowed'}; text-decoration: none; opacity: {finalFrame ? '1' : '0.5'};"
            >
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download Photostrip
            </a>
          </div>
        </div>

        <!-- Right Column: Boomerang & Singles -->
        <div class="flex-1 flex flex-col gap-8">
          
          <!-- Boomerang Section -->
          <div class="flex flex-col items-center md:items-start">
            <h3 class="flex items-center gap-2 mb-4 font-bold text-sm" style="color: #00d9d9;">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Boomerang
            </h3>
            
            {#if boomerang}
              <div class="rounded-xl overflow-hidden border-[4px] shadow-lg mb-4" style="width: 240px; aspect-ratio: 4/3; background: #000; border-color: var(--admin-card-border);">
                {#if boomerang.filename.endsWith('.mp4')}
                  <video src={`https://panel.tail11f9ba.ts.net/uploads/${boomerang.filename}`} autoplay loop muted playsinline class="w-full h-full object-cover"></video>
                {:else}
                  <img src={`https://panel.tail11f9ba.ts.net/uploads/${boomerang.filename}`} class="w-full h-full object-cover" alt="Boomerang" />
                {/if}
              </div>
              <a 
                href={`https://panel.tail11f9ba.ts.net/api/photos/${boomerang.id}/download`} 
                class="btn-primary !h-12 w-[240px]" style="text-decoration: none;"
              >
                <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download Boomerang
              </a>
            {:else}
              <div class="rounded-xl flex flex-col items-center justify-center text-sm font-medium border-2 border-dashed p-4 gap-3 text-center" style="width: 240px; aspect-ratio: 4/3; color: var(--admin-text-muted); border-color: var(--admin-card-border);">
                {#if generatingBoomerang}
                  <div class="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style="border-color: #00d9d9 transparent #00d9d9 #00d9d9;"></div>
                  <span style="color: #00d9d9; font-size: 12px;">Membuat Boomerang...</span>
                {:else}
                  <span>(Belum tersedia)</span>
                  {#if singlePhotos.length >= 2}
                    <button onclick={generateBoomerang} class="btn-primary !h-10 !px-4 !text-xs w-full">
                      Buat Boomerang
                    </button>
                  {/if}
                {/if}
              </div>
            {/if}
          </div>

          <!-- Single Photos Section -->
          <div class="flex flex-col items-center md:items-start">
            <h3 class="flex items-center gap-2 mb-4 font-bold text-sm" style="color: #ff4757;">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Foto Satuan
            </h3>
            
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {#each singlePhotos as photo, idx}
                <div class="relative group rounded-lg overflow-hidden shadow-lg bg-black aspect-[3/4]" style="border: 1px solid var(--admin-card-border);">
                  <img src={`https://panel.tail11f9ba.ts.net/uploads/${photo.filename}`} class="w-full h-full object-cover" alt="Single {idx+1}" />
                  <a 
                    href={`https://panel.tail11f9ba.ts.net/api/photos/${photo.id}/download`} 
                    class="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-sm" 
                    style="color: #00d9d9; text-decoration: none;"
                  >
                    Unduh
                  </a>
                </div>
              {/each}
            </div>
          </div>

        </div>
      </div>
    </div>
  {/if}
</div>

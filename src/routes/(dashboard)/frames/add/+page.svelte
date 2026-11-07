<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authHeaders } from '$lib/adminGuard';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  
  let uploadedImage = $state<string | null>(null);
  let formLabel = $state('');
  let isDraggingFile = $state(false);
  type Hole = { id: number; x: number; y: number; w: number; h: number };
  let holes = $state<Hole[]>([]);
  let activeHoleId = $state<number | null>(null);

  let formLoading = $state(false);
  let formError = $state('');
  let showConfirmDeleteHole = $state(false);
  let imgWrapperEl: HTMLDivElement | null = null;
  let zoomLevel = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let initialPanX = 0;
  let initialPanY = 0;
  let isDraggingHole = false;
  let isResizingHole = false;
  let startX = 0;
  let startY = 0;
  let initialHole = { x: 0, y: 0, w: 0, h: 0 };
  let uploadedFile = $state<File | null>(null);

  function handleFileDrop(e: DragEvent) {
    e.preventDefault();
    isDraggingFile = false;
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      processFile(input.files[0]);
    }
  }

  function processFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    uploadedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImage = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function addPhotoHole() {
    const newId = Date.now();
    holes = [...holes, { id: newId, x: 10, y: 10, w: 80, h: 20 }];
    activeHoleId = newId;
  }

  function confirmRemovePhotoHole() {
    if (activeHoleId) {
      showConfirmDeleteHole = true;
    }
  }

  function executeRemovePhotoHole() {
    if (activeHoleId) {
      holes = holes.filter(h => h.id !== activeHoleId);
      activeHoleId = holes.length > 0 ? holes[holes.length - 1].id : null;
    }
    showConfirmDeleteHole = false;
  }

  function startDrag(e: PointerEvent, holeId: number) {
    e.stopPropagation();
    if (isResizingHole) return;
    activeHoleId = holeId;
    isDraggingHole = true;
    startX = e.clientX;
    startY = e.clientY;
    const hole = holes.find(h => h.id === holeId);
    if (hole) initialHole = { ...hole };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function startResize(e: PointerEvent, holeId: number) {
    e.stopPropagation();
    activeHoleId = holeId;
    isResizingHole = true;
    startX = e.clientX;
    startY = e.clientY;
    const hole = holes.find(h => h.id === holeId);
    if (hole) initialHole = { ...hole };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDraggingHole && !isResizingHole) return;
    if (!imgWrapperEl || !activeHoleId) return;

    const rect = imgWrapperEl.getBoundingClientRect();
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Convert pixel delta to percentage
    const dxPct = (dx / rect.width) * 100;
    const dyPct = (dy / rect.height) * 100;

    holes = holes.map(h => {
      if (h.id === activeHoleId) {
        if (isDraggingHole) {
          return {
            ...h,
            x: Math.max(0, Math.min(100 - h.w, initialHole.x + dxPct)),
            y: Math.max(0, Math.min(100 - h.h, initialHole.y + dyPct))
          };
        } else if (isResizingHole) {
          return {
            ...h,
            w: Math.max(5, Math.min(100 - h.x, initialHole.w + dxPct)),
            h: Math.max(5, Math.min(100 - h.y, initialHole.h + dyPct))
          };
        }
      }
      return h;
    });
  }

  function onPointerUp(e: PointerEvent) {
    isDraggingHole = false;
    isResizingHole = false;
    isPanning = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }

  function startPan(e: PointerEvent) {
    // Only pan if clicking on the background (not holes) or holding space
    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    initialPanX = panX;
    initialPanY = panY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onCanvasPointerMove(e: PointerEvent) {
    if (isPanning) {
      const dx = e.clientX - panStartX;
      const dy = e.clientY - panStartY;
      panX = initialPanX + dx;
      panY = initialPanY + dy;
    }
  }

  function handleWheel(e: WheelEvent) {
    if (!uploadedImage) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    // For smoother zoom on trackpads, we could check deltaY magnitude, but a simple step is okay
    zoomLevel = Math.max(0.2, Math.min(3, zoomLevel + delta));
  }

  async function saveFrame() {
    formError = '';
    if (!formLabel.trim()) {
      formError = 'Nama frame wajib diisi!';
      return;
    }
    if (!uploadedFile) {
      formError = 'Silakan unggah gambar desain frame (PNG) terlebih dahulu!';
      return;
    }
    
    formLoading = true;
    try {
      const fd = new FormData();
      fd.append('name', formLabel.trim());
      // Simpan data koordinat & metadata form ke dalam field description (karena schema backend hanya ada kolom ini)
      fd.append('description', JSON.stringify({
        holes
      }));
      fd.append('image', uploadedFile);

      const res = await fetch(`https://panel.tail11f9ba.ts.net/api/frames`, {
        method: 'POST',
        headers: authHeaders(),
        body: fd
      });

      if (res.ok) {
        goto('/frames');
      } else {
        const err = await res.json();
        formError = 'Gagal menyimpan frame: ' + (err.message || err.error || 'Unknown error');
      }
    } catch (e) {
      formError = 'Terjadi kesalahan saat menyambung ke server.';
    } finally {
      formLoading = false;
    }
  }
</script>

<svelte:head><title>Tambah Frame — VELVET.FILM</title></svelte:head>
{#if showConfirmDeleteHole}
  <ConfirmModal
    title="Hapus Kotak Foto?"
    message="Kotak foto ini akan dihapus dari desain frame Anda."
    confirmLabel="Hapus"
    onConfirm={executeRemovePhotoHole}
    onCancel={() => showConfirmDeleteHole = false}
  />
{/if}
<div class="flex h-[calc(100vh-64px)] overflow-hidden w-full" style="background:var(--admin-bg);">
  <div 
    class="flex-1 relative flex items-center justify-center p-8 overflow-hidden checkerboard touch-none"
    onwheel={handleWheel}
    onpointerdown={startPan}
    onpointermove={onCanvasPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
    onpointerleave={onPointerUp}
  >
    {#if !uploadedImage}
      <label 
        class="border-4 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer transition-colors max-w-xl w-full text-center"
        ondragover={(e) => { e.preventDefault(); isDraggingFile = true; }}
        ondragleave={() => isDraggingFile = false}
        ondrop={handleFileDrop}
        style="background: {isDraggingFile ? 'var(--admin-nav-act-bg)' : 'var(--admin-card-bg)'}; border-color: {isDraggingFile ? 'var(--admin-text)' : 'var(--admin-border)'};"
      >
        <input type="file" accept="image/png" class="hidden" onchange={handleFileInput} />
        <div class="w-24 h-24 mb-6 rounded-full bg-[#ff4785] flex items-center justify-center text-white shadow-lg">
          <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
        </div>
        <h3 class="text-2xl font-bold mb-2" style="color: var(--admin-text);">Klik atau Tarik Desain Frame (PNG) ke Sini</h3>
        <p style="color: var(--admin-text-muted);">Gunakan area transparan pada gambar PNG untuk lubang foto pelanggan.</p>
      </label>
    {:else}
      <div class="fixed bottom-6 left-1/4 -translate-x-1/2 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-4 z-50 text-white shadow-xl border border-white/10" style="margin-left: 12%;">
        <span class="text-xs font-bold uppercase tracking-wider">Zoom</span>
        <input type="range" min="0.2" max="3" step="0.1" bind:value={zoomLevel} class="w-32 accent-[#00d9d9]" />
        <span class="text-xs font-mono">{Math.round(zoomLevel * 100)}%</span>
        <button onclick={() => { zoomLevel = 1; panX = 0; panY = 0; }} class="ml-2 hover:text-[#00d9d9] transition-colors" title="Reset Zoom">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
        </button>
      </div>
      <div 
        bind:this={imgWrapperEl}
        class="relative shadow-2xl transition-transform duration-75" 
        style="max-width:100%; max-height:100%; transform: translate({panX}px, {panY}px) scale({zoomLevel}); transform-origin: center; cursor: {isPanning ? 'grabbing' : 'grab'};"
      >
        <img src={uploadedImage} alt="Frame Preview" class="max-w-full max-h-full object-contain pointer-events-none" style="max-height: 85vh;" />
        {#each holes as hole, index}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div 
            class="absolute border-2 cursor-grab flex items-center justify-center transition-shadow shadow-lg
              {activeHoleId === hole.id ? 'border-yellow-400 z-20 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'border-red-500 z-10'}"
            style="top: {hole.y}%; left: {hole.x}%; width: {hole.w}%; height: {hole.h}%; background: rgba(220, 38, 38, 0.4); border-radius: 8px;"
            onpointerdown={(e) => startDrag(e, hole.id)}
            onpointermove={onPointerMove}
            onpointerup={onPointerUp}
          >
            <span class="text-white/70 font-bold text-4xl pointer-events-none">{index + 1}</span>
            {#if activeHoleId === hole.id}
              <div 
                class="absolute bottom-1 right-1 w-6 h-6 bg-yellow-400 rounded-full cursor-nwse-resize flex items-center justify-center text-black shadow-md"
                onpointerdown={(e) => startResize(e, hole.id)}
                onpointermove={onPointerMove}
                onpointerup={onPointerUp}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
  <div class="w-[360px] shrink-0 border-l flex flex-col p-6 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10 overflow-y-auto" style="border-color:var(--admin-border); background:var(--admin-card-bg);">
    <h2 class="text-2xl font-bold mb-6 font-['Space_Grotesk']" style="color: var(--admin-text);">Tambah Frame</h2>
    
    {#if uploadedImage}
      <div class="flex gap-3 mb-4">
        <button onclick={addPhotoHole} class="flex-1 btn-secondary !h-12 !rounded-xl !px-2 font-bold flex items-center justify-center gap-2">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          Tambah Foto
        </button>
        <button onclick={confirmRemovePhotoHole} disabled={!activeHoleId} class="flex-1 !h-12 !rounded-xl !px-2 font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50" style="background: #ef4444; color: white;">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4"/></svg>
          Hapus Foto
        </button>
      </div>

      <p class="text-xs mb-8 leading-relaxed" style="color: var(--admin-text-muted);">
        Sentuh & geser kotak foto untuk memindahkan. Gunakan ikon di pojok untuk merubah ukuran kotak sesuai dengan area transparan frame Anda.
      </p>
    {/if}

    <div class="space-y-5 flex-1">
      {#if formError}
        <div class="px-4 py-2 rounded-xl text-sm" style="background:rgba(255,71,87,.1);border:1px solid rgba(255,71,87,.3);color:#ff4757;">{formError}</div>
      {/if}
      <div>
        <label class="block text-xs mb-2" style="color: var(--admin-text-muted);">Nama Template:</label>
        <input bind:value={formLabel} type="text" class="input-field w-full rounded-lg" placeholder="Contoh: Photostrip Keren" />
      </div>
    </div>

    <div class="flex gap-3 pt-6 mt-6 border-t" style="border-top-color: var(--admin-border);">
      <button class="flex-1 btn-secondary !h-12 !rounded-xl font-semibold flex items-center justify-center gap-2">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
        Preview
      </button>
      <button onclick={saveFrame} disabled={formLoading} class="flex-1 btn-primary !h-12 !rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
        {#if formLoading}
          <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        {:else}
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
        {/if}
        {formLoading ? 'Menyimpan...' : 'Simpan'}
      </button>
    </div>
  </div>
</div>

<style>
  .checkerboard {
    background-color: var(--admin-bg);
    background-image: 
      linear-gradient(45deg, var(--admin-row-hover) 25%, transparent 25%, transparent 75%, var(--admin-row-hover) 75%, var(--admin-row-hover)),
      linear-gradient(45deg, var(--admin-row-hover) 25%, transparent 25%, transparent 75%, var(--admin-row-hover) 75%, var(--admin-row-hover));
    background-size: 30px 30px;
    background-position: 0 0, 15px 15px;
  }
  
  .input-field {
    background: var(--admin-input-bg);
    border: 1px solid var(--admin-border);
    color: var(--admin-text);
    padding: 10px 14px;
    transition: all 0.2s;
  }
  .input-field:focus {
    outline: none;
    border-color: #ff4785;
    box-shadow: 0 0 0 3px rgba(255,71,133,0.1);
  }
</style>

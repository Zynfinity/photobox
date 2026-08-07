<script lang="ts">
  import cekrekMp3 from '../../audio/cekrek.mp3';
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { authHeaders } from '$lib/adminGuard';
  import QRCode from 'qrcode';
  
  type State = 'intro' | 'info' | 'frame' | 'booth' | 'result';
  let currentState: State = $state('intro');
  
  let videoEl = $state<HTMLVideoElement | null>(null);
  let stream = $state<MediaStream | null>(null);
  
  // User Info
  let userName = $state('');
  let userPhone = $state('');
  let formError = $state('');
  
  let frames = $state<{id:string, name:string, url:string, holes: any[]}[]>([]);
  let selectedFrameId = $state('');
  let loadingFrames = $state(false);
  let selectedFrameObj = $derived(frames.find(f => f.id === selectedFrameId));
  
  // Session
  let activeSessionId = $state('');
  let activeSessionFrameId = $state('');
  let sessionFramesCount = $state(0);
  
  // Session & Capture Timers
  let sessionTimeLeft = $state(5 * 60);
  let sessionTimerInterval: number;
  let isSessionRunning = $state(false);

  let captureTimeLeft = $state(0);
  let captureTimerInterval: number;
  let isCapturing = $state(false);

  let audioCtx: any = null;
  function playBeep(frequency = 800, duration = 150) {
    if (typeof window === 'undefined') return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime); // Volume max
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration / 1000);
    } catch (e) {
      console.error('Audio beep failed', e);
    }
  }

  let shutterAudio: HTMLAudioElement;
  $effect(() => {
    if (typeof window !== 'undefined' && !shutterAudio) {
      shutterAudio = new Audio(cekrekMp3);
    }
  });

  function playShutter() {
    if (shutterAudio) {
      shutterAudio.currentTime = 0;
      shutterAudio.play().catch(e => console.error('Shutter sound failed', e));
    }
  }
  
  // Booth Filters & Settings
  let isMirrored = $state(true);
  let activeFilter = $state('normal');
  
  // Capture logic
  let capturedPhotos = $state<string[]>([]);
  let isTakingPhoto = $state(false);
  let sessionFinished = $state(false);
  let reviewPhotoUrl = $state<string | null>(null);
  let retakeTargetIndex = $state<number | null>(null);
  
  let resultStep = $state<'confirm' | 'final'>('confirm');
  let qrCodeUrl = $state('');

  onMount(async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" }, 
        audio: false 
      });
      if (videoEl) videoEl.srcObject = stream;
    } catch (e) {
      console.error("Camera error:", e);
    }

    const sid = $page.url.searchParams.get('sessionId');
    if (sid) {
      activeSessionId = sid;
      await initAdminSession(sid);
    }

    window.addEventListener('storage', handleStorageCommand);
  });

  function handleStorageCommand(e: StorageEvent) {
    if (activeSessionId && e.key === `session_command_${activeSessionId}`) {
      if (e.newValue && e.newValue.startsWith('stop_')) {
        resetSession();
      }
    }
  }

  function resetSession() {
    activeSessionId = null;
    currentState = 'intro';
    isSessionRunning = false;
    sessionTimeLeft = 5 * 60;
    capturedPhotos = [];
    isTakingPhoto = false;
    sessionFinished = false;
    reviewPhotoUrl = null;
    retakeTargetIndex = null;
    resultStep = 'confirm';
    qrCodeUrl = '';
    userName = '';
    userPhone = '';
    selectedFrameId = null;
    formError = '';
    clearInterval(sessionTimerInterval);
    clearInterval(captureTimerInterval);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/start');
    }
  }

  function handleAddSession() {
    activeSessionFrameId = null;
    currentState = 'frame';
    isSessionRunning = false;
    sessionTimeLeft = 5 * 60;
    capturedPhotos = [];
    isTakingPhoto = false;
    sessionFinished = false;
    reviewPhotoUrl = null;
    retakeTargetIndex = null;
    resultStep = 'confirm';
    qrCodeUrl = '';
    selectedFrameId = null;
    formError = '';
    clearInterval(sessionTimerInterval);
    clearInterval(captureTimerInterval);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/start');
    }
  }

  async function initAdminSession(sid: string) {
    try {
      const res = await fetch(`/api/sessions/${sid}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.session_frames && data.session_frames.length > 0) {
          sessionFramesCount = data.session_frames.length;
        } else {
          sessionFramesCount = 0;
        }
        
        // Load frames first
        await fetchFrames();
        if (data.session_frames && data.session_frames.length > 0) {
          const lastSessionFrame = data.session_frames[data.session_frames.length - 1];
          selectedFrameId = lastSessionFrame.frame_id;
          activeSessionFrameId = lastSessionFrame.session_frame_id;
          currentState = 'booth';
          checkExistingTimer(sid);
        } else {
          currentState = 'frame';
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  function checkExistingTimer(sid: string) {
    const startTimeStr = localStorage.getItem(`session_time_start_${sid}`);
    if (startTimeStr) {
      const startTime = parseInt(startTimeStr, 10);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = (5 * 60) - elapsed;
      if (remaining > 0) {
        sessionTimeLeft = remaining;
        isSessionRunning = true;
        startTimerInterval();
      } else {
        sessionTimeLeft = 0;
        sessionFinished = true;
      }
    }
  }

  async function fetchFrames() {
    loadingFrames = true;
    try {
      const res = await fetch('/api/frames', { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        frames = (Array.isArray(d) ? d : []).map((f: any) => {
          let holes: any[] = [];
          try {
            if (f.description) {
              const parsed = JSON.parse(f.description);
              if (parsed.holes) holes = parsed.holes;
            }
          } catch(e) {}
          return {
            id: f.id, name: f.name, url: f.filename ? `/uploads/${f.filename}` : '', holes, filename: f.filename
          };
        });
      }
    } catch(e) {
      console.error(e);
    } finally {
      loadingFrames = false;
    }
  }
  
  function attachStream(node: HTMLVideoElement) {
    if (stream) {
      node.srcObject = stream;
      node.play().catch(e => console.error("Mini preview play error:", e));
    }
    return {
      destroy() { node.srcObject = null; }
    };
  }

  onDestroy(() => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    clearInterval(sessionTimerInterval);
    clearInterval(captureTimerInterval);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageCommand);
    }
  });
  
  async function handleStart() {
    try {
      const res = await fetch('/api/sessions?status=active&limit=1', { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        const sessions = d.data || d;
        if (Array.isArray(sessions) && sessions.length > 0) {
          const activeSession = sessions[0];
          if (activeSession && activeSession.status === 'active') {
            activeSessionId = activeSession.id;
            await initAdminSession(activeSessionId);
            return;
          }
        }
      }
    } catch (e) {
      console.error('Error fetching active session:', e);
    }
    currentState = 'info';
  }
  
  async function submitInfo() {
    if (!userName.trim() || !userPhone.trim()) {
      formError = 'Nama dan Nomor WA wajib diisi.';
      return;
    }
    formError = '';

    if (!activeSessionId) {
      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ customer_name: userName, customer_phone: userPhone, status: 'active' })
        });
        if (res.ok) {
          const s = await res.json();
          activeSessionId = s.id;
        } else {
          console.error("Failed to create session on submitInfo");
        }
      } catch (e) {
        console.error(e);
      }
    }

    currentState = 'frame';
    await fetchFrames();
  }
  
  let isSubmitting = $state(false);

  async function startSession() {
    if (!selectedFrameId || isSubmitting) return;
    isSubmitting = true;
    try {
      let sRes;
      if (activeSessionId) {
        sRes = await fetch(`/api/sessions/${activeSessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ 
            frame_id: selectedFrameId 
          })
        });
      } else {
        sRes = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ 
            customer_name: userName, 
            customer_phone: userPhone, 
            frame_id: selectedFrameId 
          })
        });
      }

      if (sRes.ok) {
        const responseData = await sRes.json();
        if (!activeSessionId) {
          activeSessionId = responseData.id;
        }
        if (responseData.session_frame_id) {
          activeSessionFrameId = responseData.session_frame_id;
          sessionFramesCount++;
        }
        
        currentState = 'booth';
        
        if (!isSessionRunning) {
          sessionTimeLeft = 5 * 60;
          isSessionRunning = false; 
          clearInterval(sessionTimerInterval);

          captureTimeLeft = 0;
          isCapturing = false;
          clearInterval(captureTimerInterval);

          capturedPhotos = [];
          sessionFinished = false;
          reviewPhotoUrl = null;
          retakeTargetIndex = null;
        }
      } else {
        const err = await sRes.json();
        formError = err.error || 'Gagal memulai sesi';
        currentState = 'frame';
      }
    } catch (e) {
      console.error(e);
      formError = 'Terjadi kesalahan sistem';
    } finally {
      isSubmitting = false;
    }
  }

  function startSessionTimer() {
    isSessionRunning = true;
    sessionTimeLeft = 5 * 60;
    if (activeSessionId) {
      localStorage.setItem(`session_time_start_${activeSessionId}`, Date.now().toString());
    }
    startTimerInterval();
  }

  function startTimerInterval() {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = window.setInterval(() => {
      if (sessionTimeLeft > 0) {
        sessionTimeLeft--;
      } else {
        clearInterval(sessionTimerInterval);
        handleAutoStop();
      }
    }, 1000);
  }

  async function handleAutoStop() {
    if (activeSessionId) {
      try {
        await fetch(`/api/sessions/${activeSessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ status: 'completed' })
        });
        localStorage.setItem(`session_command_${activeSessionId}`, 'stop_' + Date.now());
      } catch (e) {
        console.error('Failed to auto stop', e);
      }
    }
    resetSession();
  }

  function startTimer() {
    if (sessionFinished) return;
    isCapturing = true;
    captureTimeLeft = 5; 
    playBeep(800, 150);
    clearInterval(captureTimerInterval);
    captureTimerInterval = window.setInterval(() => {
      if (captureTimeLeft > 1) {
        captureTimeLeft--;
        playBeep(800, 150);
      } else {
        captureTimeLeft = 0;
        clearInterval(captureTimerInterval);
        isCapturing = false;
        playShutter();
        takePhoto();
      }
    }, 1000);
  }
  
  function takePhoto() {
    if (!videoEl || !selectedFrameObj) return;
    
    isTakingPhoto = true;
    setTimeout(() => isTakingPhoto = false, 150);

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.filter = getVideoFilter();
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      reviewPhotoUrl = canvas.toDataURL('image/jpeg', 0.9);
    }
  }

  function handleRetake() {
    reviewPhotoUrl = null;
    startTimer();
  }

  function handleAccept() {
    if (!reviewPhotoUrl || !selectedFrameObj) return;
    
    if (retakeTargetIndex !== null) {
      capturedPhotos[retakeTargetIndex] = reviewPhotoUrl;
      retakeTargetIndex = null;
    } else {
      capturedPhotos = [...capturedPhotos, reviewPhotoUrl];
    }
    reviewPhotoUrl = null;

    if (capturedPhotos.length >= selectedFrameObj.holes.length) {
      sessionFinished = true;
    }
  }
  
  function formatTime(s: number) {
    if (s < 0) s = 0;
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function goToResult() {
    currentState = 'result';
    resultStep = 'confirm';
  }

  async function handleOk() {
    try {
      const url = window.location.origin + '/my-gallery/' + activeSessionId;
      qrCodeUrl = await QRCode.toDataURL(url, { margin: 1, width: 200, color: { dark: '#000000', light: '#ffffff' } });
    } catch (e) {
      console.error(e);
    }
    
    if (activeSessionId) {
      try {
        const formData = new FormData();
        formData.append('session_id', activeSessionId);
        if (activeSessionFrameId) {
          formData.append('session_frame_id', activeSessionFrameId);
        }
        
        for (let i = 0; i < capturedPhotos.length; i++) {
          const res = await fetch(capturedPhotos[i]);
          const blob = await res.blob();
          formData.append('file', blob, `photo_${i+1}.jpg`);
        }

        // Generate combined frame image
        if (selectedFrameObj && selectedFrameObj.filename) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const frameImg = new Image();
          frameImg.src = `/uploads/${selectedFrameObj.filename}`;
          await new Promise((resolve) => {
            frameImg.onload = resolve;
            frameImg.onerror = resolve;
          });

          if (frameImg.width && frameImg.height && ctx) {
            canvas.width = frameImg.width;
            canvas.height = frameImg.height;

            let holes = [];
            try {
              holes = typeof selectedFrameObj.holes === 'string' ? JSON.parse(selectedFrameObj.holes) : selectedFrameObj.holes;
            } catch (e) {}

            for (let i = 0; i < capturedPhotos.length; i++) {
              const hole = holes[i];
              if (!hole) continue;
              const img = new Image();
              img.src = capturedPhotos[i];
              await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              });
              const hX = (hole.x / 100) * canvas.width;
              const hY = (hole.y / 100) * canvas.height;
              const hW = (hole.w / 100) * canvas.width;
              const hH = (hole.h / 100) * canvas.height;
              
              ctx.drawImage(img, hX, hY, hW, hH);
            }
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
            
            const combinedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            const res = await fetch(combinedDataUrl);
            const blob = await res.blob();
            formData.append('file', blob, `final_frame.jpg`);
          }
        }

        await fetch('/api/photos/upload', {
          method: 'POST',
          headers: authHeaders(),
          body: formData
        });

        await fetch(`/api/sessions/${activeSessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ status: 'completed' })
        });
        localStorage.setItem(`session_command_${activeSessionId}`, 'stop_' + Date.now());
      } catch (e) {
        console.error("Upload failed", e);
      }
    }
    resultStep = 'final';
  }

  function handleRetakeAll() {
    capturedPhotos = [];
    sessionFinished = false;
    currentState = 'booth';
  }

  function getVideoFilter() {
    if (activeFilter === 'bw') return 'grayscale(1)';
    if (activeFilter === 'sepia') return 'sepia(1)';
    if (activeFilter === 'beauty') return 'contrast(1.1) brightness(1.1) saturate(1.2) blur(0.5px)';
    return 'none';
  }
</script>

<style>
  .crt-effect {
    position: absolute;
    inset: 0;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
                linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
    background-size: 100% 4px, 6px 100%;
    pointer-events: none;
    z-index: 10;
  }
</style>

<svelte:head><title>Start — VELVET.FILM</title></svelte:head>

<div class="fixed inset-0 overflow-hidden font-sans" style="background:var(--admin-bg);">

  <!-- svelte-ignore a11y_media_has_caption -->
  <video
    bind:this={videoEl}
    autoplay
    playsinline
    muted
    style="
      position: absolute;
      object-fit: cover;
      transition: all 0.4s ease;
      transform: {isMirrored ? 'scaleX(-1)' : 'scaleX(1)'};
      filter: {currentState === 'booth' ? getVideoFilter() : 'none'};
      {currentState === 'booth'
        ? `top: 80px; left: 16px; height: calc(100% - 216px); width: calc(78% - 28px); border-radius: 12px; z-index: 5;`
        : `top: 0; left: 0; width: 100%; height: 100%; z-index: 1;`
      }
    "
  ></video>

  <!-- CRT overlay hanya saat bukan booth -->
  {#if currentState !== 'booth'}
    <div class="crt-effect"></div>
  {/if}

  <!-- Flash overlay saat foto diambil -->
  {#if isTakingPhoto}
    <div class="absolute inset-0 bg-white z-50 transition-opacity duration-75"></div>
  {/if}

  <!-- Greeting -->
  {#if userName && currentState !== 'intro' && currentState !== 'booth'}
    <div class="absolute top-6 right-6 z-40">
      <div class="px-5 py-2.5 rounded-full font-medium text-sm shadow-xl backdrop-blur-md flex items-center gap-2"
        style="background:var(--admin-card-bg);border:1px solid var(--admin-card-border);color:var(--admin-text);">
        <span>👋 Hai,</span> <span class="font-bold text-[#00d9d9]">{userName}</span>
      </div>
    </div>
  {/if}

  <!-- ═══════════════════════════════════════
       INTRO
  ═══════════════════════════════════════ -->
  {#if currentState === 'intro'}
    <div class="absolute inset-0 flex items-center justify-center z-20">
      <div class="relative w-[340px] rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md"
        style="background:rgba(21,18,29,0.85);border:1px solid rgba(255,255,255,0.1);">
        <h1 class="text-4xl text-center text-white font-bold tracking-tight mb-2" style="font-family:'Space Grotesk',sans-serif;">
          PHOTO<span class="text-[#00d9d9]">BOX</span>
        </h1>
        <p class="text-sm text-gray-400 text-center mb-8">Abadikan momen terbaikmu sekarang</p>
        <button onclick={handleStart} class="btn-primary w-full py-4 text-lg font-bold shadow-[0_8px_32px_rgba(0,217,217,0.3)]">
          Mulai Sesi
        </button>
      </div>
    </div>

  <!-- ═══════════════════════════════════════
       INFO
  ═══════════════════════════════════════ -->
  {:else if currentState === 'info'}
    <div class="absolute inset-0 flex items-center justify-center z-30"
      style="background:rgba(0,0,0,0.72);backdrop-filter:blur(8px);">
      <div class="w-full max-w-sm rounded-2xl p-6 relative"
        style="background:var(--admin-card-bg);border:1px solid var(--admin-card-border);box-shadow:0 24px 60px rgba(0,0,0,.6);">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold" style="color:var(--admin-text);font-family:'Space Grotesk',sans-serif;font-size:18px;">Informasi Pengguna</h2>
          <button onclick={() => currentState='intro'}
            class="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            style="color:var(--admin-text-muted);background:var(--admin-close-bg);">✕</button>
        </div>
        <div class="space-y-4">
          <p class="text-sm mb-4" style="color:var(--admin-text-muted);">Masukkan data dirimu untuk memulai sesi.</p>
          {#if formError}
            <div class="px-4 py-2 rounded-xl text-sm"
              style="background:rgba(255,71,87,.1);border:1px solid rgba(255,71,87,.3);color:#ff4757;">{formError}</div>
          {/if}
          <div>
            <label class="block mb-1.5" style="color:var(--admin-text-muted);text-transform:uppercase;letter-spacing:.05em;font-size:11px;">Nama Lengkap</label>
            <input bind:value={userName} type="text" class="w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00d9d9]" style="border-radius:12px;background:var(--admin-input-bg);border:1px solid var(--admin-card-border);color:var(--admin-text);" placeholder="cth. Bima" />
          </div>
          <div>
            <label class="block mb-1.5" style="color:var(--admin-text-muted);text-transform:uppercase;letter-spacing:.05em;font-size:11px;">Nomor WhatsApp</label>
            <input bind:value={userPhone} type="tel" class="w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00d9d9]" style="border-radius:12px;background:var(--admin-input-bg);border:1px solid var(--admin-card-border);color:var(--admin-text);" placeholder="08xxxxxxxx" />
          </div>
          <button onclick={submitInfo} class="btn-primary w-full mt-2" style="height:48px;">Lanjut Pilih Frame</button>
        </div>
      </div>
    </div>

  <!-- ═══════════════════════════════════════
       FRAME SELECTION
  ═══════════════════════════════════════ -->
  {:else if currentState === 'frame'}
    <div class="absolute inset-0 z-30 flex flex-col" style="background:rgba(10,8,16,0.85);backdrop-filter:blur(16px);">
      <div class="flex items-center justify-between p-6 md:p-10 shrink-0">
        <div>
          <h2 class="text-white text-3xl font-bold tracking-tight" style="font-family:'Space Grotesk',sans-serif;">Pilih Frame</h2>
          <p class="text-on-surface-variant mt-2 text-sm md:text-base">Pilih frame favoritmu sebelum memulai sesi foto.</p>
        </div>
        <button onclick={() => currentState='info'}
          class="w-12 h-12 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="flex-1 relative flex items-center min-h-0 w-full max-w-7xl mx-auto px-12 md:px-24">
        {#if loadingFrames}
          <div class="w-full flex justify-center items-center h-full gap-8">
            {#each Array(4) as _}
              <div class="animate-pulse rounded-2xl shrink-0 w-[30vh] max-w-[280px]"
                style="aspect-ratio:2/3; background:var(--admin-track-bg);"></div>
            {/each}
          </div>
        {:else}
          <div
            class="w-full overflow-x-auto flex gap-4 md:gap-8 py-8 items-center h-full snap-x snap-mandatory {frames.length < 5 ? 'md:justify-center' : ''}"
            style="scrollbar-width: none;"
            id="frame-carousel"
          >
            {#each frames as f}
              <button
                onclick={() => selectedFrameId = f.id}
                class="relative shrink-0 rounded-xl overflow-hidden border-4 transition-all duration-300 snap-center
                  hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]
                  {selectedFrameId === f.id
                    ? 'border-[#00d9d9] scale-105 shadow-[0_0_30px_rgba(0,217,217,0.3)]'
                    : 'border-transparent opacity-60 hover:opacity-100 hover:border-white/20 scale-95'}
                  w-[calc(50%-8px)] sm:w-[calc(33.333%-10.66px)] md:w-[calc(20%-25.6px)] aspect-[2/3]"
                style="background:var(--admin-input-bg);"
              >
                {#if f.url}
                  <img loading="lazy" src={f.url} alt={f.name} class="w-full h-full object-contain" />
                {:else}
                  <div class="w-full h-full flex items-center justify-center text-white text-lg font-medium p-4 text-center">{f.name}</div>
                {/if}
                {#if selectedFrameId === f.id}
                  <div class="absolute inset-0 border-4 border-[#00d9d9] rounded-lg pointer-events-none z-10"></div>
                  <div class="absolute top-4 right-4 w-8 h-8 bg-[#00d9d9] rounded-full flex items-center justify-center text-black z-20 shadow-lg">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                {/if}
              </button>
            {/each}
          </div>

          <button
            onclick={() => document.getElementById('frame-carousel')?.scrollBy({left: -window.innerWidth * 0.8, behavior: 'smooth'})}
            class="absolute left-0 md:left-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center text-white bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-md transition-all shadow-xl z-20"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button
            onclick={() => document.getElementById('frame-carousel')?.scrollBy({left: window.innerWidth * 0.8, behavior: 'smooth'})}
            class="absolute right-0 md:right-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center text-white bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-md transition-all shadow-xl z-20"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        {/if}
      </div>

      <div class="p-6 md:p-10 shrink-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/80 to-transparent">
        {#if formError && currentState === 'frame'}
          <div class="px-6 py-3 mb-6 rounded-full text-sm font-medium shadow-lg backdrop-blur-md"
            style="background:rgba(255,71,87,.2);border:1px solid rgba(255,71,87,.4);color:#ff4757;">{formError}</div>
        {/if}
        <button
          onclick={startSession}
          disabled={!selectedFrameId || isSubmitting}
          class="btn-primary flex items-center justify-center gap-3 text-lg font-bold shadow-[0_8px_32px_rgba(0,217,217,0.3)] transition-all hover:scale-105"
          style="height:60px; padding:0 40px; border-radius:30px; {(!selectedFrameId || isSubmitting) ? 'opacity:0.5;cursor:not-allowed;transform:none;' : ''}"
        >
          {#if isSubmitting}
            <svg class="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Memproses...
          {:else}
            Next
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          {/if}
        </button>
      </div>
    </div>

  <!-- ═══════════════════════════════════════
       BOOTH
  ═══════════════════════════════════════ -->
  {:else if currentState === 'booth'}
    <div class="absolute inset-0 z-10 flex flex-col pointer-events-none" style="padding:16px; gap:0;">

      <!-- Top Bar -->
      <div class="flex justify-between items-center pointer-events-auto shrink-0" style="height:64px;">
        <button
          onclick={() => currentState='frame'}
          class="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold"
          style="border-color:var(--admin-border); color:var(--admin-text); background:var(--admin-card-bg);"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Ganti Frame
        </button>

        <button
          onclick={() => isMirrored = !isMirrored}
          class="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold"
          style="border-color:var(--admin-border); color:var(--admin-text); background:var(--admin-card-bg);"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
          Mirror: {isMirrored ? 'ON' : 'OFF'}
        </button>
      </div>

      <!-- Middle Row: overlay area kamera (kiri) + frame preview (kanan) -->
      <div class="flex flex-1 min-h-0 pointer-events-none" style="gap: 12px;">

        <!-- Overlay di atas area kamera -->
        <div class="relative flex-1 min-w-0" style="width: calc(78% - 28px);">
          
          <!-- Timer Sesi: Mengambang di bagian atas area kamera -->
          {#if isSessionRunning && !sessionFinished}
            <div class="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto z-20">
              <div
                class="px-8 py-3 rounded-full font-bold text-4xl text-white font-mono shadow-2xl border border-white/20 {sessionTimeLeft <= 10 ? 'text-red-400 animate-pulse' : ''}"
                style="background:rgba(0,217,217,0.85); backdrop-filter:blur(8px); text-shadow: 0 2px 8px rgba(0,0,0,0.3); transition: all 0.2s;"
              >
                {formatTime(sessionTimeLeft)}
              </div>
            </div>
          {/if}

          <!-- Countdown Foto: Mengambang besar di tengah kamera -->
          {#if isCapturing && captureTimeLeft > 0}
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <div class="text-[12rem] font-bold text-white leading-none animate-pulse"
                style="text-shadow: 0 10px 40px rgba(0,0,0,0.8);">
                {captureTimeLeft}
              </div>
            </div>
          {/if}

          <!-- Filter Buttons: Mengambang di bagian bawah area kamera -->
          <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
            {#each ['normal', 'beauty', 'bw', 'sepia'] as filter}
              <button
                onclick={() => activeFilter = filter}
                class="px-4 py-1.5 rounded-full font-bold text-xs transition-all shadow-md backdrop-blur-md border
                  {activeFilter === filter
                    ? 'bg-[#00d9d9] text-black border-[#00d9d9] scale-105'
                    : 'bg-black/60 text-white border-white/20 hover:bg-black/80'}"
              >
                {filter === 'bw' ? 'B&W' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            {/each}
          </div>

          <!-- Review Overlay -->
          {#if reviewPhotoUrl}
            <div class="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center overflow-hidden">
              <img src={reviewPhotoUrl} class="absolute inset-0 w-full h-full object-cover" alt="Review" />
            </div>
          {/if}
        </div>

        <!-- Frame Preview: mepet kanan, tinggi disamakan dengan kamera -->
        <div class="shrink-0 flex justify-center pointer-events-auto h-full" style="width: 22%;">
          {#if selectedFrameObj?.url}
            <div class="relative inline-block h-full shadow-2xl" style="background:var(--admin-card-bg); border:2px solid var(--admin-border); border-radius:12px; overflow:hidden;">
              <!-- Photos and video rendered behind the frame -->
              {#each selectedFrameObj.holes as hole, i}
                {#if i === retakeTargetIndex || (i === capturedPhotos.length && retakeTargetIndex === null && !sessionFinished)}
                  <div class="absolute overflow-hidden" style="top:{hole.y}%; left:{hole.x}%; width:{hole.w}%; height:{hole.h}%; z-index:5; background: #000;">
                    {#if reviewPhotoUrl}
                      <img src={reviewPhotoUrl} class="absolute inset-0 w-full h-full object-cover" alt="Review {i}" />
                    {:else}
                      <video
                        use:attachStream
                        autoplay playsinline muted
                        class="w-full h-full object-cover"
                        style="transform: {isMirrored ? 'scaleX(-1)' : 'scaleX(1)'}; filter: {getVideoFilter()};"
                      ></video>
                    {/if}
                  </div>
                {:else if capturedPhotos[i]}
                  <div class="absolute group" style="top:{hole.y}%; left:{hole.x}%; width:{hole.w}%; height:{hole.h}%; z-index:5;">
                    <img src={capturedPhotos[i]} class="absolute inset-0 w-full h-full object-cover" alt="Captured {i}" />
                    {#if !isCapturing && !reviewPhotoUrl && isSessionRunning}
                      <button onclick={() => { retakeTargetIndex = i; sessionFinished = false; }} class="absolute inset-0 w-full h-full bg-[#000000]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#ffffff] text-[10px] md:text-xs font-bold transition-opacity z-20 cursor-pointer pointer-events-auto">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" class="mr-1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                        ULANGI
                      </button>
                    {/if}
                  </div>
                {:else}
                  <div class="absolute bg-black/60 flex items-center justify-center font-bold text-white/50 text-xl backdrop-blur-sm" style="top:{hole.y}%; left:{hole.x}%; width:{hole.w}%; height:{hole.h}%; z-index:5;">{i+1}</div>
                {/if}
              {/each}
              
              <!-- Frame image rendered on top -->
              <img
                loading="lazy"
                src={selectedFrameObj.url}
                alt="Frame"
                class="relative h-full w-auto z-10 pointer-events-none"
              />
            </div>
          {:else}
            <div class="w-full h-full rounded-xl shadow-2xl"
              style="background:var(--admin-card-bg); border:2px solid var(--admin-border);"></div>
          {/if}
        </div>
      </div>

      <!-- Bottom Spacer: Digunakan untuk meletakkan tombol mulai / ambil foto tanpa overlapping -->
      <!-- Mengubah tinggi spacer dari 80px menjadi 120px untuk menambah jarak bawah -->
      <div class="shrink-0 flex pointer-events-none" style="height: 120px; gap: 12px;">
        
        <!-- Area tempat menaruh tombol (sejajar dengan lebar video kamera) -->
        <div class="relative flex-1 min-w-0 flex items-center justify-center pointer-events-auto">
          {#if sessionFinished}
            <button onclick={goToResult} class="px-10 py-3 bg-[#8b5cf6] text-white rounded-full font-bold text-lg flex items-center gap-3 shadow-[0_8px_32px_rgba(139,92,246,0.4)] hover:scale-105 transition-transform">
              SESI SELESAI
            </button>
          {:else if !isSessionRunning}
            <button
              onclick={startSessionTimer}
              class="px-10 py-3 bg-[#10b981] text-white rounded-full font-bold text-lg flex items-center gap-3 shadow-[0_8px_32px_rgba(16,185,129,0.4)] hover:scale-105 transition-transform"
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              MULAI SESI
            </button>
          {:else if reviewPhotoUrl}
            <div class="flex gap-6 pointer-events-auto">
              <button onclick={handleRetake} class="px-10 py-3 rounded-full font-bold text-[#ffffff] bg-[#ef4444] hover:bg-[#dc2626] shadow-[0_8px_32px_rgba(239,68,68,0.4)] text-lg transition-transform hover:scale-105 flex items-center gap-3">
                <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                ULANGI
              </button>
              <button onclick={handleAccept} class="px-10 py-3 rounded-full font-bold text-[#ffffff] bg-[#10b981] hover:bg-[#059669] shadow-[0_8px_32px_rgba(16,185,129,0.4)] text-lg transition-transform hover:scale-105 flex items-center gap-3">
                LANJUT
                <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
            </div>
          {:else if !isCapturing && !sessionFinished}
            <button
              onclick={startTimer}
              class="px-10 py-3 bg-[#f43f5e] text-white rounded-full font-bold text-lg flex items-center gap-3 shadow-[0_8px_32px_rgba(244,63,94,0.4)] hover:scale-105 transition-transform"
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {#if retakeTargetIndex !== null}
                RETAKE FOTO {retakeTargetIndex + 1}
              {:else}
                AMBIL FOTO {capturedPhotos.length + 1}
              {/if}
            </button>
          {/if}
        </div>

        <!-- Ruang kosong di bawah frame preview -->
        <div class="shrink-0" style="width: 22%;"></div>

      </div>
    </div>
  <!-- ═══════════════════════════════════════
       RESULT
  ═══════════════════════════════════════ -->
  {:else if currentState === 'result'}
    <div class="absolute inset-0 z-10 flex flex-col md:flex-row bg-gray-900 overflow-hidden">
      
      <!-- Background Effects -->
      <div class="absolute inset-0 pointer-events-none opacity-50">
        <div class="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-[#00d9d9] rounded-full mix-blend-screen filter blur-[150px] opacity-20"></div>
        <div class="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-[#d946ef] rounded-full mix-blend-screen filter blur-[150px] opacity-20"></div>
      </div>

      <!-- Time floating at top center -->
      <div class="absolute top-6 left-1/2 -translate-x-1/2 z-20 px-6 py-2 rounded-full font-bold text-xl shadow-lg border border-white/10 text-white backdrop-blur-md bg-black/40">
        {formatTime(sessionTimeLeft)}
      </div>

      <!-- Left Side -->
      <div class="flex-1 flex flex-col items-center justify-center relative p-8">
        <div class="relative shrink-0 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10" style="height: 80%; aspect-ratio: 1/3; border-radius:12px; overflow:hidden;">
          {#if selectedFrameObj}
            {#each selectedFrameObj.holes as hole, i}
              {#if capturedPhotos[i]}
                <img src={capturedPhotos[i]} class="absolute object-cover" style="top:{hole.y}%; left:{hole.x}%; width:{hole.w}%; height:{hole.h}%; z-index:5;" alt="Captured {i}" />
              {/if}
            {/each}
            <img src={selectedFrameObj.url} alt="Frame" class="relative w-full h-full object-cover z-10 pointer-events-none" />
          {/if}
        </div>
      </div>

      <!-- Right Side -->
      <div class="flex-1 flex flex-col items-center justify-center p-8 md:p-12 relative z-10">
        {#if resultStep === 'confirm'}
          <div class="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center">
            <h2 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00d9d9] to-[#d946ef] mb-4">Yeay! Fotomu Kece Abis! ✨</h2>
            <p class="text-gray-300 font-medium mb-10 text-lg">Halo Kak <span class="text-white font-bold">{userName}</span>, coba cek dulu hasilnya. Kalo udah pas, gass klik Lanjut!</p>
            
            <div class="flex flex-col sm:flex-row gap-4 w-full">
              <button onclick={handleRetakeAll} class="flex-1 py-3.5 rounded-xl font-bold transition-colors border flex justify-center items-center gap-2" style="background:var(--admin-card-bg);color:var(--admin-text);border-color:var(--admin-border);">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                Ulangi Semua
              </button>
              <button onclick={handleOk} class="flex-1 py-3.5 rounded-xl font-bold text-black bg-[#00d9d9] hover:bg-[#00b3b3] transition-colors flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(0,217,217,0.4)] hover:scale-105 transform duration-200">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                Gass Lanjut!
              </button>
            </div>
          </div>
          
        {:else if resultStep === 'final'}
          <div class="w-full max-w-md flex flex-col items-center">
            <!-- Scan Gallery Box -->
            <div class="mb-6 p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 w-full flex flex-col items-center shadow-2xl">
              <p class="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <svg width="20" height="20" class="text-[#00d9d9]" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/></svg>
                Scan untuk Download! 📸
              </p>
              {#if qrCodeUrl}
                <div class="p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  <img src={qrCodeUrl} alt="QR Code" class="w-40 h-40" />
                </div>
              {/if}
            </div>

            <!-- Invoice Box -->
            <div class="mb-8 p-6 rounded-2xl w-full bg-white/5 backdrop-blur-md border border-white/10 text-white shadow-xl">
              <p class="font-bold text-sm mb-4 text-gray-400 tracking-wider">Rincian Sesi</p>
              <div class="flex justify-between text-base mb-4">
                <span>{Math.max(1, sessionFramesCount)}x Cetak Frame</span>
                <span class="font-mono">Rp {(Math.max(1, sessionFramesCount) * 5000).toLocaleString('id-ID')}</span>
              </div>
              <div class="border-t border-white/10 pt-4 flex justify-between font-bold text-lg">
                <span class="text-[#00d9d9]">TOTAL</span>
                <span class="font-mono text-[#00d9d9]">Rp {(Math.max(1, sessionFramesCount) * 5000).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex gap-4 w-full">
              <button onclick={resetSession} class="flex-1 py-4 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex justify-center items-center gap-2">
                Selesai
              </button>
              <button onclick={handleAddSession} class="flex-1 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#d946ef] to-[#8b5cf6] hover:opacity-90 transition-opacity flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:scale-105 transform duration-200">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Mau Foto Lagi!
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
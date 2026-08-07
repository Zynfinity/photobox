<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth';

  let accessCode = $state('');
  let isLoggedIn = $state(false);
  let currentUser = $state<{ name: string; email: string; role: string } | null>(null);

  auth.isLoggedIn.subscribe((v) => (isLoggedIn = v));
  auth.user.subscribe((u) => (currentUser = u));

  function handleOpen() {
    if (accessCode.trim()) {
      goto(`/gallery?code=${encodeURIComponent(accessCode.trim())}`);
    } else if (isLoggedIn && currentUser?.role === 'user') {
      goto('/my-gallery');
    } else if (isLoggedIn && currentUser?.role === 'admin') {
      goto('/gallery');
    } else {
      goto('/login');
    }
  }

  // Simulated preview photos for hero (nightlife/party aesthetic)
  const heroImages = [
    {
      gradient: 'linear-gradient(135deg, #d946ef 0%, #ff006e 100%)',
      rotate: '-3deg',
      translateY: '0px',
      label: 'Strip_001'
    },
    {
      gradient: 'linear-gradient(135deg, #00d9d9 0%, #d946ef 100%)',
      rotate: '2deg',
      translateY: '-20px',
      label: 'Strip_002'
    },
    {
      gradient: 'linear-gradient(135deg, #ff006e 0%, #d946ef 50%, #00d9d9 100%)',
      rotate: '-1deg',
      translateY: '12px',
      label: 'Strip_003'
    },
    {
      gradient: 'linear-gradient(135deg, #6b1b7a 0%, #d946ef 100%)',
      rotate: '4deg',
      translateY: '-8px',
      label: 'Strip_004'
    }
  ];
</script>

<svelte:head>
  <title>FM.PHOTO — Kenangan kamu, tersimpan selamanya.</title>
  <meta name="description" content="Galeri digital photobooth FM.PHOTO. Foto HD dari sesi kamu, siap download kapan saja." />
</svelte:head>

<!-- Hero Section -->
<section
  class="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden"
  style="background: linear-gradient(160deg, #1a1625 0%, #0f0d15 60%, #1a1625 100%);"
>
  <!-- Background glow orbs -->
  <div class="absolute inset-0 pointer-events-none overflow-hidden">
    <div
      class="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
      style="background: radial-gradient(circle, #00d9d9 0%, transparent 70%); filter: blur(60px);"
    ></div>
    <div
      class="absolute top-20 right-0 w-80 h-80 rounded-full opacity-15"
      style="background: radial-gradient(circle, #d946ef 0%, transparent 70%); filter: blur(80px);"
    ></div>
    <div
      class="absolute bottom-0 left-1/3 w-64 h-64 rounded-full opacity-10"
      style="background: radial-gradient(circle, #ff006e 0%, transparent 70%); filter: blur(60px);"
    ></div>
  </div>

  <div class="relative max-w-container mx-auto px-5 md:px-8 py-12 md:py-0 flex flex-col md:flex-row items-center gap-10 md:gap-16 w-full">
    <!-- Kiri: Teks utama -->
    <div class="flex-1 space-y-5 md:space-y-8 max-w-lg w-full">
      <!-- Badge -->
      <div>
        <span class="badge-primary badge text-xs">Photobooth · FM.PHOTO</span>
      </div>

      <!-- Headline -->
      <h1 class="font-display text-on-surface leading-tight" style="font-family: 'Instrument Serif', serif; font-size: clamp(36px, 8vw, 72px); line-height: 1.08; letter-spacing: -0.02em;">
        Kenangan serumu,<br /><em style="font-style: italic; color: #00d9d9;">tersimpan rapi</em> di sini.
      </h1>

      <!-- Sub-headline -->
      <p class="text-body-md md:text-body-lg text-on-surface-variant leading-relaxed" style="max-width: 400px;">
        Hasil foto photobooth kamu tersimpan aman. Cukup login dan langsung unduh foto favoritmu kapan saja dari HP.
      </p>

      <!-- Input kode + CTA -->
      <div class="flex flex-col gap-3 w-full" style="max-width: 420px;">
        <input
          id="hero-access-code"
          type="text"
          placeholder="Masukkan kode akses (opsional)"
          bind:value={accessCode}
          class="input-field w-full text-body-md"
          onkeydown={(e) => e.key === 'Enter' && handleOpen()}
        />
        <button
          id="hero-open-gallery"
          class="btn-primary w-full"
          onclick={handleOpen}
        >
          {#if isLoggedIn}
            Lihat Foto Saya
          {:else}
            Lihat Galeri Saya
          {/if}
        </button>
      </div>

      <!-- Statistik -->
      <div class="flex gap-6 md:gap-8 pt-1">
        <div>
          <p class="text-on-surface font-semibold" style="font-family: 'Space Grotesk', sans-serif; font-size: 20px;">12rb+</p>
          <p class="text-label-sm text-on-surface-variant">Foto Tersimpan</p>
        </div>
        <div class="w-px bg-outline-variant"></div>
        <div>
          <p class="text-on-surface font-semibold" style="font-family: 'Space Grotesk', sans-serif; font-size: 20px;">200+</p>
          <p class="text-label-sm text-on-surface-variant">Sesi Photobooth</p>
        </div>
        <div class="w-px bg-outline-variant"></div>
        <div>
          <p class="text-on-surface font-semibold" style="font-family: 'Space Grotesk', sans-serif; font-size: 20px;">HD</p>
          <p class="text-label-sm text-on-surface-variant">Kualitas HD (300 DPI)</p>
        </div>
      </div>
    </div>

    <!-- Kanan: Kolase foto strip — disembunyikan di layar sangat kecil -->
    <div class="hidden sm:flex flex-1 justify-center md:justify-end items-center relative w-full" style="min-height: 340px; max-height: 420px;">
      <div class="relative w-full" style="height: 340px; max-width: 340px;">
        {#each heroImages as img, i}
          <div
            class="absolute rounded-2xl overflow-hidden border border-outline-variant"
            style="
              background: {img.gradient};
              transform: rotate({img.rotate}) translateY({img.translateY});
              width: {i === 0 ? '46%' : i === 1 ? '44%' : '42%'};
              height: {i === 0 ? '64%' : i === 1 ? '60%' : '56%'};
              {i === 0 ? 'left: 0; top: 10%;' : ''}
              {i === 1 ? 'left: 44%; top: 0;' : ''}
              {i === 2 ? 'left: 16%; top: 42%;' : ''}
              {i === 3 ? 'left: 62%; top: 36%;' : ''}
              box-shadow: 0 16px 40px rgba(0,0,0,0.6);
            "
          >
            <div class="absolute inset-0 flex flex-col items-center justify-center p-2">
              <div class="w-full flex-1 rounded-lg opacity-60" style="background: rgba(0,0,0,0.3); margin-bottom: 6px;"></div>
              <div class="w-full rounded" style="background: rgba(0,0,0,0.4); height: 22px; display: flex; align-items: center; padding: 0 6px;">
                <span style="font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 500; color: rgba(255,255,255,0.8); letter-spacing: 0.05em;">{img.label}.jpg</span>
              </div>
            </div>
            <div class="absolute inset-0 opacity-10" style="background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.5) 3px, rgba(0,0,0,0.5) 4px);"></div>
          </div>
        {/each}
        <div
          class="absolute pulse-glow rounded-full"
          style="width: 8px; height: 8px; background: #00d9d9; bottom: 10%; left: 34%; box-shadow: 0 0 10px #00d9d9;"
        ></div>
      </div>
    </div>
  </div>
</section>

<!-- Cara kerja -->
<section class="py-16 md:py-24" style="background-color: #0f0d15;">
  <div class="max-w-container mx-auto px-5 md:px-8">
    <div class="text-center mb-10 md:mb-16">
      <p class="section-label mb-3 md:mb-4">Cara Kerja</p>
      <h2 class="font-display text-on-surface" style="font-family: 'Instrument Serif', serif; font-size: clamp(28px, 5vw, 48px); line-height: 1.15; letter-spacing: -0.015em;">
        Cuma 3 Langkah Mudah.
      </h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <!-- Langkah 1 -->
      <div class="card relative overflow-hidden group">
        <div class="absolute top-0 left-0 w-full h-1 rounded-t-xl" style="background: linear-gradient(90deg, #00d9d9, #d946ef);"></div>
        <div class="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-4" style="background: rgba(0, 217, 217, 0.15);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L13.09 8.26L19 6L14.74 10.91L21 12L14.74 13.09L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.09L3 12L9.26 10.91L5 6L10.91 8.26L12 2Z" fill="#00d9d9"/>
          </svg>
        </div>
        <h3 class="text-on-surface mb-2" style="font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 16px;">1. Foto di Photobooth</h3>
        <p class="text-on-surface-variant text-sm md:text-base">Datang ke booth kami, pose sesuka hati, dan biarkan sistem menyimpan hasil fotomu secara otomatis.</p>
      </div>

      <!-- Langkah 2 -->
      <div class="card relative overflow-hidden group">
        <div class="absolute top-0 left-0 w-full h-1 rounded-t-xl" style="background: linear-gradient(90deg, #d946ef, #ff006e);"></div>
        <div class="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-4" style="background: rgba(217, 70, 239, 0.15);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 9l-7 7-7-7" stroke="#d946ef" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 16V3" stroke="#d946ef" stroke-width="2" stroke-linecap="round"/>
            <path d="M5 21h14" stroke="#d946ef" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h3 class="text-on-surface mb-2" style="font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 16px;">2. Masuk ke Galeri</h3>
        <p class="text-on-surface-variant text-sm md:text-base">Login ke akunmu dan buka galeri pribadi. Semua foto dari sesimu siap untuk diakses.</p>
      </div>

      <!-- Langkah 3 -->
      <div class="card relative overflow-hidden group">
        <div class="absolute top-0 left-0 w-full h-1 rounded-t-xl" style="background: linear-gradient(90deg, #ff006e, #00d9d9);"></div>
        <div class="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-4" style="background: rgba(255, 0, 110, 0.15);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="18" cy="5" r="3" stroke="#ff006e" stroke-width="2"/>
            <circle cx="6" cy="12" r="3" stroke="#ff006e" stroke-width="2"/>
            <circle cx="18" cy="19" r="3" stroke="#ff006e" stroke-width="2"/>
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="#ff006e" stroke-width="2"/>
          </svg>
        </div>
        <h3 class="text-on-surface mb-2" style="font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 16px;">3. Unduh & Bagikan</h3>
        <p class="text-on-surface-variant text-sm md:text-base">Unduh dalam kualitas jernih (HD 300 DPI), cetak ulang kapan saja, atau langsung bagikan ke media sosialmu!</p>
      </div>
    </div>
  </div>
</section>
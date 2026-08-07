<script lang="ts">
  import { onMount } from 'svelte';
  import { adminGuard, authHeaders } from '$lib/adminGuard';

  type Settings = {
    boothName: string;
    boothLocation: string;
    defaultFrameId: string;
    maxPhotosPerSession: number;
    autoPrint: boolean;
    printCopies: number;
    allowGuestDownload: boolean;
    watermarkText: string;
  };

  let settings = $state<Settings>({
    boothName: '',
    boothLocation: '',
    defaultFrameId: '',
    maxPhotosPerSession: 10,
    autoPrint: true,
    printCopies: 1,
    allowGuestDownload: false,
    watermarkText: 'FM.PHOTO',
  });

  let loading = $state(true);
  let saving = $state(false);
  let saved = $state(false);
  let error = $state('');

  onMount(async () => {
    if (!adminGuard()) return;
    try {
      const res = await fetch('/api/admin/settings', { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        settings = { ...settings, ...d };
      }
    } catch { /* pakai default */ }
    finally { loading = false; }
  });

  async function handleSave(e: Event) {
    e.preventDefault();
    saving = true; error = ''; saved = false;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        saved = true;
        setTimeout(() => saved = false, 3000);
      } else {
        const d = await res.json();
        error = d.message ?? 'Gagal menyimpan pengaturan.';
      }
    } catch { error = 'Tidak bisa terhubung ke server.'; }
    finally { saving = false; }
  }
</script>

<svelte:head><title>FM.PHOTO — Pengaturan</title></svelte:head>

<section class="min-h-screen relative">
  <div class="relative max-w-container mx-auto px-5 md:px-8 py-10">

    <div class="mb-8">
      <a href="/admin" class="text-label-sm text-on-surface-variant hover:text-primary transition-colors">← Dashboard</a>
      <div class="mt-4">
        <p class="section-label mb-2">Sistem</p>
        <h1 class="text-on-surface" style="font-family:'Instrument Serif',serif;font-size:clamp(26px,4vw,38px);line-height:1.1;letter-spacing:-.015em;">Pengaturan</h1>
      </div>
    </div>

    {#if saved}
      <div class="mb-6 px-4 py-3 rounded-xl text-label-md"
        style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);color:#22c55e;">
        ✓ Pengaturan berhasil disimpan.
      </div>
    {/if}
    {#if error}
      <div class="mb-6 px-4 py-3 rounded-xl text-label-md"
        style="background:rgba(255,71,87,.1);border:1px solid rgba(255,71,87,.3);color:#ff4757;">
        {error}
      </div>
    {/if}

    {#if loading}
      <div class="space-y-4">
        {#each Array(3) as _}
          <div class="animate-pulse rounded-2xl" style="height:80px;background:var(--admin-card-bg);border:1px solid var(--admin-card-border);"></div>
        {/each}
      </div>
    {:else}
      <form onsubmit={handleSave} class="space-y-6 max-w-xl">

        <!-- Informasi Booth -->
        <div class="rounded-2xl p-5" style="background:var(--admin-card-bg);border:1px solid var(--admin-card-border);">
          <h2 class="text-on-surface font-semibold mb-5" style="font-family:'Space Grotesk',sans-serif;font-size:15px;">Informasi Booth</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-label-sm text-on-surface-variant mb-1.5" style="text-transform:uppercase;letter-spacing:.05em;font-size:11px;">Nama Booth</label>
              <input bind:value={settings.boothName} type="text" placeholder="cth. FM.PHOTO Booth 1" class="input-field" style="border-radius:12px;" />
            </div>
            <div>
              <label class="block text-label-sm text-on-surface-variant mb-1.5" style="text-transform:uppercase;letter-spacing:.05em;font-size:11px;">Lokasi</label>
              <input bind:value={settings.boothLocation} type="text" placeholder="cth. Mall Central Park Lt. 2" class="input-field" style="border-radius:12px;" />
            </div>
            <div>
              <label class="block text-label-sm text-on-surface-variant mb-1.5" style="text-transform:uppercase;letter-spacing:.05em;font-size:11px;">Teks Watermark Foto</label>
              <input bind:value={settings.watermarkText} type="text" placeholder="FM.PHOTO" class="input-field" style="border-radius:12px;" />
            </div>
          </div>
        </div>

        <!-- Pengaturan Sesi -->
        <div class="rounded-2xl p-5" style="background:var(--admin-card-bg);border:1px solid var(--admin-card-border);">
          <h2 class="text-on-surface font-semibold mb-5" style="font-family:'Space Grotesk',sans-serif;font-size:15px;">Pengaturan Sesi</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-label-sm text-on-surface-variant mb-1.5" style="text-transform:uppercase;letter-spacing:.05em;font-size:11px;">Maks. Foto per Sesi</label>
              <input bind:value={settings.maxPhotosPerSession} type="number" min="1" max="50" class="input-field" style="border-radius:12px;" />
            </div>
            <!-- Toggle: izin download tamu -->
            <div class="flex items-center justify-between py-1">
              <div>
                <p class="text-on-surface text-label-md" style="font-family:'Space Grotesk',sans-serif;">Izinkan Download Tanpa Login</p>
                <p class="text-on-surface-variant" style="font-size:12px;">Tamu bisa download foto tanpa akun</p>
              </div>
              <button type="button"
                onclick={() => settings.allowGuestDownload = !settings.allowGuestDownload}
                class="relative w-11 h-6 rounded-full transition-colors duration-200"
                style="background:{settings.allowGuestDownload?'#00d9d9':'#49454e'};"
                aria-checked={settings.allowGuestDownload} role="switch">
                <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                  style="transform:{settings.allowGuestDownload?'translateX(20px)':'translateX(0)'};"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Pengaturan Cetak -->
        <div class="rounded-2xl p-5" style="background:var(--admin-card-bg);border:1px solid var(--admin-card-border);">
          <h2 class="text-on-surface font-semibold mb-5" style="font-family:'Space Grotesk',sans-serif;font-size:15px;">Pengaturan Cetak</h2>
          <div class="space-y-4">
            <!-- Toggle: cetak otomatis -->
            <div class="flex items-center justify-between py-1">
              <div>
                <p class="text-on-surface text-label-md" style="font-family:'Space Grotesk',sans-serif;">Cetak Otomatis</p>
                <p class="text-on-surface-variant" style="font-size:12px;">Cetak langsung setelah sesi selesai</p>
              </div>
              <button type="button"
                onclick={() => settings.autoPrint = !settings.autoPrint}
                class="relative w-11 h-6 rounded-full transition-colors duration-200"
                style="background:{settings.autoPrint?'#00d9d9':'#49454e'};"
                aria-checked={settings.autoPrint} role="switch">
                <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                  style="transform:{settings.autoPrint?'translateX(20px)':'translateX(0)'};"></span>
              </button>
            </div>
            {#if settings.autoPrint}
              <div>
                <label class="block text-label-sm text-on-surface-variant mb-1.5" style="text-transform:uppercase;letter-spacing:.05em;font-size:11px;">Jumlah Salinan</label>
                <input bind:value={settings.printCopies} type="number" min="1" max="10" class="input-field" style="border-radius:12px;" />
              </div>
            {/if}
          </div>
        </div>

        <!-- Tombol simpan -->
        <button type="submit" disabled={saving} class="btn-primary w-full"
          style="height:52px;font-size:15px;{saving?'opacity:.7;cursor:not-allowed;':''}">
          {#if saving}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Menyimpan…
          {:else}
            Simpan Pengaturan
          {/if}
        </button>

      </form>
    {/if}

  </div>
</section>

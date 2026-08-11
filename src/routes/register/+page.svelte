<script lang="ts">
  import { goto } from '$app/navigation';

  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let error = $state('');
  let loading = $state(false);

  // Validasi password match di client sebelum kirim
  function validate(): string | null {
    if (password.length < 8) return 'Password minimal 8 karakter.';
    if (password !== confirmPassword) return 'Password dan konfirmasi tidak cocok.';
    if (!email && !phone) return 'Isi email atau nomor HP.';
    return null;
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) { error = validationError; return; }

    loading = true;
    error = '';
    try {
      // Backend schema: { name, email, password } — nomor HP belum didukung
      const res = await fetch(`https://panel.tail11f9ba.ts.net/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email.trim() || undefined,
          password,
        })
      });
      if (res.ok) {
        goto('/login');
      } else {
        const err = await res.json().catch(() => ({}));
        error = err.message || 'Pendaftaran gagal. Coba lagi.';
      }
    } catch {
      error = 'Tidak bisa terhubung ke server. Coba lagi.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>FM.PHOTO — Buat Akun</title>
  <meta name="description" content="Daftar akun FM.PHOTO untuk mengakses galeri foto photobooth kamu." />
</svelte:head>

<section
  class="min-h-[calc(100vh-4rem)] flex items-center justify-center relative overflow-hidden px-6 py-12"
  style="background: linear-gradient(160deg, #1a1625 0%, #0f0d15 100%);"
>
  <!-- Background glow orbs -->
  <div class="absolute inset-0 pointer-events-none">
    <div
      class="absolute top-1/4 -right-32 w-64 h-64 rounded-full opacity-15"
      style="background: radial-gradient(circle, #d946ef 0%, transparent 70%); filter: blur(60px);"
    ></div>
    <div
      class="absolute bottom-1/4 -left-32 w-64 h-64 rounded-full opacity-10"
      style="background: radial-gradient(circle, #ff006e 0%, transparent 70%); filter: blur(60px);"
    ></div>
  </div>

  <!-- Register card -->
  <div
    class="relative w-full max-w-md"
    style="background: #1f1a28; border: 1px solid #49454e; border-radius: 1.5rem; padding: clamp(1.5rem, 5vw, 2.5rem); box-shadow: 0 16px 40px rgba(0,0,0,0.6);"
  >
    <!-- Top accent bar -->
    <div
      class="absolute top-0 left-8 right-8 h-0.5 rounded-full"
      style="background: linear-gradient(90deg, transparent, #d946ef, #ff006e, transparent);"
    ></div>

    <!-- Header -->
    <div class="text-center mb-8">
      <p class="section-label mb-3">Buat Akun</p>
      <h1
        class="text-on-surface"
        style="font-family: 'Instrument Serif', serif; font-size: 32px; line-height: 40px; letter-spacing: -0.01em;"
      >
        Daftar Sekarang
      </h1>
      <p class="text-on-surface-variant text-body-md mt-2">
        Akses galeri foto sesi photobooth kamu
      </p>
    </div>

    {#if error}
      <div
        class="mb-6 px-4 py-3 rounded-xl text-error text-body-md"
        style="background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.3);"
        id="register-error"
        role="alert"
      >
        {error}
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-5" id="register-form">

      <!-- Nama -->
      <div class="space-y-2">
        <label
          for="register-name"
          class="block text-label-md text-on-surface-variant"
          style="letter-spacing: 0.05em; text-transform: uppercase; font-size: 11px; font-weight: 500;"
        >
          Nama Lengkap
        </label>
        <input
          id="register-name"
          type="text"
          bind:value={name}
          required
          autocomplete="name"
          placeholder="Nama kamu"
          class="input-field"
        />
      </div>

      <!-- Email -->
      <div class="space-y-2">
        <label
          for="register-email"
          class="block text-label-md text-on-surface-variant"
          style="letter-spacing: 0.05em; text-transform: uppercase; font-size: 11px; font-weight: 500;"
        >
          Email <span style="color: #8e8a96; font-weight: 400; text-transform: none; letter-spacing: 0;">(opsional jika isi nomor HP)</span>
        </label>
        <input
          id="register-email"
          type="email"
          bind:value={email}
          autocomplete="email"
          placeholder="hello@email.com"
          class="input-field"
        />
      </div>

      <!-- Nomor HP -->
      <div class="space-y-2">
        <label
          for="register-phone"
          class="block text-label-md text-on-surface-variant"
          style="letter-spacing: 0.05em; text-transform: uppercase; font-size: 11px; font-weight: 500;"
        >
          Nomor HP <span style="color: #8e8a96; font-weight: 400; text-transform: none; letter-spacing: 0;">(opsional jika isi email)</span>
        </label>
        <input
          id="register-phone"
          type="tel"
          bind:value={phone}
          autocomplete="tel"
          placeholder="08123456789"
          class="input-field"
        />
      </div>

      <!-- Password -->
      <div class="space-y-2">
        <label
          for="register-password"
          class="block text-label-md text-on-surface-variant"
          style="letter-spacing: 0.05em; text-transform: uppercase; font-size: 11px; font-weight: 500;"
        >
          Password
        </label>
        <input
          id="register-password"
          type="password"
          bind:value={password}
          required
          autocomplete="new-password"
          placeholder="Min. 8 karakter"
          class="input-field"
        />
      </div>

      <!-- Konfirmasi Password -->
      <div class="space-y-2">
        <label
          for="register-confirm-password"
          class="block text-label-md text-on-surface-variant"
          style="letter-spacing: 0.05em; text-transform: uppercase; font-size: 11px; font-weight: 500;"
        >
          Konfirmasi Password
        </label>
        <input
          id="register-confirm-password"
          type="password"
          bind:value={confirmPassword}
          required
          autocomplete="new-password"
          placeholder="Ulangi password"
          class="input-field"
          style="{confirmPassword && confirmPassword !== password ? 'border-color: rgba(255,71,87,0.6);' : ''}"
        />
        {#if confirmPassword && confirmPassword !== password}
          <p class="text-label-sm" style="color: #ff4757; margin-top: 4px;">Password tidak cocok.</p>
        {/if}
      </div>

      <!-- Submit -->
      <button
        id="register-submit"
        type="submit"
        disabled={loading}
        class="btn-primary w-full mt-2"
        style="font-size: 15px; height: 52px; {loading ? 'opacity: 0.7; cursor: not-allowed;' : ''}"
      >
        {#if loading}
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          Mendaftar…
        {:else}
          Buat Akun
        {/if}
      </button>
    </form>

    <p class="text-center text-label-md text-on-surface-variant mt-6">
      Sudah punya akun?{' '}
      <a href="/login" class="text-primary hover:opacity-80 transition-opacity duration-200 font-medium" id="register-login-link">
        Masuk di sini
      </a>
    </p>
  </div>
</section>

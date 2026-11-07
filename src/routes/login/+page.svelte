<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$lib/auth';

  // identifier bisa email atau nomor HP — backend hanya menerima "email"
  // sehingga kita kirim ke field yang sama; backend bisa diperluas nanti
  let identifier = $state('');
  let password   = $state('');
  let error      = $state('');
  let loading    = $state(false);

  let redirectTo = $derived($page.url.searchParams.get('redirect') ?? '');
  const IS_DEV = import.meta.env.DEV;

  function devLogin(role: 'admin' | 'user') {
    if (role === 'admin') {
      auth.login('dev-token-admin-2026', { name: 'Dev Admin', email: 'dev@velvet.film', role: 'admin' });
      goto(redirectTo || '/');
    } else {
      auth.login('dev-token-user-2026', { name: 'Dev User', email: 'user@velvet.film', role: 'user' });
      goto(redirectTo || '/my-gallery');
    }
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    loading = true;
    error   = '';
    try {
      // Backend schema: { email, password }
      // Input "identifier" dikirim ke field "email" agar kompatibel
      const res = await fetch(`https://panel.tail11f9ba.ts.net/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: identifier.trim(), password }),
      });

      if (res.ok) {
        const data = await res.json();
        // Backend mengembalikan: { token, user: { id, name, email, role } }
        auth.login(data.token, data.user);
        const role = data.user?.role;
        if (redirectTo)          goto(redirectTo);
        else if (role === 'admin') goto('/');
        else                       goto('/my-gallery');
      } else {
        const err = await res.json().catch(() => ({}));
        error = err.message ?? 'Email atau password salah.';
      }
    } catch {
      error = 'Tidak bisa terhubung ke server. Coba lagi.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>FM.PHOTO — Masuk</title>
  <meta name="description" content="Masuk ke akun FM.PHOTO untuk melihat galeri foto photobooth kamu." />
</svelte:head>

<section
  class="min-h-[calc(100vh-4rem)] flex items-center justify-center relative overflow-hidden px-6 py-12"
  style="background: linear-gradient(160deg, #1a1625 0%, #0f0d15 100%);"
>
  <!-- Background glow orbs -->
  <div class="absolute inset-0 pointer-events-none">
    <div
      class="absolute top-1/4 -left-32 w-64 h-64 rounded-full opacity-15"
      style="background: radial-gradient(circle, #00d9d9 0%, transparent 70%); filter: blur(60px);"
    ></div>
    <div
      class="absolute bottom-1/4 -right-32 w-64 h-64 rounded-full opacity-15"
      style="background: radial-gradient(circle, #d946ef 0%, transparent 70%); filter: blur(60px);"
    ></div>
  </div>

  <!-- Login card -->
  <div
    class="relative w-full max-w-md"
    style="background: #1f1a28; border: 1px solid #49454e; border-radius: 1.5rem; padding: clamp(1.5rem, 5vw, 2.5rem); box-shadow: 0 16px 40px rgba(0,0,0,0.6);"
  >
    <!-- Top accent bar -->
    <div
      class="absolute top-0 left-8 right-8 h-0.5 rounded-full"
      style="background: linear-gradient(90deg, transparent, #00d9d9, #d946ef, transparent);"
    ></div>

    <!-- Header -->
    <div class="text-center mb-8">
      <div class="flex items-center justify-center gap-2 mb-3">
        <p class="section-label">Portal Masuk</p>
        {#if IS_DEV}
          <span
            style="
              display: inline-flex; align-items: center; gap: 4px;
              background: rgba(255, 170, 0, 0.15); border: 1px solid rgba(255, 170, 0, 0.35);
              color: #ffaa00; font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
              text-transform: uppercase; padding: 2px 8px; border-radius: 9999px;
            "
          >
            ⚡ DEV MODE
          </span>
        {/if}
      </div>
      <h1
        class="text-on-surface"
        style="font-family: 'Instrument Serif', serif; font-size: 32px; line-height: 40px; letter-spacing: -0.01em;"
      >
        Selamat Datang
      </h1>
      <p class="text-on-surface-variant text-body-md mt-2">Masuk untuk melihat galeri foto kamu</p>
    </div>

    {#if error}
      <div
        class="mb-6 px-4 py-3 rounded-xl text-error text-body-md"
        style="background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.3);"
        id="login-error"
      >
        {error}
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-5" id="login-form">
      <!-- Email atau Nomor HP -->
      <div class="space-y-2">
        <label
          for="login-identifier"
          class="block text-label-md text-on-surface-variant"
          style="letter-spacing: 0.05em; text-transform: uppercase; font-size: 11px; font-weight: 500;"
        >
          Email atau Nomor HP
        </label>
        <input
          id="login-identifier"
          type="text"
          bind:value={identifier}
          required
          autocomplete="username"
          placeholder="hello@email.com atau 08123456789"
          class="input-field"
        />
      </div>

      <!-- Password -->
      <div class="space-y-2">
        <label
          for="login-password"
          class="block text-label-md text-on-surface-variant"
          style="letter-spacing: 0.05em; text-transform: uppercase; font-size: 11px; font-weight: 500;"
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          bind:value={password}
          required
          autocomplete="current-password"
          placeholder="••••••••"
          class="input-field"
        />
      </div>

      <!-- Submit -->
      <button
        id="login-submit"
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
          Masuk…
        {:else}
          Masuk
        {/if}
      </button>
    </form>

    <!-- DEV: Quick bypass login -->
    {#if IS_DEV}
      <div class="mt-5" style="border-top: 1px solid #49454e; padding-top: 20px;">
        <p
          class="text-center text-label-sm mb-3"
          style="color: rgba(255,170,0,0.6); letter-spacing: 0.06em; text-transform: uppercase;"
        >
          — Khusus Development —
        </p>
        <div class="flex gap-3">
          <!-- Dev login sebagai Admin -->
          <button
            id="login-dev-admin"
            type="button"
            onclick={() => devLogin('admin')}
            class="flex-1 flex items-center justify-center gap-1.5 rounded-full font-medium transition-all duration-200"
            style="
              height: 44px; font-size: 13px;
              background: rgba(255, 170, 0, 0.1);
              border: 1px dashed rgba(255, 170, 0, 0.4);
              color: #ffaa00;
            "
            onmouseenter={(e) => (e.currentTarget.style.background = 'rgba(255, 170, 0, 0.18)')}
            onmouseleave={(e) => (e.currentTarget.style.background = 'rgba(255, 170, 0, 0.1)')}
          >
            ⚡ Masuk sbg Admin
          </button>
          <!-- Dev login sebagai User biasa -->
          <button
            id="login-dev-user"
            type="button"
            onclick={() => devLogin('user')}
            class="flex-1 flex items-center justify-center gap-1.5 rounded-full font-medium transition-all duration-200"
            style="
              height: 44px; font-size: 13px;
              background: rgba(0, 217, 217, 0.08);
              border: 1px dashed rgba(0, 217, 217, 0.35);
              color: #00d9d9;
            "
            onmouseenter={(e) => (e.currentTarget.style.background = 'rgba(0, 217, 217, 0.15)')}
            onmouseleave={(e) => (e.currentTarget.style.background = 'rgba(0, 217, 217, 0.08)')}
          >
            🎞 Masuk sbg User
          </button>
        </div>
      </div>
    {/if}

    <!-- Footer link -->
    <p class="text-center text-label-md text-on-surface-variant mt-6">
      Belum punya akun?{' '}
      <a href="/register" class="text-primary hover:opacity-80 transition-opacity duration-200 font-medium" id="login-register-link">
        Daftar di sini
      </a>
    </p>
  </div>
</section>

<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/auth';

  let isScrolled = $state(false);
  let mobileMenuOpen = $state(false);
  let currentUser = $state<{ name: string; email: string; role: string } | null>(null);
  let isLoggedIn = $state(false);

  auth.user.subscribe((u) => (currentUser = u));
  auth.isLoggedIn.subscribe((v) => (isLoggedIn = v));

  $effect(() => {
    const handleScroll = () => { isScrolled = window.scrollY > 20; };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  });

  function handleLogout() {
    auth.logout();
    mobileMenuOpen = false;
    goto('/');
  }

  function closeMenu() { mobileMenuOpen = false; }
</script>

<header
  class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
  class:border-b={isScrolled}
  class:border-outline-variant={isScrolled}
  style="
    backdrop-filter: {isScrolled ? 'blur(20px)' : 'none'};
    background-color: {isScrolled ? 'rgba(10, 8, 16, 0.85)' : 'transparent'};
  "
>
  <div class="max-w-container mx-auto px-6 h-20 flex items-center justify-between">

    <!-- Logo -->
    <a href="/" class="flex items-center gap-2 group" id="nav-logo">
      <span
        class="text-primary transition-opacity duration-200 group-hover:opacity-75"
        style="font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 18px; letter-spacing: 0.05em;"
      >
        FM<span class="text-on-surface-variant">.PHOTO</span>
      </span>
    </a>

    <!-- Desktop nav -->
    <nav class="hidden md:flex items-center gap-8" aria-label="Navigasi utama">
      {#if !isLoggedIn}
        <a
          href="/gallery"
          id="nav-showcase"
          class="text-body-md text-on-surface-variant hover:text-on-surface transition-colors duration-200"
          aria-current={$page.url.pathname === '/gallery' ? 'page' : undefined}
          class:text-on-surface={$page.url.pathname === '/gallery'}
        >
          Galeri Publik
        </a>
      {/if}

      {#if isLoggedIn}
        {#if currentUser?.role === 'user'}
          <a
            href="/my-gallery"
            id="nav-my-gallery"
            class="text-body-md text-on-surface-variant hover:text-on-surface transition-colors duration-200"
            aria-current={$page.url.pathname.startsWith('/my-gallery') ? 'page' : undefined}
            class:text-on-surface={$page.url.pathname.startsWith('/my-gallery')}
          >
            Galeri Saya
          </a>
        {:else if currentUser?.role === 'admin'}
          <a
            href="/admin"
            id="nav-admin-dashboard"
            class="text-body-md text-on-surface-variant hover:text-on-surface transition-colors duration-200"
            aria-current={$page.url.pathname.startsWith('/admin') ? 'page' : undefined}
            class:text-on-surface={$page.url.pathname.startsWith('/admin')}
          >
            Dashboard
          </a>
        {/if}

        <!-- Hanya Nama User + Tombol Keluar (Avatar Dihapus) -->
        <div class="flex items-center gap-8">
          <span
            class="text-body-md text-on-surface-variant font-medium"
            style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
            title={currentUser?.email}
          >
            {currentUser?.name}
          </span>
          <button
  id="nav-logout"
  onclick={handleLogout}
  class="text-xs px-3.5 py-1.5 rounded-lg border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary transition-all duration-200"
>
  Keluar
</button>
        </div>
      {:else}
        <a href="/login" id="nav-login" class="btn-primary text-sm px-5 h-10 flex items-center justify-center">
          Masuk
        </a>
      {/if}
    </nav>

    <!-- Mobile: hamburger -->
    <button
      id="nav-mobile-toggle"
      class="md:hidden flex flex-col gap-1.5 p-2 -mr-2"
      onclick={() => mobileMenuOpen = !mobileMenuOpen}
      aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
      aria-expanded={mobileMenuOpen}
    >
      <span class="w-5 h-0.5 bg-on-surface transition-all duration-200"
        class:rotate-45={mobileMenuOpen} class:translate-y-2={mobileMenuOpen}></span>
      <span class="w-5 h-0.5 bg-on-surface transition-all duration-200"
        class:opacity-0={mobileMenuOpen}></span>
      <span class="w-5 h-0.5 bg-on-surface transition-all duration-200"
        class:-rotate-45={mobileMenuOpen} class:-translate-y-2={mobileMenuOpen}></span>
    </button>
  </div>

  <!-- Mobile menu drawer -->
  {#if mobileMenuOpen}
    <div
      class="md:hidden border-t border-outline-variant"
      style="background-color: rgba(10,8,16,0.96); backdrop-filter: blur(20px);"
    >
      <nav class="flex flex-col gap-1 px-6 py-4" aria-label="Navigasi mobile">
        <a href="/" class="text-on-surface-variant hover:text-on-surface py-3 text-body-md border-b border-outline-variant" onclick={closeMenu}>
          Beranda
        </a>

        {#if !isLoggedIn}
          <a href="/gallery" class="text-on-surface-variant hover:text-on-surface py-3 text-body-md border-b border-outline-variant" onclick={closeMenu}>
            Galeri Publik
          </a>
        {/if}

        {#if isLoggedIn}
          {#if currentUser?.role === 'user'}
            <a href="/my-gallery" class="text-on-surface-variant hover:text-on-surface py-3 text-body-md border-b border-outline-variant" onclick={closeMenu}>
              Galeri Saya
            </a>
          {:else if currentUser?.role === 'admin'}
            <a href="/admin" class="text-on-surface-variant hover:text-on-surface py-3 text-body-md border-b border-outline-variant" onclick={closeMenu}>
              Dashboard
            </a>
          {/if}

          <div class="py-3 text-label-md text-on-surface-variant">
            Masuk sebagai <span class="text-primary font-medium">{currentUser?.name}</span>
          </div>
          <button
            onclick={handleLogout}
            class="btn-secondary w-full justify-center h-9 text-xs"
          >
            Keluar
          </button>
        {:else}
          <a href="/login" class="btn-primary mt-3 w-full justify-center h-10 text-sm" onclick={closeMenu}>
            Masuk
          </a>
        {/if}
      </nav>
    </div>
  {/if}
</header>

<div class="h-20" aria-hidden="true"></div>
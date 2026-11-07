<script lang="ts">
  import { page } from '$app/stores';
  import { auth } from '$lib/auth';
  import { theme } from '$lib/stores/theme';
  import type { Snippet } from 'svelte';
  
  let { children }: { children: Snippet } = $props();

  let currentUser = $state<{ name: string; email: string; role: string } | null>(null);
  auth.user.subscribe((u) => (currentUser = u));

  let isSidebarOpen = $state(true);
  let isDark = $derived($theme === 'dark');

  function toggleTheme() {
    theme.toggle();
  }

  let currentPath = $derived($page?.url?.pathname || '');

  function handleLogout() {
    auth.logout();
    window.location.href = '/login';
  }

  function isActive(path: string) {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path) && path !== '/';
  }
</script>

<div class="flex h-screen overflow-hidden" style="background:var(--admin-bg); font-family:'Space Grotesk',sans-serif;">
  <aside
    class="flex flex-col shrink-0 transition-all duration-300 overflow-hidden z-50"
    style="width:{isSidebarOpen?'240px':'0px'}; background:var(--admin-sidebar); border-right:1px solid var(--admin-sidediv);"
  >
    <div class="h-16 flex items-center px-6 shrink-0" style="border-bottom:1px solid var(--admin-sidediv);">
      <a href="/" class="text-xl font-bold tracking-wider whitespace-nowrap" style="color:var(--admin-nav-active);">
        FM<span style="color:#00d9d9;">Photo</span>
      </a>
    </div>
    <nav class="flex-1 overflow-y-auto overflow-x-hidden py-3">
      <div class="mb-1">
        <p class="px-5 pt-3 pb-1.5 text-[10px] font-bold tracking-[0.12em] whitespace-nowrap" style="color:#00d9d9;">OPERASIONAL</p>

        {#each [
          { href:'/start',          label:'Start Aplikasi', target: '_blank', icon:`<path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>` },
          { href:'/sessions',       label:'Sesi & Galeri', icon:`<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"/>` },
          { href:'/print',          label:'Cetak',         icon:`<path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"/>` },
        ] as item}
          <a href={item.href} target={item.target || '_self'}
            class="flex items-center gap-3 px-5 py-2.5 whitespace-nowrap transition-colors duration-150"
            style="font-size:14px;font-weight:500;color:{isActive(item.href)?'var(--admin-nav-active)':'var(--admin-nav-text)'};background:{isActive(item.href)?'var(--admin-nav-act-bg)':'transparent'};border-left:3px solid {isActive(item.href)?'#00d9d9':'transparent'};"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">{@html item.icon}</svg>
            {item.label}
          </a>
        {/each}
      </div>
      <div class="mb-1">
        <p class="px-5 pt-4 pb-1.5 text-[10px] font-bold tracking-[0.12em] whitespace-nowrap" style="color:#00d9d9;">MANAJEMEN</p>

        {#each [
          { href:'/',               label:'Statistik',  icon:`<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>` },
          { href:'/users',          label:'Pengguna',   icon:`<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>` },
          { href:'/frames',         label:'Frame',      icon:`<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm-3 6.75h9.75A2.25 2.25 0 0022.5 16.5V7.5a2.25 2.25 0 00-2.25-2.25H9a2.25 2.25 0 00-2.25 2.25v9A2.25 2.25 0 008.25 18.75z"/>` },
          { href:'/settings',       label:'Pengaturan', icon:`<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>` },
        ] as item}
          <a href={item.href}
            class="flex items-center gap-3 px-5 py-2.5 whitespace-nowrap transition-colors duration-150"
            style="font-size:14px;font-weight:500;color:{isActive(item.href)?'var(--admin-nav-active)':'var(--admin-nav-text)'};background:{isActive(item.href)?'var(--admin-nav-act-bg)':'transparent'};border-left:3px solid {isActive(item.href)?'#00d9d9':'transparent'};"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">{@html item.icon}</svg>
            {item.label}
          </a>
        {/each}
      </div>

    </nav>
    <div class="p-4 shrink-0" style="border-top:1px solid var(--admin-sidediv);">

      <button
        onclick={handleLogout}
        class="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors duration-150"
        style="color:#ff4757;border:1px solid rgba(255,71,87,0.2);"
        onmouseenter={(e) => (e.currentTarget.style.background='rgba(255,71,87,0.08)')}
        onmouseleave={(e) => (e.currentTarget.style.background='transparent')}
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        Logout
      </button>
    </div>
  </aside>

  <!-- ═══ MAIN ═══ -->
  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

    <!-- Topbar -->
    <header class="h-16 flex items-center justify-between px-4 shrink-0" style="background:var(--admin-topbar);border-bottom:1px solid var(--admin-sidediv);">
      <!-- Hamburger -->
      <button
        onclick={() => isSidebarOpen = !isSidebarOpen}
        class="p-2 rounded-lg transition-colors duration-150 hover:bg-black/10 dark:hover:bg-white/10"
        style="color:var(--admin-nav-text);"
        aria-label="Toggle sidebar"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      <!-- Right side -->
      <div class="flex items-center gap-3">
        <!-- Dark mode toggle -->
        <button
          onclick={toggleTheme}
          class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-150 hover:opacity-80"
          style="background:var(--admin-sidediv); color:var(--admin-nav-text);"
          title={isDark ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
          aria-label="Toggle theme"
        >
          {#if isDark}
            <!-- Sun icon -->
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
            </svg>
          {:else}
            <!-- Moon icon -->
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
            </svg>
          {/if}
        </button>

        <!-- User chip -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full" style="border:1px solid rgba(0,217,217,0.25);background:rgba(0,217,217,0.08);">
          <div class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs" style="background:#00d9d9;color:#0a0810;">
            {currentUser?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <span class="text-sm font-medium" style="color:#00d9d9;">{currentUser?.name ?? 'Admin'}</span>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="flex-1 overflow-y-auto admin-content" style="background:var(--admin-content);">
      {@render children()}
    </main>

  </div>
</div>

<style>
  /* Force all child page <section> backgrounds to follow the theme */
  .admin-content :global(section) {
    background: var(--admin-page-gradient) !important;
  }
  .admin-content :global(.section-label) {
    color: var(--admin-text-muted) !important;
  }
  .admin-content :global(.text-on-surface) {
    color: var(--admin-text) !important;
  }
  .admin-content :global(.text-on-surface-variant) {
    color: var(--admin-text-muted) !important;
  }
  .admin-content :global(.input-field) {
    background-color: var(--admin-input-bg) !important;
    border-color: var(--admin-card-border) !important;
    color: var(--admin-text) !important;
  }
</style>

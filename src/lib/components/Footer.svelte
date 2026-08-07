<script lang="ts">
  import { auth } from '$lib/auth';

  let currentUser = $state<{ name: string; email: string; role: string } | null>(null);
  let isLoggedIn = $state(false);

  auth.user.subscribe((u) => (currentUser = u));
  auth.isLoggedIn.subscribe((v) => (isLoggedIn = v));

  const year = new Date().getFullYear();
</script>

<footer class="border-t border-outline-variant mt-24" style="background-color: #0f0d15;">
  <div class="max-w-container mx-auto px-5 md:px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-4">

    <!-- Brand + copyright -->
    <div class="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
      <span style="font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 14px; letter-spacing: 0.05em;">
        <span class="text-primary">FM</span><span class="text-on-surface-variant">.PHOTO</span>
      </span>
      <span class="hidden sm:inline text-outline-variant">·</span>
      <p class="text-label-sm text-on-surface-variant">
        © {year} FM Digital Photo Services
      </p>
    </div>

    <!-- Links sesuai role -->
    <nav class="flex items-center gap-5" aria-label="Navigasi footer">
      {#if isLoggedIn && currentUser?.role === 'user'}
        <a
          href="/my-gallery"
          class="text-label-sm text-on-surface-variant hover:text-on-surface transition-colors duration-200"
        >
          Galeri Saya
        </a>
      {/if}
      {#if isLoggedIn && currentUser?.role === 'admin'}
        <a
          href="/admin"
          class="text-label-sm text-on-surface-variant hover:text-on-surface transition-colors duration-200"
        >
          Dashboard
        </a>
      {/if}
      {#if !isLoggedIn}
        <a
          href="/gallery"
          class="text-label-sm text-on-surface-variant hover:text-on-surface transition-colors duration-200"
        >
          Galeri Publik
        </a>
        <a
          href="/login"
          class="text-label-sm text-on-surface-variant hover:text-on-surface transition-colors duration-200"
        >
          Masuk
        </a>
      {/if}
    </nav>
  </div>
</footer>

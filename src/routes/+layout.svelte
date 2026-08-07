<script lang="ts">
  import "../app.css";
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import type { Snippet } from 'svelte';
  import { page } from '$app/stores';

  let { children }: { children: Snippet } = $props();
  let publicPaths = ['/home', '/my-gallery', '/login', '/register'];
  let isStandalone = $derived(
    !publicPaths.some(p => $page.url.pathname === p || $page.url.pathname.startsWith(p + '/') && p !== '/my-gallery')
  );
</script>

<svelte:head>
  <meta name="theme-color" content="#0a0810" />
</svelte:head>

{#if !isStandalone}
<Navbar />
{/if}

<main>
  {@render children()}
</main>

{#if !isStandalone}
<Footer />
{/if}

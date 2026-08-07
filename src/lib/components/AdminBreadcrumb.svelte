<script lang="ts">
  interface Props {
    /** Label halaman saat ini */
    current: string;
    /** Link kembali — default ke /admin */
    backHref?: string;
    /** Label link kembali */
    backLabel?: string;
  }

  let {
    current,
    backHref,
    backLabel,
  }: Props = $props();
</script>

<nav class="mb-8" aria-label="Breadcrumb">
  {#if backHref && backLabel}
    <a
      href={backHref}
      class="text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200"
    >
      {backLabel}
    </a>
  {/if}
  <div class="flex items-end gap-3 mt-4">
    <div class="flex-1">
      <p class="section-label mb-2">Manajemen</p>
      <h1
        class="text-on-surface"
        style="font-family: 'Instrument Serif', serif; font-size: clamp(26px, 4vw, 38px); line-height: 1.1; letter-spacing: -0.015em;"
      >
        {current}
      </h1>
    </div>
    <!-- Slot untuk tombol aksi (opsional) -->
    <slot />
  </div>
</nav>

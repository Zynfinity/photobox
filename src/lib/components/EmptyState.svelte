<script lang="ts">
  interface Props {
    title: string;
    description?: string;
    /** Warna ikon: 'primary' | 'error' */
    variant?: 'primary' | 'error';
  }

  let {
    title,
    description,
    variant = 'primary',
  }: Props = $props();

  const color     = variant === 'error' ? '#ff4757' : '#00d9d9';
  const bgColor   = variant === 'error' ? 'rgba(255,71,87,0.08)' : 'rgba(0,217,217,0.08)';
  const bdrColor  = variant === 'error' ? 'rgba(255,71,87,0.2)'  : 'rgba(0,217,217,0.2)';
</script>

<div class="flex flex-col items-center justify-center py-20 text-center px-6">
  <div
    class="w-16 h-16 rounded-full flex items-center justify-center mb-5"
    style="background: {bgColor}; border: 1px solid {bdrColor};"
  >
    {#if variant === 'error'}
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke={color} stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
      </svg>
    {:else}
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke={color} stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/>
      </svg>
    {/if}
  </div>

  <h2 class="text-on-surface mb-2" style="font-family: 'Instrument Serif', serif; font-size: 24px;">
    {title}
  </h2>
  {#if description}
    <p class="text-on-surface-variant text-body-md" style="max-width: 320px;">{description}</p>
  {/if}

  <!-- Slot untuk tombol aksi opsional -->
  <div class="mt-6">
    <slot />
  </div>
</div>

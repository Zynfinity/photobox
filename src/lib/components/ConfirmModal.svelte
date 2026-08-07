<script lang="ts">
  interface Props {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    dangerous?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let {
    title,
    message,
    confirmLabel = 'Hapus',
    cancelLabel = 'Batal',
    dangerous = true,
    onConfirm,
    onCancel,
  }: Props = $props();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center p-4"
  style="background: var(--admin-modal-backdrop); backdrop-filter: blur(8px);"
  onclick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
  onkeydown={(e) => e.key === 'Escape' && onCancel()}
  role="dialog"
  aria-modal="true"
  aria-labelledby="confirm-modal-title"
>
  <div
    class="w-full max-w-sm rounded-2xl p-6 text-center"
    style="
      background: var(--admin-card-bg);
      border: 1px solid {dangerous ? 'rgba(255,71,87,0.3)' : 'var(--admin-card-border)'};
      box-shadow: 0 24px 60px rgba(0,0,0,0.6);
    "
  >
    <!-- Ikon peringatan -->
    <div
      class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
      style="background: {dangerous ? 'rgba(255,71,87,0.1)' : 'rgba(0,217,217,0.1)'};"
    >
      {#if dangerous}
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#ff4757" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
        </svg>
      {:else}
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#00d9d9" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
        </svg>
      {/if}
    </div>

    <h3
      id="confirm-modal-title"
      class="text-on-surface font-semibold mb-2"
      style="font-family: 'Space Grotesk', sans-serif; font-size: 17px;"
    >
      {title}
    </h3>
    <p class="text-on-surface-variant text-sm mb-6 leading-relaxed">
      {@html message}
    </p>

    <div class="flex gap-3">
      <button onclick={onCancel} class="btn-secondary flex-1">
        {cancelLabel}
      </button>
      <button
        onclick={onConfirm}
        class="flex-1 rounded-full font-medium transition-all duration-200"
        style="
          height: 48px; font-size: 14px;
          background: {dangerous ? 'rgba(255,71,87,0.15)' : 'rgba(0,217,217,0.15)'};
          border: 1px solid {dangerous ? 'rgba(255,71,87,0.4)' : 'rgba(0,217,217,0.4)'};
          color: {dangerous ? '#ff4757' : '#00d9d9'};
        "
      >
        {confirmLabel}
      </button>
    </div>
  </div>
</div>

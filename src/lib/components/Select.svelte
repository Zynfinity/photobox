<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    value: string;
    options: Option[];
    id?: string;
    label?: string;
    disabled?: boolean;
  }

  let {
    value = $bindable(),
    options,
    id,
    label,
    disabled = false,
  }: Props = $props();

  let open = $state(false);
  let containerEl = $state<HTMLDivElement | undefined>(undefined);

  let selectedLabel = $derived(
    options.find(o => o.value === value)?.label ?? options[0]?.label ?? ''
  );

  function select(val: string) {
    value = val;
    open = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open = !open; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = options.findIndex(o => o.value === value);
      if (idx < options.length - 1) value = options[idx + 1].value;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = options.findIndex(o => o.value === value);
      if (idx > 0) value = options[idx - 1].value;
    }
  }

  // Tutup dropdown saat klik di luar
  function handleOutsideClick(e: MouseEvent) {
    if (containerEl && !containerEl.contains(e.target as Node)) {
      open = false;
    }
  }

  $effect(() => {
    if (open) {
      document.addEventListener('click', handleOutsideClick);
    } else {
      document.removeEventListener('click', handleOutsideClick);
    }
    return () => document.removeEventListener('click', handleOutsideClick);
  });
</script>

<div class="relative" bind:this={containerEl}>
  <!-- Trigger button -->
  <button
    {id}
    type="button"
    role="combobox"
    aria-expanded={open}
    aria-haspopup="listbox"
    aria-label={label}
    {disabled}
    onclick={() => { if (!disabled) open = !open; }}
    onkeydown={handleKeydown}
    class="w-full flex items-center justify-between gap-2 text-left transition-all duration-200"
    style="
      height: 48px;
      padding: 0 20px;
      border-radius: 12px;
      border: 1px solid {open ? 'var(--admin-primary, #00d9d9)' : 'var(--admin-input-border, var(--admin-card-border, #49454e))'};
      background: var(--admin-input-bg, #15121d);
      color: var(--admin-text, #ede9f0);
      font-family: 'Space Grotesk', sans-serif;
      font-size: 16px;
      cursor: {disabled ? 'not-allowed' : 'pointer'};
      opacity: {disabled ? '0.5' : '1'};
      box-shadow: {open ? '0 0 0 3px rgba(0,217,217,0.15)' : 'none'};
      outline: none;
    "
  >
    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
      {selectedLabel}
    </span>
    <!-- Chevron icon -->
    <svg
      width="16" height="16" fill="none" viewBox="0 0 24 24"
      stroke="#8e8a96" stroke-width="2"
      style="shrink-0; transition: transform 0.2s ease; transform: {open ? 'rotate(180deg)' : 'rotate(0deg)'};"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
    </svg>
  </button>

  <!-- Dropdown panel -->
  {#if open}
    <div
      role="listbox"
      aria-label={label}
      class="absolute left-0 right-0 z-50 mt-1 overflow-hidden"
      style="
        border-radius: 12px;
        border: 1px solid var(--admin-card-border, #49454e);
        background: var(--admin-card-bg, #1f1a28);
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      "
    >
      {#each options as opt (opt.value)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          role="option"
          aria-selected={opt.value === value}
          onclick={() => select(opt.value)}
          class="flex items-center justify-between gap-2 px-5 py-3 cursor-pointer transition-colors duration-150"
          style="
            background: {opt.value === value ? 'var(--admin-primary-10, rgba(0,217,217,0.08))' : 'transparent'};
            color: {opt.value === value ? 'var(--admin-primary, #00d9d9)' : 'var(--admin-text, #ede9f0)'};
            font-family: 'Space Grotesk', sans-serif;
            font-size: 15px;
          "
          onmouseenter={(e) => { if (opt.value !== value) e.currentTarget.style.background = 'var(--admin-hover-bg, rgba(255,255,255,0.04))'; }}
          onmouseleave={(e) => { e.currentTarget.style.background = opt.value === value ? 'var(--admin-primary-10, rgba(0,217,217,0.08))' : 'transparent'; }}
        >
          <span>{opt.label}</span>
          {#if opt.value === value}
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#00d9d9" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
            </svg>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

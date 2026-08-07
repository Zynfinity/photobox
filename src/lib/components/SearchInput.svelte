<script lang="ts">
  interface Props {
    value: string;
    placeholder?: string;
    id?: string;
  }

  let {
    value = $bindable(),
    placeholder = 'Cari…',
    id,
  }: Props = $props();
</script>

<div class="relative">
  <svg
    class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
    style="color: #8e8a96;"
    fill="none" viewBox="0 0 24 24" stroke="currentColor"
    aria-hidden="true"
  >
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </svg>
  <input
    {id}
    type="search"
    bind:value
    {placeholder}
    class="input-field pl-10"
    style="height: 44px;"
    autocomplete="off"
  />
</div>

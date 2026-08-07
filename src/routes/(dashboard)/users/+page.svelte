<script lang="ts">
  import { onMount } from 'svelte';
  import { adminGuard, authHeaders } from '$lib/adminGuard';
  import AdminBreadcrumb from '$lib/components/AdminBreadcrumb.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Select from '$lib/components/Select.svelte';
  import { formatDate } from '$lib/utils';

  const roleOptions = [
    { value: 'user',  label: 'Pengguna' },
    { value: 'admin', label: 'Admin' },
  ];

  type User = {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role: 'admin' | 'user';
    createdAt: string;
    sessionCount: number;
  };

  let users: User[] = $state([]);
  let loading = $state(true);
  let search = $state('');

  let showModal = $state(false);
  let modalMode = $state<'add' | 'edit'>('add');
  let editTarget = $state<User | null>(null);
  let formName = $state('');
  let formEmail = $state('');
  let formPhone = $state('');
  let formPassword = $state('');
  let formRole = $state<'admin' | 'user'>('user');
  let formError = $state('');
  let formLoading = $state(false);
  let deleteTarget = $state<User | null>(null);

  const IS_DEV = import.meta.env.DEV;
  const demoUsers: User[] = [
    { id: 'u1', name: 'Ayu Pratiwi',    email: 'ayu@email.com',   phone: '08111111111', role: 'user',  createdAt: '2026-07-10', sessionCount: 3 },
    { id: 'u2', name: 'Bima Santoso',   email: 'bima@email.com',  phone: '08222222222', role: 'user',  createdAt: '2026-07-12', sessionCount: 1 },
    { id: 'u3', name: 'Cinta Maharani', email: 'cinta@email.com', phone: '08333333333', role: 'user',  createdAt: '2026-07-20', sessionCount: 5 },
    { id: 'u4', name: 'Dev Admin',      email: 'dev@FM.PHOTO', phone: undefined,     role: 'admin', createdAt: '2026-01-01', sessionCount: 0 },
  ];

  onMount(async () => {
    if (!adminGuard()) return;
    try {
      // GET $apiDomain$apiDomain/api/users — admin endpoint
      const res = await fetch('https://photobox.fajarjaya.site$apiDomain$apiDomain/api/users?limit=100', { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        users = (d.data ?? d ?? []).map((u: {
          id: string; name: string; email: string; role: string; created_at: string;
        }) => ({
          id:           u.id,
          name:         u.name,
          email:        u.email,
          phone:        undefined,
          role:         u.role as 'admin' | 'user',
          createdAt:    u.created_at,
          sessionCount: 0,
        }));
      }
    } catch { /* demo */ }
    finally { loading = false; }
  });

  let showDemo = $derived(!loading && users.length === 0 && IS_DEV);
  let display  = $derived(showDemo ? demoUsers : users);
  let filtered = $derived(
    search.trim()
      ? display.filter(u =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.phone?.includes(search)
        )
      : display
  );

  function openAdd() {
    modalMode = 'add'; editTarget = null;
    formName = ''; formEmail = ''; formPhone = ''; formPassword = ''; formRole = 'user'; formError = '';
    showModal = true;
  }

  function openEdit(u: User) {
    modalMode = 'edit'; editTarget = u;
    formName = u.name; formEmail = u.email ?? ''; formPhone = u.phone ?? '';
    formPassword = ''; formRole = u.role; formError = '';
    showModal = true;
  }

  async function handleFormSubmit(e: Event) {
    e.preventDefault();
    if (!formName.trim()) { formError = 'Nama wajib diisi.'; return; }
    if (!formEmail) { formError = 'Email wajib diisi.'; return; }
    if (modalMode === 'add' && formPassword.length < 8) { formError = 'Password minimal 8 karakter.'; return; }
    formLoading = true; formError = '';
    try {
      // POST $apiDomain$apiDomain/api/users  atau  PATCH $apiDomain$apiDomain/api/users/:id
      const body: Record<string, unknown> = { name: formName, email: formEmail, role: formRole };
      if (formPassword) body.password = formPassword;
      const url    = modalMode === 'add' ? 'https://photobox.fajarjaya.site$apiDomain$apiDomain/api/users' : `$apiDomain$apiDomain/api/users/${editTarget?.id}`;
      const method = modalMode === 'add' ? 'POST' : 'PATCH';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) });
      if (res.ok) {
        const d = await res.json();
        const mapped = {
          id: d.id, name: d.name, email: d.email,
          phone: undefined, role: d.role, createdAt: d.created_at, sessionCount: 0,
        };
        users = modalMode === 'add' ? [mapped, ...users] : users.map(u => u.id === editTarget?.id ? mapped : u);
        showModal = false;
      } else { const err = await res.json(); formError = err.message ?? 'Terjadi kesalahan.'; }
    } catch { formError = 'Tidak bisa terhubung ke server.'; }
    finally { formLoading = false; }
  }

  // DELETE $apiDomain$apiDomain/api/users/:id
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`$apiDomain$apiDomain/api/users/${deleteTarget.id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) users = users.filter(u => u.id !== deleteTarget?.id);
    } catch { /* silent */ }
    finally { deleteTarget = null; }
  }
</script>

<svelte:head><title>VELVET.FILM — Kelola Pengguna</title></svelte:head>

<!-- Modal tambah / edit -->
{#if showModal}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background:var(--admin-modal-backdrop);backdrop-filter:blur(8px);"
    onclick={(e) => { if (e.target===e.currentTarget) showModal=false; }}
    onkeydown={(e) => e.key==='Escape' && (showModal=false)}
    role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
    <div class="w-full max-w-md rounded-2xl p-6" style="background:var(--admin-card-bg);border:1px solid var(--admin-card-border);box-shadow:0 24px 60px rgba(0,0,0,.6);">
      <div class="flex items-center justify-between mb-6">
        <h2 id="user-modal-title" class="text-on-surface font-semibold" style="font-family:'Space Grotesk',sans-serif;font-size:18px;">
          {modalMode === 'add' ? 'Tambah Pengguna' : 'Edit Pengguna'}
        </h2>
        <button onclick={() => showModal=false} class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface" style="background:var(--admin-close-bg);" aria-label="Tutup">✕</button>
      </div>
      {#if formError}
        <div class="mb-4 px-4 py-2 rounded-xl text-sm" style="background:rgba(255,71,87,.1);border:1px solid rgba(255,71,87,.3);color:#ff4757;" role="alert">{formError}</div>
      {/if}
      <form onsubmit={handleFormSubmit} class="space-y-4">
        <div>
          <label for="form-name" class="block text-label-sm text-on-surface-variant mb-1.5" style="text-transform:uppercase;letter-spacing:.05em;font-size:11px;">Nama Lengkap</label>
          <input id="form-name" bind:value={formName} type="text" required placeholder="Nama pengguna" class="input-field" style="border-radius:12px;" />
        </div>
        <div>
          <label for="form-email" class="block text-label-sm text-on-surface-variant mb-1.5" style="text-transform:uppercase;letter-spacing:.05em;font-size:11px;">Email</label>
          <input id="form-email" bind:value={formEmail} type="email" placeholder="email@contoh.com" class="input-field" style="border-radius:12px;" />
        </div>
        <div>
          <label for="form-phone" class="block text-label-sm text-on-surface-variant mb-1.5" style="text-transform:uppercase;letter-spacing:.05em;font-size:11px;">Nomor HP</label>
          <input id="form-phone" bind:value={formPhone} type="tel" placeholder="08xxxxxxxxxx" class="input-field" style="border-radius:12px;" />
        </div>
        <div>
          <label for="form-password" class="block text-label-sm text-on-surface-variant mb-1.5" style="text-transform:uppercase;letter-spacing:.05em;font-size:11px;">
            Password {modalMode === 'edit' ? '(kosongkan jika tidak diubah)' : ''}
          </label>
          <input id="form-password" bind:value={formPassword} type="password" placeholder="Min. 8 karakter" class="input-field" style="border-radius:12px;" autocomplete="new-password" />
        </div>
        <div>
          <label for="form-role" class="block text-label-sm text-on-surface-variant mb-1.5" style="text-transform:uppercase;letter-spacing:.05em;font-size:11px;">Role</label>
          <Select id="form-role" bind:value={formRole} options={roleOptions} label="Pilih role pengguna" />
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" onclick={() => showModal=false} class="btn-secondary flex-1">Batal</button>
          <button type="submit" disabled={formLoading} class="btn-primary flex-1" style="{formLoading?'opacity:.7;cursor:not-allowed;':''}">
            {formLoading ? 'Menyimpan…' : modalMode === 'add' ? 'Tambah' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal konfirmasi hapus -->
{#if deleteTarget}
  <ConfirmModal
    title="Hapus Pengguna?"
    message="Akun <strong>{deleteTarget.name}</strong> akan dihapus permanen beserta semua datanya."
    confirmLabel="Hapus"
    onConfirm={handleDelete}
    onCancel={() => deleteTarget = null}
  />
{/if}

<section class="min-h-screen relative">
  <div class="relative max-w-container mx-auto px-5 md:px-8 py-10">

    <AdminBreadcrumb current="Pengguna">
      <button onclick={openAdd} class="btn-primary" style="height:44px;padding:0 20px;font-size:14px;">+ Tambah Pengguna</button>
    </AdminBreadcrumb>

    <div class="mb-6 max-w-sm">
      <SearchInput bind:value={search} placeholder="Cari nama, email, atau HP…" id="users-search" />
    </div>

    {#if loading}
      <div class="space-y-3">
        {#each Array(5) as _}
          <div class="animate-pulse rounded-xl" style="height:60px;background:var(--admin-card-bg);border:1px solid var(--admin-card-border);"></div>
        {/each}
      </div>
    {:else if filtered.length > 0}
      <div class="rounded-2xl overflow-hidden" style="border:1px solid var(--admin-card-border);">
        <div class="hidden md:grid px-5 py-3 text-label-sm text-on-surface-variant"
          style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) 80px 48px 72px;gap:12px;background:var(--admin-input-bg);border-bottom:1px solid var(--admin-card-border);align-items:center;">
          <span>Nama</span><span>Kontak</span><span>Role</span><span class="text-center">Sesi</span><span>Aksi</span>
        </div>
        {#each filtered as u, i (u.id)}
          <div class="flex md:grid items-center gap-3 px-4 py-3 md:px-5 md:py-4"
            style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) 80px 48px 72px;gap:12px;align-items:center;background:{i%2===0?'var(--admin-row-even)':'var(--admin-row-odd)'};border-bottom:{i<filtered.length-1?'1px solid var(--admin-card-border)':'none'};">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-semibold text-label-sm"
                style="background:rgba(0,217,217,.12);color:#00d9d9;border:1px solid rgba(0,217,217,.2);"
                aria-label="Inisial {u.name}">
                {u.name[0]?.toUpperCase()}
              </div>
              <div class="min-w-0">
                <p class="text-on-surface text-label-md font-medium truncate">{u.name}</p>
                <p class="text-on-surface-variant truncate md:hidden" style="font-size:11px;">{u.email ?? u.phone ?? '—'}</p>
                <p class="text-on-surface-variant hidden md:block" style="font-size:11px;">Bergabung {formatDate(u.createdAt)}</p>
              </div>
            </div>
            <div class="hidden md:block min-w-0">
              <p class="text-on-surface-variant text-label-sm truncate">{u.email ?? '—'}</p>
              <p class="text-on-surface-variant text-label-sm truncate">{u.phone ?? '—'}</p>
            </div>
            <span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap;background:{u.role==='admin'?'rgba(217,70,239,.15)':'rgba(0,217,217,.1)'};color:{u.role==='admin'?'#d946ef':'#00d9d9'};border:1px solid {u.role==='admin'?'rgba(217,70,239,.3)':'rgba(0,217,217,.25)'};">
              {u.role === 'admin' ? 'Admin' : 'User'}
            </span>
            <span class="hidden md:block text-on-surface-variant text-label-sm text-center">{u.sessionCount}</span>
            <div class="flex items-center gap-2 shrink-0">
              <button onclick={() => openEdit(u)} class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(0,217,217,.08);color:#00d9d9;" title="Edit {u.name}">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
                </svg>
              </button>
              <button onclick={() => deleteTarget = u} class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(255,71,87,.08);color:#ff4757;" title="Hapus {u.name}">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                </svg>
              </button>
            </div>
          </div>
        {/each}
      </div>
      <p class="text-label-sm text-on-surface-variant mt-3">{filtered.length} pengguna</p>
    {:else}
      <EmptyState title="Belum ada pengguna." description="Tambahkan pengguna pertama untuk memulai.">
        <button onclick={openAdd} class="btn-primary">+ Tambah Pengguna</button>
      </EmptyState>
    {/if}

  </div>
</section>


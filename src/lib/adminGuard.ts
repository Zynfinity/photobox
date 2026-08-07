/**
 * Helper: panggil di onMount setiap halaman admin.
 * Redirect ke login jika belum auth, ke /my-gallery jika bukan admin.
 */
import { goto } from '$app/navigation';
import { auth } from '$lib/auth';
import { get } from 'svelte/store';

export function adminGuard(): boolean {
  const token = get(auth.token);
  const user  = get(auth.user);

  if (!token) {
    goto('/login?redirect=/');
    return false;
  }
  if (user?.role !== 'admin') {
    goto('/my-gallery');
    return false;
  }
  return true;
}

export function authHeaders(): Record<string, string> {
  const token = get(auth.token);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

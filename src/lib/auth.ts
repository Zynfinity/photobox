/**
 * Auth store — menyimpan state autentikasi user/admin secara reaktif.
 * Shape token payload dari backend: { sub, email, role }
 * Shape response login: { token, user: { id, name, email, role } }
 */
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
}

function createAuthStore() {
  const initialToken   = browser ? localStorage.getItem('token') : null;
  const initialUserRaw = browser ? localStorage.getItem('user')  : null;
  let initialUser: AuthUser | null = null;
  try { if (initialUserRaw) initialUser = JSON.parse(initialUserRaw); } catch { /* ignore */ }

  const token = writable<string | null>(initialToken);
  const user  = writable<AuthUser | null>(initialUser);

  const isLoggedIn = derived([token, user], ([$t, $u]) => !!$t && !!$u);
  const isAdmin    = derived(user, ($u) => $u?.role === 'admin');
  const isUser     = derived(user, ($u) => $u?.role === 'user');

  function login(newToken: string, newUser: AuthUser) {
    if (browser) {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
    }
    token.set(newToken);
    user.set(newUser);
  }

  function logout() {
    if (browser) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    token.set(null);
    user.set(null);
  }

  return { token, user, isLoggedIn, isAdmin, isUser, login, logout };
}

export const auth = createAuthStore();

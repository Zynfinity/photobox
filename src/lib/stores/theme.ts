import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createThemeStore() {
  const initial: 'dark' | 'light' = browser
    ? ((localStorage.getItem('admin-theme') as 'dark' | 'light') ?? 'dark')
    : 'dark';

  const { subscribe, set, update } = writable<'dark' | 'light'>(initial);

  return {
    subscribe,
    set(val: 'dark' | 'light') {
      if (browser) {
        localStorage.setItem('admin-theme', val);
        if (val === 'light') document.documentElement.classList.add('light');
        else document.documentElement.classList.remove('light');
      }
      set(val);
    },
    toggle() {
      update((v) => {
        const next = v === 'dark' ? 'light' : 'dark';
        if (browser) {
          localStorage.setItem('admin-theme', next);
          if (next === 'light') document.documentElement.classList.add('light');
          else document.documentElement.classList.remove('light');
        }
        return next;
      });
    },
  };
}

export const theme = createThemeStore();

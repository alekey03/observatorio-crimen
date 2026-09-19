/* Appearance preference: loaded in the head to avoid a flash on return visits. */
(() => {
  'use strict';
  const key = 'odc-theme';
  const root = document.documentElement;
  function apply(value) {
    const theme = value === 'light' ? 'light' : 'dark';
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'light' ? '#f3f6f8' : '#101619';
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
    });
  }
  let saved = 'dark';
  try { saved = localStorage.getItem(key) || 'dark'; } catch (_) {}
  apply(saved);
  document.addEventListener('DOMContentLoaded', () => {
    const toolbar = document.createElement('div');
    toolbar.className = 'theme-toolbar';
    toolbar.innerHTML = '<div class="theme-switch" role="group" aria-label="Apariencia de la página"><span class="theme-label">Apariencia</span><button type="button" data-theme-choice="light" aria-pressed="false"><span aria-hidden="true">☀</span> Claro</button><button type="button" data-theme-choice="dark" aria-pressed="true"><span aria-hidden="true">☾</span> Oscuro</button></div>';
    const main = document.querySelector('.main-content');
    if (!main) return;
    const source = main.querySelector('.source-strip');
    main.insertBefore(toolbar, source || main.firstChild);
    toolbar.addEventListener('click', event => {
      const button = event.target.closest('[data-theme-choice]');
      if (!button) return;
      apply(button.dataset.themeChoice);
      try { localStorage.setItem(key, root.dataset.theme); } catch (_) {}
    });
    apply(root.dataset.theme);
  });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) apply(event.newValue);
  });
})();

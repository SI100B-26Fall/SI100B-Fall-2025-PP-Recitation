// Defense against the dark theme leak:
// The reveal.js-menu "Lectures" panel fetches reveal-md's auto-generated
// lectures.html and injects it via innerHTML. That listing page embeds its own
// <link id="theme" href=".../black.css"> (reveal-md's default theme), which the
// browser loads globally and would override the slides' theme (simple) with a
// dark background. Keep only the original theme link and remove any duplicates
// that get injected later.
(function keepLightTheme() {
    const removeInjectedThemeLinks = () => {
        const themes = document.querySelectorAll('link#theme');
        for (let i = 1; i < themes.length; i++) themes[i].remove();
    };
    removeInjectedThemeLinks();
    new MutationObserver(removeInjectedThemeLinks).observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();

document.addEventListener('DOMContentLoaded', function () {
    console.log('Hello from inject.js');
    const images = document.querySelectorAll('img');
    // console.log(images);

    const altTexts = Array.from(images).map(img => img.getAttribute('alt') || '');

    const widths = altTexts.map(text => text.split('|').pop());
    console.log(widths);

    Array.from(images)
        .forEach((img, i) => {
            if(Number(widths[i])) img.setAttribute('width', widths[i]);
        });

    Array.from(document.querySelectorAll('a'))
        .forEach(a => a.setAttribute('target', '_blank'));
});

Reveal.addEventListener("ready", function addFragmentToLists() {
    for (const listItem of document.querySelectorAll(".fragmented-lists li")) {
      listItem.classList.add("fragment");
    }
  });

// ---- Copy button for code blocks ----
(function addCodeCopyButtons() {
  const COPY_ICON =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  const LABEL = '<span class="copy-label">复制</span>';
  const DONE_LABEL = '<span class="copy-label">已复制 ✓</span>';

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function setup() {
    document.querySelectorAll('.reveal pre code:not(.mermaid)').forEach(code => {
      const pre = code.closest('pre');
      if (!pre || pre.querySelector('.copy-btn')) return;

      pre.classList.add('has-copy-btn');
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.type = 'button';
      btn.title = '复制代码';
      btn.setAttribute('aria-label', '复制代码');
      btn.innerHTML = COPY_ICON + LABEL;

      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        // 若 highlight 启用了行号表格，只取代码列
        const table = code.querySelector('table');
        const source = table ? table.querySelector('td:last-child') || code : code;
        const text = (source.textContent || '').trim();
        const flashDone = () => {
          btn.classList.add('copied');
          btn.innerHTML = DONE_LABEL;
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = COPY_ICON + LABEL;
          }, 2000);
        };
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
          } else {
            fallbackCopy(text);
          }
        } catch (err) {
          fallbackCopy(text);
        }
        flashDone();
      });

      pre.appendChild(btn);
    });
  }

  // 初始 + reveal 就绪 + DOM 动态变化时都尝试，覆盖代码块延迟渲染
  setup();
  document.addEventListener('DOMContentLoaded', setup);
  if (window.Reveal) Reveal.addEventListener('ready', setup);
  const root = document.querySelector('.reveal .slides') || document.body;
  new MutationObserver(setup).observe(root, { childList: true, subtree: true });
})();
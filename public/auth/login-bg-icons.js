/**
 * LoginBackgroundIcons - Ambient Animation Controller
 * Handles initial entrance, double requestAnimationFrame paint synchronization,
 * bfcache (pageshow/pagehide) restoration, and replay across browser navigation.
 */
(function initLoginBackgroundIcons() {
  const container = document.getElementById('login-bg-icons');
  if (!container) return;

  function playAnimation() {
    // Double requestAnimationFrame ensures initial paint with opacity: 0 has settled
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        container.classList.add('is-ready');
      });
    });
  }

  function resetAnimation() {
    container.classList.remove('is-ready');
    // Force a DOM reflow so restarting animations triggers reliably
    void container.offsetWidth;
  }

  function replayAnimation() {
    resetAnimation();
    playAnimation();
  }

  // Initial trigger
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', playAnimation, { once: true });
  } else {
    playAnimation();
  }

  // Handle back/forward cache navigation (bfcache)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      replayAnimation();
    }
  });

  // Ensure clean teardown when navigating away so the page never restores mid-animation
  window.addEventListener('pagehide', () => {
    container.classList.remove('is-ready');
  });
})();

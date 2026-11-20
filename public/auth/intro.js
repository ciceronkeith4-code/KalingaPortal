/**
 * Kalinga Portal - Anime.js Intro Choreography
 * Clean, color-connected (Navy & Red) intro that flows smoothly into the login stage.
 */
(function initKalingaIntro() {
  const overlay = document.getElementById('intro-overlay');
  const root = document.documentElement;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const loginTargets = [
    '.hero-headline',
    '.hero-description',
    '.input-field-group',
    '.form-aux-row',
    '.sign-in-btn'
  ];

  let iconsNotified = false;
  function notifyIconsReady() {
    if (iconsNotified) return;
    iconsNotified = true;
    window.__kalingaIntroRevealed = true;
    window.dispatchEvent(new CustomEvent('kalinga:intro-reveal'));
  }

  function clearHeroInlineStyles() {
    const elements = document.querySelectorAll('.top-nav, ' + loginTargets.join(', '));
    elements.forEach((el) => {
      el.style.removeProperty('opacity');
      el.style.removeProperty('transform');
    });
  }

  function markIntroCompleted() {
    root.classList.add('intro-completed');
    root.classList.remove('has-anime-intro');
  }

  function teardownImmediately() {
    markIntroCompleted();
    if (overlay) {
      overlay.hidden = true;
    }
    clearHeroInlineStyles();
    notifyIconsReady();
  }

  // Respect reduced motion or missing anime.js gracefully
  if (
    !overlay ||
    reducedMotionQuery.matches ||
    !root.classList.contains('has-anime-intro') ||
    typeof window.anime === 'undefined'
  ) {
    teardownImmediately();
    return;
  }

  const { createTimeline, animate, stagger, svg } = window.anime;
  const createDrawable = svg && typeof svg.createDrawable === 'function' ? svg.createDrawable : null;

  const skipBtn = document.getElementById('intro-skip-btn');
  const ringDrawable = createDrawable ? createDrawable('.intro-ring-navy') : null;
  const pulseDrawable = createDrawable ? createDrawable('.intro-pulse-red') : null;

  let hasCompleted = false;
  let timeline = null;

  function finishIntro() {
    if (hasCompleted) return;
    hasCompleted = true;
    overlay.hidden = true;
    markIntroCompleted();
    clearHeroInlineStyles();
  }

  function skipIntro() {
    if (hasCompleted) return;
    if (timeline && typeof timeline.pause === 'function') {
      timeline.pause();
    }
    notifyIconsReady();

    animate(overlay, {
      opacity: [1, 0],
      duration: 240,
      ease: 'outQuad',
      onComplete: () => {
        finishIntro();
      }
    });

    animate('.top-nav', {
      opacity: 1,
      translateY: 0,
      duration: 300,
      ease: 'outExpo'
    });

    animate(loginTargets, {
      opacity: 1,
      translateY: 0,
      scale: 1,
      duration: 320,
      delay: stagger(35),
      ease: 'outExpo'
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', skipIntro, { once: true });
  }

  function onEscapeKey(e) {
    if (e.key === 'Escape' && !hasCompleted) {
      skipIntro();
      document.removeEventListener('keydown', onEscapeKey);
    }
  }
  document.addEventListener('keydown', onEscapeKey);

  // Failsafe so the overlay can never stay stuck if browser tabs throttle timers
  const failsafeTimer = window.setTimeout(() => {
    if (!hasCompleted) {
      notifyIconsReady();
      finishIntro();
    }
  }, 3600);

  timeline = createTimeline({
    defaults: {
      ease: 'outExpo'
    },
    onComplete: () => {
      window.clearTimeout(failsafeTimer);
      document.removeEventListener('keydown', onEscapeKey);
      finishIntro();
    }
  });

  // 1. Emblem & Navy Ring + Skip control appear smoothly
  timeline.add('.intro-logo-wrap', {
    opacity: [0, 1],
    scale: [0.82, 1],
    duration: 580,
    ease: 'outExpo'
  }, 0);

  if (ringDrawable) {
    timeline.add(ringDrawable, {
      draw: ['0 0', '0 1'],
      duration: 680,
      ease: 'outCubic'
    }, 40);
  }

  if (skipBtn) {
    timeline.add(skipBtn, {
      opacity: [0, 1],
      duration: 320,
      ease: 'outQuad'
    }, 150);
  }

  // 2. Red pulse badge & heartbeat line draw
  timeline.add('.intro-pulse-badge', {
    opacity: [0, 1],
    scale: [0.55, 1],
    duration: 440,
    ease: 'outBack(1.6)'
  }, 220);

  if (pulseDrawable) {
    timeline.add(pulseDrawable, {
      draw: ['0 0', '0 1'],
      duration: 520,
      ease: 'inOutCubic'
    }, 280);
  }

  // 3. Staggered brand typography & dual-color Navy/Red bar
  timeline.add(['.intro-eyebrow', '.intro-wordmark', '.intro-subtitle'], {
    opacity: [0, 1],
    translateY: [14, 0],
    duration: 520,
    delay: stagger(75),
    ease: 'outExpo'
  }, 260);

  timeline.add('.intro-progress-track', {
    opacity: [0, 1],
    duration: 240,
    ease: 'outQuad'
  }, 380);

  timeline.add('.intro-progress-navy', {
    scaleX: [0, 1],
    duration: 620,
    ease: 'inOutQuart'
  }, 420);

  // 4. Centerpiece lifts gently as the Red -> Navy curtain sweeps smoothly upward
  timeline.add('.intro-stage', {
    opacity: [1, 0],
    translateY: [0, -24],
    scale: [1, 0.96],
    duration: 360,
    ease: 'inCubic'
  }, 1100);

  if (skipBtn) {
    timeline.add(skipBtn, {
      opacity: [1, 0],
      duration: 200,
      ease: 'outQuad'
    }, 1100);
  }

  timeline.add('.intro-sweep-red', {
    translateY: ['108%', '-104%'],
    duration: 700,
    ease: 'inOutExpo'
  }, 1140);

  timeline.add('.intro-sweep-navy', {
    translateY: ['108%', '-104%'],
    duration: 720,
    ease: 'inOutExpo'
  }, 1210);

  timeline.add('.intro-backdrop-base', {
    translateY: ['0%', '-100%'],
    duration: 680,
    ease: 'inOutExpo',
    onBegin: () => {
      overlay.style.pointerEvents = 'none';
      notifyIconsReady();
    }
  }, 1240);

  // 5. Overlapped smooth login stage reveal underneath
  timeline.add('.top-nav', {
    opacity: [0, 1],
    translateY: [-14, 0],
    duration: 520,
    ease: 'outExpo'
  }, 1440);

  timeline.add(loginTargets, {
    opacity: [0, 1],
    translateY: [18, 0],
    scale: [0.97, 1],
    duration: 580,
    delay: stagger(60),
    ease: 'outExpo'
  }, 1480);

  // Ensure bfcache restoration never leaves the overlay blocking the screen
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      window.clearTimeout(failsafeTimer);
      teardownImmediately();
    }
  });
})();

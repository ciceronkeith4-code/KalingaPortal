/**
 * LINKod Portal - Interactive System Walkthrough
 * Spotlight + floating callout tour modeled after keithciceron.vercel.app,
 * covering every feature across Admin, Staff, and Resident/Patient views.
 */
(function () {
  const SPOTLIGHT_PAD = 6;
  const BUBBLE_GAP = 14;
  const VIEWPORT_PAD = 12;
  const BUBBLE_WIDTH = 304;
  const MOBILE_BOTTOM_RESERVE = 86;
  const MOBILE_ARROW_MAX_DIST = 160;
  const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

  const STEPS_BY_ROLE = {
    admin: [
      {
        view: 'dashboard',
        selector: '#sidebar .sidebar-nav',
        title: 'Navigation Menu',
        text: 'Switch between Dashboard, Patients, Events, User Guide, and this Walkthrough anytime.',
        placement: 'right'
      },
      {
        view: 'dashboard',
        selector: '#sidebar-toggle-btn',
        minWidth: 861,
        title: 'Collapse Sidebar',
        text: 'Collapse the sidebar into a compact icon rail to free up more horizontal space for patient tables and the calendar.',
        placement: 'right'
      },
      {
        view: 'dashboard',
        selector: '#notif-btn',
        title: 'Notifications',
        text: 'Check portal alerts and system updates here.',
        placement: 'bottom'
      },
      {
        view: 'dashboard',
        selector: '#view-dashboard .stat-grid',
        title: 'System Overview',
        text: 'Live counts for Total Patients, Archived Patients, and Upcoming Events across Barangay 386.',
        placement: 'bottom'
      },
      {
        view: 'dashboard',
        selector: '#view-dashboard .dashboard-activity-section',
        title: 'Recent Activity',
        text: 'Track recent portal activity and updates from your admin dashboard.',
        placement: 'top'
      },
      {
        view: 'patients',
        selector: '#add-patient-btn',
        title: 'Register a Patient',
        text: 'Click Add Patient to register a resident with their full name, age, address, username, and temporary password.',
        placement: 'bottom'
      },
      {
        view: 'patients',
        selector: '#patients-view-tabs',
        title: 'Active & Archived Tabs',
        text: 'Switch between active and archived resident accounts. Records are never deleted so medical history stays traceable.',
        placement: 'bottom'
      },
      {
        view: 'patients',
        selector: '#view-patients .table-toolbar',
        title: 'Search Patients',
        text: 'Filter residents immediately by name, username, home address, or age.',
        placement: 'bottom'
      },
      {
        view: 'patients',
        selector: '#view-patients .table-container',
        title: 'Patient Records Table',
        text: 'Click any row to open full patient details and credentials, or use the action buttons to edit or archive/restore access.',
        placement: 'top'
      },
      {
        view: 'schedule',
        selector: '#view-schedule #calendar-widget-container',
        title: 'Barangay Health Events',
        text: 'Browse health events on the monthly calendar, move between months, or switch to Table List view.',
        placement: 'bottom'
      },
      {
        view: 'guide',
        selector: '#view-guide .guide-hero-minimal',
        title: 'Administrator User Guide',
        text: 'Open the User Guide anytime for step-by-step documentation and common administrative questions.',
        placement: 'bottom'
      },
      {
        view: 'dashboard',
        selector: '#profile-chip',
        title: 'Profile Menu',
        text: 'Open this menu to jump to Profile Settings or log out of your admin session.',
        placement: 'bottom'
      },
      {
        view: 'profile',
        selector: '#view-profile .section-card',
        title: 'Profile Settings',
        text: 'Review your account display name, username, role, and Barangay 386 Health Center assignment, or log out here.',
        placement: 'bottom',
        nextLabel: 'Done'
      }
    ],

    staff: [
      {
        view: 'dashboard',
        selector: '#sidebar .sidebar-nav',
        title: 'Staff Workspace',
        text: 'Navigate between Dashboard, Patients, Prescriptions, Events, User Guide, and this Walkthrough.',
        placement: 'right'
      },
      {
        view: 'dashboard',
        selector: '#sidebar-toggle-btn',
        minWidth: 861,
        title: 'Collapse Sidebar',
        text: 'Collapse the sidebar into an icon rail when you want wider room for forms, tables, and the calendar.',
        placement: 'right'
      },
      {
        view: 'dashboard',
        selector: '#notif-btn',
        title: 'Notifications',
        text: 'Open the Notifications panel to check clinic alerts and updates.',
        placement: 'bottom'
      },
      {
        view: 'dashboard',
        selector: '#view-dashboard .stat-grid',
        title: 'Daily Clinic Metrics',
        text: 'Monitor Active Patients, Prescriptions Today, Archived Patients, and Upcoming Events at a glance.',
        placement: 'bottom'
      },
      {
        view: 'dashboard',
        selector: '#view-dashboard .dashboard-activity-section',
        title: 'Recent Activity',
        text: 'View recent clinic activity updates directly on the home screen.',
        placement: 'top'
      },
      {
        view: 'patients',
        selector: '#patients-view-tabs',
        title: 'Active & Archived Patients',
        text: 'Switch between active and archived resident accounts.',
        placement: 'bottom'
      },
      {
        view: 'patients',
        selector: '#view-patients .table-toolbar',
        title: 'Search Patient Registry',
        text: 'Search residents by name, username, or Barangay 386 address.',
        placement: 'bottom'
      },
      {
        view: 'patients',
        selector: '#view-patients .table-container',
        title: 'Inspect or Archive Patients',
        text: 'Click any row to view full patient history, or use the row buttons to archive or restore portal access.',
        placement: 'top'
      },
      {
        view: 'prescriptions',
        selector: '#prescription-form',
        title: 'Issue Prescriptions',
        text: 'Search an active patient, set date and doctor, optionally link an event, and add up to 5 medicines with dosage details.',
        placement: 'bottom'
      },
      {
        view: 'prescriptions',
        selector: '#view-prescriptions .table-toolbar',
        title: 'Search Prescription Logs',
        text: 'Filter issued prescriptions by patient name, doctor, medicine, or date.',
        placement: 'bottom'
      },
      {
        view: 'prescriptions',
        selector: '#view-prescriptions .table-container',
        title: 'Prescriptions History Table',
        text: 'Review all prescriptions logged by clinic staff, sorted with the most recent records first.',
        placement: 'top'
      },
      {
        view: 'schedule',
        selector: '#schedule-form',
        title: 'Post Health Events',
        text: 'Create Barangay 386 checkups and health events with date, time, location, target audience, and notes.',
        placement: 'bottom'
      },
      {
        view: 'schedule',
        selector: '#view-schedule #calendar-widget-container',
        title: 'Events Calendar & Table',
        text: 'Click any date square to prefill the event date above, or toggle between Calendar and Table List views.',
        placement: 'bottom'
      },
      {
        view: 'guide',
        selector: '#view-guide .guide-hero-minimal',
        title: 'Healthcare Staff Guide',
        text: 'Check standard operating procedures and staff FAQs here anytime.',
        placement: 'bottom'
      },
      {
        view: 'dashboard',
        selector: '#profile-chip',
        title: 'Profile Menu',
        text: 'Click your profile chip to open Profile Settings or log out.',
        placement: 'bottom'
      },
      {
        view: 'profile',
        selector: '#view-profile .section-card',
        title: 'Profile Settings',
        text: 'View your staff account details and health center assignment, or log out from here.',
        placement: 'bottom',
        nextLabel: 'Done'
      }
    ],

    resident: [
      {
        view: 'dashboard',
        selector: '#sidebar .sidebar-nav',
        title: 'Portal Navigation',
        text: 'Switch between My Dashboard, Prescriptions, Events, My Details, User Guide, and this Walkthrough.',
        placement: 'right'
      },
      {
        view: 'dashboard',
        selector: '#sidebar-toggle-btn',
        minWidth: 861,
        title: 'Collapse Sidebar',
        text: 'Collapse the sidebar into an icon rail for extra reading space, or expand it again anytime.',
        placement: 'right'
      },
      {
        view: 'dashboard',
        selector: '#notif-btn',
        title: 'Notifications',
        text: 'Check announcements and portal notifications here.',
        placement: 'bottom'
      },
      {
        view: 'dashboard',
        selector: '#view-dashboard .stat-grid',
        title: 'Your Health Summary',
        text: 'See your total prescriptions on file and upcoming Barangay 386 health events.',
        placement: 'bottom'
      },
      {
        view: 'dashboard',
        selector: '#view-dashboard .dashboard-activity-section',
        title: 'Recent Activity',
        text: 'Check your latest health record updates right on your dashboard.',
        placement: 'top'
      },
      {
        view: 'prescriptions',
        selector: '#view-prescriptions #prescriptions-list, #view-prescriptions #prescriptions-empty',
        title: 'My Prescriptions',
        text: 'Your newest prescription shows dose, times per day, and duration. Older rows expand on tap, with view/print/download options for attached photos.',
        placement: 'bottom'
      },
      {
        view: 'schedule',
        selector: '#view-schedule #events-list, #view-schedule #events-empty',
        title: 'Upcoming Event Highlights',
        text: 'See the next health events posted by Barangay 386 Health Center, including Today or Tomorrow badges.',
        placement: 'bottom'
      },
      {
        view: 'schedule',
        selector: '#view-schedule #calendar-widget-container',
        title: 'Health Events Calendar',
        text: 'Browse all scheduled clinic events on the monthly calendar or switch to Table List view.',
        placement: 'top'
      },
      {
        view: 'details',
        selector: '#view-details .details-header',
        title: 'My Details',
        text: 'Review your personal information, blood type, allergies, conditions, and emergency contact kept on file by health center staff.',
        placement: 'bottom'
      },
      {
        view: 'guide',
        selector: '#view-guide .guide-hero-minimal',
        title: 'Resident User Guide & FAQs',
        text: 'Read instructions on claiming prescriptions, attending barangay events, and frequently asked questions.',
        placement: 'bottom'
      },
      {
        view: 'dashboard',
        selector: '#profile-chip',
        title: 'Account Menu',
        text: 'Open your profile chip anytime to check Profile Settings or log out.',
        placement: 'bottom'
      },
      {
        view: 'profile',
        selector: '#view-profile .section-card',
        title: 'Profile Settings',
        text: 'View your LINKod Portal account name, username, role, and health center info, or log out safely.',
        placement: 'bottom',
        nextLabel: 'Done'
      }
    ]
  };

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), Math.max(min, max));
  }

  function isMobile() {
    return !window.matchMedia('(min-width: 768px)').matches;
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function getTargetRect(selector) {
    const nodes = document.querySelectorAll(selector);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      const r = node.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      minX = Math.min(minX, r.left);
      minY = Math.min(minY, r.top);
      maxX = Math.max(maxX, r.right);
      maxY = Math.max(maxY, r.bottom);
    });

    if (minX === Infinity) return null;

    // Clamp tall/wide rects to the visible viewport so spotlight borders stay crisp
    const vx1 = Math.max(minX, SPOTLIGHT_PAD);
    const vy1 = Math.max(minY, SPOTLIGHT_PAD);
    const vx2 = Math.min(maxX, window.innerWidth - SPOTLIGHT_PAD);
    const vy2 = Math.min(maxY, window.innerHeight - SPOTLIGHT_PAD);
    if (vx2 <= vx1 || vy2 <= vy1) {
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    return { x: vx1, y: vy1, w: vx2 - vx1, h: vy2 - vy1 };
  }

  function computeLayout(rect, preferredPlacement, bubbleHeight, mobile) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const padded = {
      x: rect.x - SPOTLIGHT_PAD,
      y: rect.y - SPOTLIGHT_PAD,
      w: rect.w + SPOTLIGHT_PAD * 2,
      h: rect.h + SPOTLIGHT_PAD * 2
    };

    if (mobile) {
      const width = vw - VIEWPORT_PAD * 2;
      const topbarBottom = document.querySelector('.topbar')?.getBoundingClientRect().bottom || 64;
      const bottomBox = { x: VIEWPORT_PAD, y: vh - MOBILE_BOTTOM_RESERVE - bubbleHeight, w: width, h: bubbleHeight };
      const topBox = { x: VIEWPORT_PAD, y: topbarBottom + VIEWPORT_PAD, w: width, h: bubbleHeight };
      const chosen = rectsOverlap(bottomBox, padded) && !rectsOverlap(topBox, padded) ? topBox : bottomBox;

      const distBelow = chosen.y - (rect.y + rect.h);
      const distAbove = rect.y - (chosen.y + chosen.h);
      let points = null;
      if (distBelow >= 0 && distBelow < MOBILE_ARROW_MAX_DIST) points = 'top';
      else if (distAbove >= 0 && distAbove < MOBILE_ARROW_MAX_DIST) points = 'bottom';

      return {
        left: VIEWPORT_PAD,
        top: clamp(chosen.y, VIEWPORT_PAD, vh - VIEWPORT_PAD - bubbleHeight),
        width,
        points,
        offset: clamp(cx - VIEWPORT_PAD, 20, width - 20)
      };
    }

    const candidateBox = (side) => {
      const box = { x: 0, y: 0, w: BUBBLE_WIDTH, h: bubbleHeight };
      if (side === 'right') box.x = padded.x + padded.w + BUBBLE_GAP;
      else if (side === 'left') box.x = padded.x - BUBBLE_GAP - BUBBLE_WIDTH;
      else box.x = cx - BUBBLE_WIDTH / 2;

      if (side === 'bottom') box.y = padded.y + padded.h + BUBBLE_GAP;
      else if (side === 'top') box.y = padded.y - BUBBLE_GAP - bubbleHeight;
      else box.y = cy - bubbleHeight / 2;

      box.x = clamp(box.x, VIEWPORT_PAD, vw - VIEWPORT_PAD - BUBBLE_WIDTH);
      box.y = clamp(box.y, VIEWPORT_PAD, vh - VIEWPORT_PAD - bubbleHeight);
      return box;
    };

    const order = [preferredPlacement, OPPOSITE[preferredPlacement], 'right', 'bottom', 'left', 'top'];
    const pickedSide = order.find((side) => side && !rectsOverlap(candidateBox(side), padded));

    if (!pickedSide) {
      return {
        left: clamp((vw - BUBBLE_WIDTH) / 2, VIEWPORT_PAD, vw - VIEWPORT_PAD - BUBBLE_WIDTH),
        top: clamp(vh - VIEWPORT_PAD - bubbleHeight, VIEWPORT_PAD, vh - VIEWPORT_PAD - bubbleHeight),
        width: BUBBLE_WIDTH,
        points: null,
        offset: 0
      };
    }

    const box = candidateBox(pickedSide);
    const points = OPPOSITE[pickedSide];
    const offset = (points === 'left' || points === 'right')
      ? clamp(cy - box.y, 20, bubbleHeight - 20)
      : clamp(cx - box.x, 20, BUBBLE_WIDTH - 20);

    return {
      left: box.x,
      top: box.y,
      width: BUBBLE_WIDTH,
      points,
      offset
    };
  }

  function applyArrowStyle(arrowEl, points, offset) {
    if (!points) {
      arrowEl.hidden = true;
      return;
    }
    arrowEl.hidden = false;
    arrowEl.className = `tour-arrow tour-arrow--${points}`;
    arrowEl.style.left = '';
    arrowEl.style.right = '';
    arrowEl.style.top = '';
    arrowEl.style.bottom = '';
    if (points === 'left' || points === 'right') {
      arrowEl.style.top = `${offset - 6}px`;
    } else {
      arrowEl.style.left = `${offset - 6}px`;
    }
  }

  function getActiveViewName() {
    const active = document.querySelector('.nav-item.active[data-view]');
    if (active) return active.dataset.view;
    const visible = document.querySelector('.view:not([hidden])');
    return visible && visible.id ? visible.id.replace(/^view-/, '') : 'dashboard';
  }

  function startWalkthrough(triggerBtn) {
    if (document.getElementById('tour-overlay-root')) return;
    if (document.documentElement.classList.contains('privacy-gate-pending')) return;

    const role = (typeof session !== 'undefined' && session && session.role) ? session.role : 'resident';
    const rawSteps = STEPS_BY_ROLE[role] || STEPS_BY_ROLE.resident;
    const steps = rawSteps.filter((step) => !step.minWidth || window.innerWidth >= step.minWidth);
    if (!steps.length) return;

    const startingView = getActiveViewName();
    let currentIndex = 0;
    let direction = 1;
    let resizeObserver = null;
    let renderToken = 0;

    // Build overlay DOM
    const root = document.createElement('div');
    root.id = 'tour-overlay-root';
    root.className = 'tour-overlay-root';

    const scrim = document.createElement('div');
    scrim.className = 'tour-scrim';
    scrim.setAttribute('aria-hidden', 'true');

    const hole = document.createElement('div');
    hole.className = 'tour-hole';
    scrim.appendChild(hole);

    const bubble = document.createElement('div');
    bubble.className = 'tour-bubble';
    bubble.setAttribute('role', 'dialog');
    bubble.setAttribute('aria-modal', 'true');
    bubble.setAttribute('aria-labelledby', 'tour-title');
    bubble.setAttribute('aria-describedby', 'tour-text');

    const arrow = document.createElement('span');
    arrow.className = 'tour-arrow';
    arrow.setAttribute('aria-hidden', 'true');

    const titleEl = document.createElement('h2');
    titleEl.id = 'tour-title';
    titleEl.className = 'tour-title';

    const textEl = document.createElement('p');
    textEl.id = 'tour-text';
    textEl.className = 'tour-text';
    textEl.setAttribute('aria-live', 'polite');

    const progressRow = document.createElement('div');
    progressRow.className = 'tour-progress-row';

    const track = document.createElement('div');
    track.className = 'tour-progress-track';
    track.setAttribute('aria-hidden', 'true');

    const fill = document.createElement('div');
    fill.className = 'tour-progress-fill';
    track.appendChild(fill);

    const counterEl = document.createElement('span');
    counterEl.className = 'tour-counter';
    progressRow.append(track, counterEl);

    const actions = document.createElement('div');
    actions.className = 'tour-actions';

    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'tour-btn-skip';
    skipBtn.textContent = 'Skip tour';

    const spacer = document.createElement('span');
    spacer.className = 'tour-actions-spacer';

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'tour-btn-back';
    backBtn.textContent = 'Back';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'tour-btn-next';
    nextBtn.textContent = 'Next';

    actions.append(skipBtn, spacer, backBtn, nextBtn);
    bubble.append(arrow, titleEl, textEl, progressRow, actions);
    root.append(scrim, bubble);
    document.body.appendChild(root);

    function positionStep() {
      const step = steps[currentIndex];
      if (!step) return;
      const rect = getTargetRect(step.selector);
      if (!rect) {
        hole.className = 'tour-dim';
        hole.style.width = '';
        hole.style.height = '';
        hole.style.transform = '';
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const w = Math.min(BUBBLE_WIDTH, vw - VIEWPORT_PAD * 2);
        bubble.style.width = `${w}px`;
        bubble.style.left = `${(vw - w) / 2}px`;
        bubble.style.top = `${Math.max(VIEWPORT_PAD, (vh - bubble.offsetHeight) / 2)}px`;
        arrow.hidden = true;
        bubble.style.visibility = 'visible';
        return;
      }

      hole.className = 'tour-hole';
      hole.style.width = `${rect.w + SPOTLIGHT_PAD * 2}px`;
      hole.style.height = `${rect.h + SPOTLIGHT_PAD * 2}px`;
      hole.style.transform = `translate(${rect.x - SPOTLIGHT_PAD}px, ${rect.y - SPOTLIGHT_PAD}px)`;

      // Measure height at target width first so placement accounts for wrapped lines
      const targetWidth = isMobile() ? window.innerWidth - VIEWPORT_PAD * 2 : BUBBLE_WIDTH;
      bubble.style.width = `${targetWidth}px`;
      const layout = computeLayout(rect, step.placement, bubble.offsetHeight, isMobile());
      bubble.style.left = `${layout.left}px`;
      bubble.style.top = `${layout.top}px`;
      bubble.style.width = `${layout.width}px`;
      applyArrowStyle(arrow, layout.points, layout.offset);
      bubble.style.visibility = 'visible';
    }

    function observeTarget(selector) {
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (typeof ResizeObserver === 'undefined') return;
      resizeObserver = new ResizeObserver(() => positionStep());
      document.querySelectorAll(selector).forEach((el) => resizeObserver.observe(el));
    }

    function showStep(idx) {
      renderToken += 1;
      const myToken = renderToken;
      currentIndex = idx;
      const step = steps[currentIndex];
      const isLast = currentIndex >= steps.length - 1;

      bubble.style.visibility = 'hidden';
      titleEl.textContent = step.title;
      textEl.textContent = step.text;
      counterEl.textContent = `${currentIndex + 1} / ${steps.length}`;
      fill.style.transform = `scaleX(${(currentIndex + 1) / steps.length})`;

      skipBtn.hidden = isLast;
      backBtn.hidden = currentIndex === 0;
      nextBtn.textContent = isLast ? (step.nextLabel || 'Done') : 'Next';

      if (step.view && typeof switchView === 'function' && getActiveViewName() !== step.view) {
        switchView(step.view);
      }

      // Wait a frame for view switch layout, scroll target into view, then place bubble
      requestAnimationFrame(() => {
        if (myToken !== renderToken) return;
        const firstMatch = document.querySelector(step.selector);
        if (firstMatch && typeof firstMatch.scrollIntoView === 'function') {
          firstMatch.scrollIntoView({ block: 'center', inline: 'nearest' });
        }
        requestAnimationFrame(() => {
          if (myToken !== renderToken) return;
          if (!getTargetRect(step.selector)) {
            if (direction > 0 && currentIndex < steps.length - 1) {
              showStep(currentIndex + 1);
              return;
            }
            if (direction < 0 && currentIndex > 0) {
              showStep(currentIndex - 1);
              return;
            }
          }
          observeTarget(step.selector);
          positionStep();
          if (!bubble.contains(document.activeElement)) {
            nextBtn.focus({ preventScroll: true });
          }
        });
      });
    }

    function closeTour(completed) {
      window.removeEventListener('resize', positionStep);
      document.removeEventListener('scroll', positionStep, true);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
      if (resizeObserver) resizeObserver.disconnect();
      root.remove();

      if (typeof switchView === 'function' && getActiveViewName() !== startingView) {
        switchView(startingView);
      }
      if (triggerBtn && typeof triggerBtn.focus === 'function') {
        requestAnimationFrame(() => triggerBtn.focus({ preventScroll: true }));
      }
      if (completed && typeof showToast === 'function') {
        showToast('Walkthrough completed.');
      }
    }

    function goNext() {
      direction = 1;
      if (currentIndex >= steps.length - 1) {
        closeTour(true);
      } else {
        showStep(currentIndex + 1);
      }
    }

    function goBack() {
      direction = -1;
      if (currentIndex > 0) {
        showStep(currentIndex - 1);
      }
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeTour(false);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      } else if (e.key === 'Tab') {
        const focusable = Array.from(bubble.querySelectorAll('button')).filter((b) => !b.hidden);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    function onFocusIn(e) {
      if (!bubble.contains(e.target)) {
        nextBtn.focus({ preventScroll: true });
      }
    }

    skipBtn.addEventListener('click', () => closeTour(false));
    backBtn.addEventListener('click', goBack);
    nextBtn.addEventListener('click', goNext);

    window.addEventListener('resize', positionStep);
    document.addEventListener('scroll', positionStep, true);
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);

    showStep(0);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('start-walkthrough-btn');
    if (!btn) return;
    btn.addEventListener('click', () => startWalkthrough(btn));
  });

  window.LinkodWalkthrough = { start: startWalkthrough };
})();

/**
 * Kalinga Portal - Google Calendar-Style Schedule Component
 * Bespoke, zero-dependency interactive calendar with month grid, date navigation,
 * appointment chips, and click-to-view appointment details.
 */

const KalingaCalendar = {
  viewDate: new Date(),
  viewMode: 'calendar', // 'calendar' | 'table'
  container: null,
  role: 'admin',
  onUpdate: null,

  init(options = {}) {
    this.container = typeof options.container === 'string'
      ? document.getElementById(options.container)
      : options.container;
    this.role = options.role || (typeof session !== 'undefined' && session ? session.role : 'admin');
    this.onUpdate = options.onUpdate || null;

    if (!this.container) return;
    this.render();
  },

  setRole(newRole) {
    this.role = newRole;
  },

  nextMonth() {
    this.viewDate.setMonth(this.viewDate.getMonth() + 1);
    this.render();
  },

  prevMonth() {
    this.viewDate.setMonth(this.viewDate.getMonth() - 1);
    this.render();
  },

  goToToday() {
    this.viewDate = new Date();
    this.render();
  },

  toggleView(mode) {
    this.viewMode = mode;
    const widget = document.getElementById('cal-month-view');
    const tableContainer = document.querySelector('.table-container--schedule') ||
                           document.querySelector('.data-table--staff-schedule')?.closest('.table-container') ||
                           document.querySelector('.data-table--admin-schedule')?.closest('.table-container') ||
                           document.querySelector('.data-table--resident-schedule')?.closest('.table-container');

    const calBtn = document.getElementById('cal-btn-view-cal');
    const tableBtn = document.getElementById('cal-btn-view-table');

    if (mode === 'calendar') {
      if (widget) widget.hidden = false;
      if (tableContainer) tableContainer.hidden = true;
      if (calBtn && calBtn.classList) calBtn.classList.add('active');
      if (tableBtn && tableBtn.classList) tableBtn.classList.remove('active');
    } else {
      if (widget) widget.hidden = true;
      if (tableContainer) tableContainer.hidden = false;
      if (calBtn && calBtn.classList) calBtn.classList.remove('active');
      if (tableBtn && tableBtn.classList) tableBtn.classList.add('active');
    }
  },

  render() {
    if (!this.container) return;
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const today = new Date();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Load appointments from PatientStore
    let allAppointments = [];
    if (typeof PatientStore !== 'undefined' && PatientStore.getAllSchedule) {
      allAppointments = PatientStore.getAllSchedule();
    }
    if (this.role === 'resident' && typeof session !== 'undefined' && session) {
      allAppointments = allAppointments.filter((a) => a.patientUsername === session.username);
    }

    // Clear container
    this.container.innerHTML = '';

    const widget = document.createElement('div');
    widget.className = 'calendar-widget';

    // 1. Calendar Header
    const header = document.createElement('div');
    header.className = 'calendar-header';

    const navGroup = document.createElement('div');
    navGroup.className = 'cal-nav-group';

    const title = document.createElement('h3');
    title.className = 'cal-month-title';
    title.textContent = `${monthNames[month]} ${year}`;

    const navBtns = document.createElement('div');
    navBtns.className = 'cal-nav-btns';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'cal-btn';
    prevBtn.setAttribute('aria-label', 'Previous month');
    prevBtn.title = 'Previous month';
    prevBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
    prevBtn.addEventListener('click', () => this.prevMonth());

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'cal-btn';
    nextBtn.setAttribute('aria-label', 'Next month');
    nextBtn.title = 'Next month';
    nextBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
    nextBtn.addEventListener('click', () => this.nextMonth());

    const todayBtn = document.createElement('button');
    todayBtn.type = 'button';
    todayBtn.className = 'cal-today-btn';
    todayBtn.textContent = 'Today';
    todayBtn.addEventListener('click', () => this.goToToday());

    navBtns.appendChild(prevBtn);
    navBtns.appendChild(nextBtn);
    navBtns.appendChild(todayBtn);

    navGroup.appendChild(title);
    navGroup.appendChild(navBtns);

    // Month appointment count badge
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const apptsThisMonth = allAppointments.filter((a) => a.date && a.date.startsWith(monthPrefix) && a.status !== 'cancelled');
    const countBadge = document.createElement('span');
    countBadge.className = 'cal-month-count-badge';
    countBadge.textContent = `${apptsThisMonth.length} appointment${apptsThisMonth.length === 1 ? '' : 's'} this month`;

    // View Switcher (Calendar vs Table)
    const viewToggle = document.createElement('div');
    viewToggle.className = 'cal-view-toggle';

    const calToggle = document.createElement('button');
    calToggle.type = 'button';
    calToggle.id = 'cal-btn-view-cal';
    calToggle.className = 'cal-toggle-btn' + (this.viewMode === 'calendar' ? ' active' : '');
    calToggle.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg><span>Calendar</span>';
    calToggle.addEventListener('click', () => this.toggleView('calendar'));

    const tableToggle = document.createElement('button');
    tableToggle.type = 'button';
    tableToggle.id = 'cal-btn-view-table';
    tableToggle.className = 'cal-toggle-btn' + (this.viewMode === 'table' ? ' active' : '');
    tableToggle.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg><span>Table List</span>';
    tableToggle.addEventListener('click', () => this.toggleView('table'));

    viewToggle.appendChild(calToggle);
    viewToggle.appendChild(tableToggle);

    // Grouped so the count badge always wraps together with the view
    // toggle as a single unit, instead of the two drifting apart onto
    // separate lines at narrower widths.
    const viewGroup = document.createElement('div');
    viewGroup.className = 'cal-view-group';
    viewGroup.appendChild(countBadge);
    viewGroup.appendChild(viewToggle);

    header.appendChild(navGroup);
    header.appendChild(viewGroup);
    widget.appendChild(header);

    // 2. Month Calendar Wrapper
    const monthView = document.createElement('div');
    monthView.id = 'cal-month-view';
    if (this.viewMode === 'table') monthView.hidden = true;

    // Weekdays bar
    const weekdaysBar = document.createElement('div');
    weekdaysBar.className = 'cal-weekdays';
    weekdays.forEach((dayName) => {
      const col = document.createElement('div');
      col.className = 'cal-weekday';
      col.textContent = dayName;
      weekdaysBar.appendChild(col);
    });
    monthView.appendChild(weekdaysBar);

    // Days Grid
    const grid = document.createElement('div');
    grid.className = 'cal-grid';

    // Calendar math
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const totalCells = 42; // 6 rows * 7 columns

    for (let i = 0; i < totalCells; i++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'cal-day';

      let cellDate = null;
      let cellDayNumber = 0;
      let isCurrentMonth = false;

      if (i < firstDayIndex) {
        // Leading days from previous month
        cellDayNumber = prevMonthTotalDays - firstDayIndex + i + 1;
        dayCell.classList.add('cal-day--other-month');
        const prevM = month === 0 ? 11 : month - 1;
        const prevY = month === 0 ? year - 1 : year;
        cellDate = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(cellDayNumber).padStart(2, '0')}`;
      } else if (i < firstDayIndex + totalDaysInMonth) {
        // Current month days
        cellDayNumber = i - firstDayIndex + 1;
        isCurrentMonth = true;
        cellDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(cellDayNumber).padStart(2, '0')}`;

        // Check if Today
        if (
          year === today.getFullYear() &&
          month === today.getMonth() &&
          cellDayNumber === today.getDate()
        ) {
          dayCell.classList.add('cal-day--today');
        }
      } else {
        // Trailing days from next month
        cellDayNumber = i - (firstDayIndex + totalDaysInMonth) + 1;
        dayCell.classList.add('cal-day--other-month');
        const nextM = month === 11 ? 0 : month + 1;
        const nextY = month === 11 ? year + 1 : year;
        cellDate = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(cellDayNumber).padStart(2, '0')}`;
      }

      // Day Header (number)
      const dayHeader = document.createElement('div');
      dayHeader.className = 'cal-day-header';
      const numSpan = document.createElement('span');
      numSpan.className = 'cal-day-num';
      numSpan.textContent = cellDayNumber;
      dayHeader.appendChild(numSpan);
      dayCell.appendChild(dayHeader);

      // Filter appointments on this specific date
      const apptsOnDate = allAppointments.filter((a) => a.date === cellDate);

      const apptsList = document.createElement('div');
      apptsList.className = 'cal-day-appts';

      apptsOnDate.forEach((appt) => {
        const chip = document.createElement('div');
        const statusClass = appt.status === 'confirmed'
          ? 'cal-appt-chip--confirmed'
          : (appt.status === 'cancelled' ? 'cal-appt-chip--cancelled' : 'cal-appt-chip--requested');
        chip.className = `cal-appt-chip ${statusClass}`;
        chip.title = `${appt.time || 'All Day'} · ${appt.patientName || appt.patientUsername}: ${appt.reason || 'Consultation'} (${appt.status})`;

        const timeSpan = document.createElement('span');
        timeSpan.className = 'cal-chip-time';
        timeSpan.textContent = appt.time || '';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'cal-chip-title';
        titleSpan.textContent = appt.patientName ? `${appt.patientName} (${appt.reason || 'Visit'})` : (appt.reason || 'Appointment');

        chip.appendChild(timeSpan);
        chip.appendChild(titleSpan);

        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          showAppointmentDetailsModal(appt, this.role, () => {
            this.render();
            if (typeof this.onUpdate === 'function') this.onUpdate();
          });
        });

        apptsList.appendChild(chip);
      });

      dayCell.appendChild(apptsList);

      // Clicking a day cell pre-fills date input in appointment form
      dayCell.addEventListener('click', () => {
        if (!cellDate) return;
        const targetInput = document.getElementById('sch-date') ||
                            document.getElementById('sch-request-date') ||
                            document.getElementById('res-date');
        if (targetInput) {
          targetInput.value = cellDate;
          targetInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetInput.focus();
          if (typeof showToast === 'function') {
            showToast(`Selected date: ${cellDate}`);
          }
        }
      });

      grid.appendChild(dayCell);
    }

    monthView.appendChild(grid);
    widget.appendChild(monthView);
    this.container.appendChild(widget);

    // Apply initial view mode to table container
    const tableContainer = document.querySelector('.table-container--schedule') ||
                           document.querySelector('.data-table--staff-schedule')?.closest('.table-container') ||
                           document.querySelector('.data-table--admin-schedule')?.closest('.table-container') ||
                           document.querySelector('.data-table--resident-schedule')?.closest('.table-container');
    if (tableContainer) {
      tableContainer.hidden = (this.viewMode === 'calendar');
    }
  }
};

window.KalingaCalendar = KalingaCalendar;

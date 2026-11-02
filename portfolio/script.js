(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal content as it enters the viewport.
  const revealItems = document.querySelectorAll('.section-heading, .about-copy, .project-card, .research-list article, .design-card, .recognition-card, .career-entry, .profile-panel, .life-card, .ride-gallery figure, .principles-layout, .footer-main');
  revealItems.forEach((item, index) => {
    item.classList.add('reveal-on-scroll');
    item.style.setProperty('--reveal-delay', `${(index % 3) * 70}ms`);
  });
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-revealed'));
  }

  // Filter the six real project entries by their verified subject areas.
  const filters = document.querySelectorAll('.work-filter');
  const projects = document.querySelectorAll('.project-card[data-category]');
  filters.forEach((button) => button.addEventListener('click', () => {
    filters.forEach((filter) => {
      const active = filter === button;
      filter.classList.toggle('is-active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    const category = button.dataset.filter;
    projects.forEach((project) => {
      const categories = (project.dataset.category || '').split(/\s+/);
      project.classList.toggle('is-filtered', category !== 'all' && !categories.includes(category));
    });
  }));

  // Draggable, touch-friendly and keyboard-operable design comparison.
  const comparison = document.querySelector('.design-compare');
  const range = comparison?.querySelector('input[type="range"]');
  if (comparison && range) {
    const setSplit = (value) => {
      const split = Math.max(0, Math.min(100, Number(value)));
      comparison.style.setProperty('--design-split', `${split}%`);
      comparison.setAttribute('aria-valuenow', String(Math.round(split)));
      range.value = String(split);
    };
    const fromPointer = (event) => {
      const bounds = comparison.getBoundingClientRect();
      setSplit((event.clientX - bounds.left) / bounds.width * 100);
    };
    let dragging = false;
    comparison.addEventListener('pointerdown', (event) => {
      if (event.target === range) return;
      dragging = true;
      comparison.setPointerCapture(event.pointerId);
      fromPointer(event);
    });
    comparison.addEventListener('pointermove', (event) => { if (dragging) fromPointer(event); });
    comparison.addEventListener('pointerup', () => { dragging = false; });
    comparison.addEventListener('pointercancel', () => { dragging = false; });
    range.addEventListener('input', () => setSplit(range.value));
    comparison.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        setSplit(Number(range.value) + (event.key === 'ArrowRight' ? 3 : -3));
      }
      if (event.key === 'Home') setSplit(0);
      if (event.key === 'End') setSplit(100);
    });
  }

  // Timeline cards follow hover, keyboard focus, and touch/click selection.
  const timeline = document.querySelector('.edit-timeline');
  const timelineEvents = timeline?.querySelectorAll('.timeline-event');
  const popover = timeline?.querySelector('.timeline-popover');
  if (timeline && timelineEvents && popover) {
    const yearLabel = popover.querySelector('.timeline-popover-year');
    const titleLabel = popover.querySelector('.timeline-popover-title');
    const detailLabel = popover.querySelector('.timeline-popover-detail');
    let pinned = false;
    const showEvent = (button) => {
      yearLabel.textContent = button.dataset.year || '';
      titleLabel.textContent = button.dataset.title || '';
      detailLabel.textContent = button.dataset.detail || '';
      const parentBounds = timeline.getBoundingClientRect();
      const eventBounds = button.getBoundingClientRect();
      const boxWidth = Math.min(370, window.innerWidth - 44);
      const left = Math.max(0, Math.min(timeline.clientWidth - boxWidth, eventBounds.left - parentBounds.left + eventBounds.width / 2 - boxWidth / 2));
      timeline.style.setProperty('--popover-left', `${left}px`);
      popover.hidden = false;
    };
    const hideEvent = () => { popover.hidden = true; };
    timelineEvents.forEach((button) => {
      button.addEventListener('pointerenter', () => showEvent(button));
      button.addEventListener('focus', () => showEvent(button));
      button.addEventListener('click', () => { pinned = true; showEvent(button); });
    });
    timeline.addEventListener('pointerleave', () => {
      if (!pinned && !timeline.contains(document.activeElement)) hideEvent();
    });
    timeline.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        if (!pinned && !timeline.contains(document.activeElement)) hideEvent();
      });
    });
    document.addEventListener('pointerdown', (event) => {
      if (!timeline.contains(event.target)) {
        pinned = false;
        hideEvent();
      }
    });
  }

  // Interactive particle mesh around Omkar's actual portrait.
  const particleCanvases = document.querySelectorAll('.particle-canvas, .footer-particles');
  particleCanvases.forEach((canvas) => {
    const context = canvas.getContext('2d');
    if (context) {
      let width = 0;
      let height = 0;
      let particles = [];
      const pointer = { x: -1000, y: -1000 };
      const resize = () => {
        const bounds = canvas.getBoundingClientRect();
        const ratio = Math.min(devicePixelRatio || 1, 2);
        width = bounds.width;
        height = bounds.height;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        const count = Math.min(220, Math.max(45, Math.round(width * height / 6200)));
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * width, y: Math.random() * height,
          homeX: Math.random() * width, homeY: Math.random() * height,
          vx: 0, vy: 0, size: Math.random() * 1.4 + .4,
        }));
      };
      const updatePointer = (event) => {
        const bounds = canvas.getBoundingClientRect();
        pointer.x = event.clientX - bounds.left;
        pointer.y = event.clientY - bounds.top;
      };
      addEventListener('resize', resize, { passive: true });
      addEventListener('pointermove', updatePointer, { passive: true });
      resize();
      const draw = () => {
        context.clearRect(0, 0, width, height);
        particles.forEach((particle, index) => {
          let targetX = particle.homeX;
          let targetY = particle.homeY;
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 125 && distance > 0) {
            const force = (125 - distance) / 125;
            targetX += dx / distance * force * 48;
            targetY += dy / distance * force * 48;
          }
          particle.vx = (particle.vx + (targetX - particle.x) * .012) * .9;
          particle.vy = (particle.vy + (targetY - particle.y) * .012) * .9;
          particle.x += particle.vx;
          particle.y += particle.vy;
          context.beginPath();
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          context.fillStyle = 'rgba(255, 92, 101, .68)';
          context.fill();
          if (index % 2 === 0) {
            const next = particles[(index + 1) % particles.length];
            const linkDistance = Math.hypot(next.x - particle.x, next.y - particle.y);
            if (linkDistance < 68) {
              context.beginPath();
              context.moveTo(particle.x, particle.y);
              context.lineTo(next.x, next.y);
              context.strokeStyle = `rgba(237, 25, 41, ${.17 * (1 - linkDistance / 68)})`;
              context.stroke();
            }
          }
        });
        if (!reduceMotion) requestAnimationFrame(draw);
      };
      if (reduceMotion) draw();
      else requestAnimationFrame(draw);
    }
  });

  // Small trailing cursor on mouse/trackpad devices.
  const cursor = document.querySelector('.cursor-dot');
  if (cursor && matchMedia('(hover:hover) and (pointer:fine)').matches && !reduceMotion) {
    let x = -20;
    let y = -20;
    let tx = -20;
    let ty = -20;
    document.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      tx = event.clientX;
      ty = event.clientY;
      cursor.classList.add('is-visible');
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
    const follow = () => {
      x += (tx - x) * .22;
      y += (ty - y) * .22;
      cursor.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);
  }
})();

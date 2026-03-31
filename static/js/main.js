// Cloud Notes Pro — Main JS v2

document.addEventListener('DOMContentLoaded', () => {

  /* ── CURSOR GLOW TRACKING ── */
  document.addEventListener('mousemove', e => {
    document.body.style.setProperty('--mx', e.clientX + 'px');
    document.body.style.setProperty('--my', e.clientY + 'px');
  });

  /* ── SIDEBAR TOGGLE ── */
  const sidebar  = document.getElementById('sidebar');
  const menuBtn  = document.getElementById('menuBtn');
  const closeBtn = document.getElementById('sidebarClose');
  const overlay  = document.getElementById('sidebarOverlay');

  const openSidebar  = () => { sidebar?.classList.add('open'); overlay?.classList.add('show'); document.body.style.overflow='hidden'; };
  const closeSidebar = () => { sidebar?.classList.remove('open'); overlay?.classList.remove('show'); document.body.style.overflow=''; };

  menuBtn?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  /* ── TOASTS ── */
  document.querySelectorAll('.toast').forEach(toast => {
    toast.querySelector('.toast-close')?.addEventListener('click', () => dismiss(toast));
    setTimeout(() => dismiss(toast), 5000);
  });
  function dismiss(el) {
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px) scale(.97)';
    setTimeout(() => el.remove(), 300);
  }

  /* ── NOTE CARD STAGGER + 3D TILT ── */
  document.querySelectorAll('.note-card').forEach((card, i) => {
    card.style.animationDelay = `${i * 55}ms`;

    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  - .5) * 14;
      const y = ((e.clientY - r.top)  / r.height - .5) * -10;
      card.style.transform = `translateY(-6px) scale(1.01) perspective(800px) rotateY(${x}deg) rotateX(${y}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ── MAGNETIC BUTTONS ── */
  document.querySelectorAll('.btn-primary, .hbtn-primary').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width/2)  * .25;
      const y = (e.clientY - r.top  - r.height/2) * .25;
      btn.style.transform = `translate(${x}px, ${y}px) translateY(-2px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  /* ── ACTIVE NAV ── */
  const path = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('href') === path) item.classList.add('active');
  });

  /* ── TEXTAREA AUTO-GROW ── */
  const ta = document.querySelector('.form-textarea');
  if (ta) {
    ta.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.max(200, this.scrollHeight) + 'px';
    });
  }

  /* ── Ctrl+Enter submit ── */
  const noteForm = document.getElementById('noteForm');
  if (noteForm) {
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') noteForm.submit();
    });
  }

  /* ── SCROLL REVEAL (fade-up) ── */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up').forEach(el => revealObs.observe(el));

  /* ── LANDING: blob parallax on mouse ── */
  const blobs = document.querySelectorAll('.blob');
  if (blobs.length) {
    document.addEventListener('mousemove', e => {
      const x = (e.clientX / window.innerWidth  - .5) * 24;
      const y = (e.clientY / window.innerHeight - .5) * 24;
      blobs.forEach((b, i) => {
        const f = (i + 1) * .45;
        b.style.transform = `translate(${x*f}px,${y*f}px)`;
      });
    });
  }

  /* ── SMOOTH PAGE TRANSITIONS ── */
  document.querySelectorAll('a[href]:not([target])').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
    link.addEventListener('click', e => {
      e.preventDefault();
      document.body.style.transition = 'opacity .25s';
      document.body.style.opacity = '0';
      setTimeout(() => window.location = href, 220);
    });
  });

  /* ── PAGE LOAD FADE-IN ── */
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity .4s';
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  });

  /* ── TYPING CURSOR (landing) ── */
  const tw = document.getElementById('tw');
  if (tw) {
    const words = ['beautifully stored.','always with you.','lightning fast.','always secure.','your second brain.'];
    let wi=0, ci=0, del=false;
    function type() {
      const w = words[wi];
      if (!del) {
        tw.textContent = w.slice(0, ci+1); ci++;
        if (ci === w.length) { del=true; setTimeout(type, 1800); return; }
      } else {
        tw.textContent = w.slice(0, ci-1); ci--;
        if (ci === 0) { del=false; wi=(wi+1)%words.length; setTimeout(type,300); return; }
      }
      setTimeout(type, del ? 38 : 75);
    }
    type();
  }

  /* ── NOTEBOOK SCROLL (landing) ── */
  const nbSection = document.getElementById('notebook-section');
  if (nbSection) {
    const cover       = document.getElementById('book-cover');
    const pageInside  = document.getElementById('page-inside');
    const capText     = document.getElementById('nb-caption-text');
    const capSub      = document.getElementById('nb-caption-sub');
    const stage       = document.getElementById('notebook-stage');

    const CAPS = [
      ['Open. Write. Remember.','Scroll to open your notebook'],
      ['Your ideas, beautifully kept.','Everything in one place'],
      ['Pinned. Organised. Yours.','Capture the moment it strikes'],
      ['Always with you.','Cloud-synced across all devices'],
    ];
    let lastCap = -1;

    function eio(t){ return t<.5?2*t*t:-1+(4-2*t)*t; }
    function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

    function onScroll() {
      const rect = nbSection.getBoundingClientRect();
      const total = nbSection.offsetHeight - window.innerHeight;
      const prog  = clamp(-rect.top / total, 0, 1);
      const p1    = clamp(prog / .5, 0, 1);
      const e1    = eio(p1);
      const p2    = clamp((prog-.5)/.5, 0, 1);
      const e2    = eio(p2);

      if (cover) {
        cover.style.transform = `rotateX(${e1*-12}deg) rotateY(${e1*-168}deg) translateY(${e1*-28}px)`;
      }
      if (pageInside) {
        pageInside.style.opacity = e1 > .45 ? clamp((e1-.45)/.55,0,1) : 0;
      }
      if (stage) {
        stage.style.transform = `scale(${1+e2*.2}) translateY(${-e2*36}px)`;
      }

      const ci = Math.min(Math.floor(prog * CAPS.length), CAPS.length-1);
      if (ci !== lastCap && capText && capSub) {
        lastCap = ci;
        capText.style.opacity=0; capSub.style.opacity=0;
        setTimeout(()=>{
          capText.textContent=CAPS[ci][0]; capSub.textContent=CAPS[ci][1];
          capText.style.opacity=1; capSub.style.opacity=1;
        },110);
      }
    }

    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

});

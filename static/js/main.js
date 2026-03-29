// Cloud Notes Pro — Main JS

document.addEventListener('DOMContentLoaded', () => {

  // ── Sidebar toggle (mobile) ──
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('menuBtn');
  const sidebarClose = document.getElementById('sidebarClose');
  const overlay = document.getElementById('sidebarOverlay');

  function openSidebar() {
    sidebar?.classList.add('open');
    overlay?.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('show');
    document.body.style.overflow = '';
  }

  menuBtn?.addEventListener('click', openSidebar);
  sidebarClose?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  // ── Auto-dismiss toasts ──
  document.querySelectorAll('.toast').forEach(toast => {
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn?.addEventListener('click', () => dismissToast(toast));
    setTimeout(() => dismissToast(toast), 5000);
  });

  function dismissToast(toast) {
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    setTimeout(() => toast.remove(), 300);
  }

  // ── Note cards stagger animation ──
  document.querySelectorAll('.note-card').forEach((card, i) => {
    card.style.animationDelay = `${i * 60}ms`;
  });

  // ── Search form: submit on category chip click ──
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', e => {
      if (chip.tagName === 'A') return; // let anchor navigate naturally
    });
  });

  // ── Active nav highlight by URL ──
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('href') === currentPath) {
      item.classList.add('active');
    }
  });

  // ── Textarea auto-grow ──
  const textarea = document.querySelector('.form-textarea');
  if (textarea) {
    textarea.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.max(200, this.scrollHeight) + 'px';
    });
  }

  // ── Keyboard shortcut: Ctrl+Enter to submit note form ──
  const noteForm = document.getElementById('noteForm');
  if (noteForm) {
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        noteForm.submit();
      }
    });
  }

  // ── Subtle parallax on landing blobs ──
  const blobs = document.querySelectorAll('.blob');
  if (blobs.length > 0) {
    document.addEventListener('mousemove', e => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      blobs.forEach((blob, i) => {
        const factor = (i + 1) * 0.4;
        blob.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });
    });
  }

  // ── Preview note cards hover tilt (landing) ──
  document.querySelectorAll('.preview-note').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
      card.style.transform = `perspective(600px) rotateY(${x}deg) rotateX(${y}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

});

// SchemeSathi Dashboard – script.js

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Active nav highlight ---- */
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });

  /* ---- Bookmark toggle ---- */
  const bookmarkBtns = document.querySelectorAll('.bookmark-btn');
  bookmarkBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('bookmarked');
      const icon = btn.querySelector('i');
      if (btn.classList.contains('bookmarked')) {
        icon.style.color = '#2e7d32';
        btn.style.background = '#e8f5e9';
        btn.style.borderColor = '#2e7d32';
      } else {
        icon.style.color = '';
        btn.style.background = '';
        btn.style.borderColor = '';
      }
    });
  });

  /* ---- Search button animation ---- */
  const searchBtn = document.querySelector('.search-schemes-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      searchBtn.textContent = '';
      searchBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Searching...';
      setTimeout(() => {
        searchBtn.innerHTML = '<i class="fa fa-search"></i> Search Schemes';
      }, 1200);
    });
  }

  /* ---- View Details button hover ripple ---- */
  const viewBtns = document.querySelectorAll('.view-details-btn');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.style.background = '#c8e6c9';
      setTimeout(() => { btn.style.background = ''; }, 300);
    });
  });

  /* ---- Quick action items ---- */
  const qaItems = document.querySelectorAll('.qa-list li');
  qaItems.forEach(item => {
    item.addEventListener('click', () => {
      qaItems.forEach(q => q.style.fontWeight = '');
      item.style.fontWeight = '700';
    });
  });

  /* ---- Notification bell ---- */
  const notifBtn = document.querySelector('.notif-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      const badge = notifBtn.querySelector('.notif-badge');
      if (badge) {
        badge.style.transform = 'scale(0)';
        setTimeout(() => { badge.style.display = 'none'; }, 300);
      }
    });
  }

});

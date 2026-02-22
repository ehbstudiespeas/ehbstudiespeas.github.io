(() => {
  // Respect reduced-motion preferences
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    document.querySelectorAll('.peas-logo, .pea-label, .wink').forEach(el => {
      el.style.animation = 'none';
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    // Hide wink overlay in reduced motion (optional)
    const wink = document.querySelector('.wink');
    if (wink) wink.style.display = 'none';
  }
})();
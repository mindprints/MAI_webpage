// Add slide-in animations when elements come into view
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('slide-in');
    });
}, { threshold: 0.2 });
document.querySelectorAll('.feature-card').forEach(card => observer.observe(card));

// Simple toggle for mobile menu (if added)
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden');
}

// Hero stack animation (auto-cycle + click-to-advance, with reduced-motion support)
(function(){
    const stack = document.getElementById('hero-stack');
    if (!stack) return;
    const cards = Array.from(stack.querySelectorAll('.hero-card'));
    if (!cards.length) return;

    let activeIndex = 0;
    const len = cards.length;

    function layout(){
        cards.forEach((card, idx) => {
            const order = (idx - activeIndex + len) % len; // 0 is front
            const rotate = (order - Math.floor(len/2)) * 5; // fan
            const translateY = order * 6;
            const scale = order === 0 ? 1.02 : 1.0;
            card.style.zIndex = String(10 + (len - order));
            card.style.transform = `rotate(${rotate}deg) translateY(${translateY}px) scale(${scale})`;
            card.style.filter = order === 0 ? 'none' : 'brightness(0.85) saturate(0.95) blur(0.3px)';
            card.classList.toggle('active', order === 0);
        });
    }

    layout();

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let timer = null;
    if (!prefersReduced) {
        timer = setInterval(() => { activeIndex = (activeIndex + 1) % len; layout(); }, 2800);
    }

    // Clicking (or keyboard) always advances the deck: top -> bottom
    cards.forEach((card) => {
        card.tabIndex = 0;
        card.role = 'button';
        card.style.cursor = 'pointer';
        card.setAttribute('aria-label', 'Advance hero image');
        card.addEventListener('click', () => { activeIndex = (activeIndex + 1) % len; layout(); });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activeIndex = (activeIndex + 1) % len; layout(); }
        });
    });
})();

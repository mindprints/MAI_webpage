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
    let isAnimating = false;
    const len = cards.length;
    const ANIMATION_DURATION = 800; // Match CSS transition duration

    function layout(){
        if (isAnimating) return;
        isAnimating = true;
        
        cards.forEach((card, idx) => {
            const order = (idx - activeIndex + len) % len; // 0 is front
            const rotate = (order - Math.floor(len/2)) * 4; // Reduced rotation
            const translateZ = -order * 20; // Add depth
            const translateY = order * 8;
            const scale = Math.max(1 - (order * 0.05), 0.9); // Progressive scale reduction
            
            card.style.zIndex = String(10 + (len - order));
            card.style.transform = `
                translateY(${translateY}px) 
                translateZ(${translateZ}px) 
                rotateX(${rotate/2}deg) 
                rotateY(${rotate}deg) 
                scale(${scale})
            `;
            card.style.filter = order === 0 ? 'none' : `brightness(${1 - order * 0.1}) blur(${order * 0.5}px)`;
            card.classList.toggle('active', order === 0);
        });

        // Reset animation lock after transition completes
        setTimeout(() => { isAnimating = false; }, ANIMATION_DURATION);
    }

    // Initial layout
    layout();

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let timer = null;

    function startAutoRotation() {
        if (timer || prefersReduced) return;
        timer = setInterval(() => {
            if (!isAnimating) {
                activeIndex = (activeIndex + 1) % len;
                layout();
            }
        }, 3500); // Slightly longer interval for better viewing
    }

    function stopAutoRotation() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    // Start auto-rotation if no reduced motion preference
    if (!prefersReduced) {
        startAutoRotation();
    }

    // Enhanced interaction handling
    cards.forEach((card) => {
        card.tabIndex = 0;
        card.role = 'button';
        card.style.cursor = 'pointer';
        card.setAttribute('aria-label', 'Advance hero image');

        function advanceStack(e) {
            if (e) e.preventDefault();
            if (isAnimating) return;
            
            stopAutoRotation();
            activeIndex = (activeIndex + 1) % len;
            layout();
            startAutoRotation();
        }

        // Click handling
        card.addEventListener('click', advanceStack);
        
        // Keyboard handling
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                advanceStack(e);
            }
        });

        // Pause auto-rotation on hover
        card.addEventListener('mouseenter', stopAutoRotation);
        card.addEventListener('mouseleave', startAutoRotation);
    });
})();

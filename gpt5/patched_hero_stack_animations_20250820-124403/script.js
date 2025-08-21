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
    const ANIMATION_DURATION = 1200; // Match CSS transition duration
    const VIEW_RATIO = 500/320; // md:h-[500px] / md:w-80 from the HTML

    // Store image dimensions and calculate animations
    const cardAnimations = new Map();

    // Preload images and calculate their dimensions
    cards.forEach(card => {
        const bgImage = card.style.backgroundImage.replace(/url\(['"](.+)['"]\)/, '$1');
        const img = new Image();
        img.onload = () => {
            const ratio = img.height / img.width;
            const isPortrait = ratio >= VIEW_RATIO;
            
            let animation;
            if (isPortrait) {
                // For portrait images, create a zoom effect
                animation = { type: 'zoom' };
            } else {
                // For landscape images, create a pan effect
                animation = { type: 'pan' };
            }
            cardAnimations.set(card, animation);
        };
        img.src = bgImage;
    });

    function layout(){
        if (isAnimating) return;
        isAnimating = true;

        // Calculate the rotation of the active card
        const activeCardIdx = activeIndex;
        const activeCardPosition = cards[activeCardIdx].dataset.initialPosition || activeCardIdx;
        const baseAngle = Math.max(3, Math.min(12, 15 - len * 0.5));
        const activeCardRotation = (activeCardPosition - Math.floor(len/2)) * baseAngle;
        
        // If we haven't started the animation loop yet, start it
        if (!stack.dataset.animating) {
            stack.dataset.animating = 'true';
            let lastTimestamp = 0;
            let stackRotation = 0;
            const ROTATION_PERIOD = 10000; // 10 seconds for full rotation
            const CARD_SHOW_ANGLE = 30;    // 1 o'clock position (30 degrees)
            const CARD_HIDE_ANGLE = 330;   // 11 o'clock position (330 degrees)
            const CARDS_PER_ROTATION = len;
            
            function animate(timestamp) {
                if (!stack.dataset.animating) return;
                
                if (!lastTimestamp) lastTimestamp = timestamp;
                const deltaTime = timestamp - lastTimestamp;
                lastTimestamp = timestamp;
                
                // Calculate stack rotation (clockwise)
                const rotationSpeed = 360 / ROTATION_PERIOD; // degrees per millisecond
                stackRotation = (timestamp % ROTATION_PERIOD) * rotationSpeed;
                
                // Calculate which card should be active based on rotation
                const newActiveIndex = Math.floor((stackRotation / 360) * CARDS_PER_ROTATION) % len;
                if (newActiveIndex !== activeIndex) {
                    activeIndex = newActiveIndex;
                }
                
                // Apply stack rotation
                stack.style.transform = `rotate(${stackRotation}deg)`;
                
                // Update each card's counter-rotation
                cards.forEach((card, idx) => {
                    // Calculate card's position in rotation cycle
                    const cardAngle = ((idx - activeIndex + len) % len) * (360 / len);
                    const counterRotation = -stackRotation; // Counter-rotate to maintain orientation
                    
                    // Apply counter-rotation and any additional transforms
                    card.style.transform = `
                        rotate(${counterRotation}deg)
                        translateY(${idx === activeIndex ? 0 : 8}px)
                        scale(${idx === activeIndex ? 1 : 0.95})
                    `;
                    
                    // Update visibility/active state
                    const isVisible = cardAngle >= CARD_SHOW_ANGLE && cardAngle <= CARD_HIDE_ANGLE;
                    card.style.opacity = isVisible ? '1' : '0';
                    card.classList.toggle('active', idx === activeIndex);
                });
                
                // Apply the rotation
                stack.style.transform = `rotate(${currentAngle}deg)`;
                
                requestAnimationFrame(animate);
            }
            
            requestAnimationFrame(animate);
        }
        
        cards.forEach((card, idx) => {
            // Store initial position for reference
            if (!card.dataset.initialPosition) {
                card.dataset.initialPosition = idx;
            }
            const order = (idx - activeIndex + len) % len; // 0 is front
            // Calculate initial position in stack (0 to len-1)
            const initialPosition = idx;
            // Calculate base rotation from initial position
            // Adjust fan rotation based on number of cards
            const baseAngle = Math.max(3, Math.min(12, 15 - len * 0.5)); // Reduce angle as cards increase
            const baseRotation = (initialPosition - Math.floor(len/2)) * baseAngle;
            // Add extra fan-out based on current order
            const fanRotation = baseRotation + (order * 3); // Progressive rotation
            const translateZ = -order * 15; // Depth effect
            const translateY = order * 8;
            const scale = Math.max(1 - (order * 0.05), 0.9); // Progressive scale reduction
            
            card.style.zIndex = String(10 + (len - order));
            // Get the animation for this card
            const animation = cardAnimations.get(card);
            let transform = `
                translateY(${translateY}px) 
                translateZ(${translateZ}px) 
                rotate(${fanRotation}deg) 
                scale(${scale})
            `;

            // Handle animations only for active card
            if (order === 0 && animation) {
                // Add animation class based on type
                if (animation.type === 'zoom') {
                    card.classList.add('zoom-animation');
                } else if (animation.type === 'pan') {
                    card.classList.add('pan-animation');
                }
            } else {
                // Remove all animations for non-active cards
                card.classList.remove('zoom-animation', 'pan-animation');
            }
            
            card.style.transform = transform;
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


// === Override: hero-stack stacked carousel with gradient fillers + one-shot animations ===
(function(){
  const stack = document.getElementById('hero-stack');
  if (!stack) return;
  const cards = Array.from(stack.querySelectorAll('.hero-card'));
  if (!cards.length) return;

  // Stop any earlier animation loop that used dataset flag
  stack.dataset.animating = "";
  stack.style.transform = 'none';
  cards.forEach(c => { c.style.transform = 'none'; c.classList.remove('zoom-animation','pan-animation'); });

  // Gradient generator (SVG -> data URI) with embedded size metadata
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function gradientSVGDataURL(w,h,label){
    const palettes = [
      ['#6aa7ff','#a1ffe0'],
      ['#ff8a5b','#ffd26a'],
      ['#9b6bff','#ff8bf2'],
      ['#70e1f5','#ffd194'],
      ['#00c9ff','#92fe9d']
    ];
    const [c1,c2] = pick(palettes);
    const stripe = Math.max(2, Math.round(Math.min(w,h)/30));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <pattern id="p" width="${stripe*4}" height="${stripe*4}" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
      <rect width="100%" height="100%" fill="url(#g)"/>
      <rect width="${stripe*2}" height="${stripe*4}" fill="rgba(255,255,255,0.08)"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#p)"/>
  <circle cx="${Math.round(w*0.7)}" cy="${Math.round(h*0.4)}" r="${Math.round(Math.min(w,h)/6)}" fill="rgba(255,255,255,0.2)"/>
  <text x="12" y="28" font-family="monospace" font-size="24" fill="rgba(255,255,255,0.85)">${label}</text>
</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  // Assign gradient fillers if the card has no background or if we want to override
  const sizes = [
    [1600,1000], // wide → horizontal pan
    [960,1440],  // near 2:3 → zoom
    [1800,1100], // wide
    [960,1440],  // zoom
    [2200,1200], // wide
    [640,960],   // zoom
    [2400,800],  // super wide
    [800,1600]   // tall → vertical pan
  ];
  cards.forEach((card, i) => {
    const w = sizes[i % sizes.length][0], h = sizes[i % sizes.length][1];
    const uri = gradientSVGDataURL(w,h, `${w}×${h}`);
    card.style.backgroundImage = `url("${uri}")`;
    card.dataset.imgW = String(w);
    card.dataset.imgH = String(h);
  });

  function computeVars(card){
    const rect = stack.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    const iw = parseFloat(card.dataset.imgW || "1600");
    const ih = parseFloat(card.dataset.imgH || "1000");
    const imageRatio = iw / ih;
    const viewRatio = ch / cw;
    const overscan = 0.04;
    const zoomMult = 1.15; // +15%

    // Clear
    card.style.removeProperty('--bg-pos-start');
    card.style.removeProperty('--bg-pos-end');
    card.style.removeProperty('--bg-size-start');
    card.style.removeProperty('--bg-size-end');
    card.style.removeProperty('--pan-duration');

    if (imageRatio > (1/viewRatio) ) {
      // Wide → horizontal pan (fit height)
      const scaledWidth = (iw/ih) * ch;
      const endX = Math.min(0, -(scaledWidth - cw)); // negative or 0
      card.style.setProperty('--bg-size-start', `auto ${Math.round(ch*(1+overscan))}px`);
      card.style.setProperty('--bg-size-end', `auto ${Math.round(ch*(1+overscan))}px`);
      card.style.setProperty('--bg-pos-start', `0px center`);
      card.style.setProperty('--bg-pos-end', `${Math.round(endX)}px center`);
      card.style.setProperty('--pan-duration', `6s`);
    } else if (imageRatio < (1/viewRatio) ) {
      // Tall → vertical pan (fit width)
      const scaledHeight = (ih/iw) * cw;
      const endY = Math.min(0, -(scaledHeight - ch));
      card.style.setProperty('--bg-size-start', `${Math.round(cw*(1+overscan))}px auto`);
      card.style.setProperty('--bg-size-end', `${Math.round(cw*(1+overscan))}px auto`);
      card.style.setProperty('--bg-pos-start', `center 0px`);
      card.style.setProperty('--bg-pos-end', `center ${Math.round(endY)}px`);
      card.style.setProperty('--pan-duration', `6s`);
    } else {
      // Near 2:3 → zoom (no pan)
      const base = `${Math.round(cw)}px auto`;
      const zoom = `${Math.round(cw*zoomMult)}px auto`;
      card.style.setProperty('--bg-size-start', base);
      card.style.setProperty('--bg-size-end', zoom);
      card.style.setProperty('--bg-pos-start', `center center`);
      card.style.setProperty('--bg-pos-end', `center center`);
      card.style.setProperty('--pan-duration', `6s`);
    }
  }

  let zCursor = 100;
  let idx = 0;
  const seconds = 6;
  function setActive(n){
    cards.forEach((card, i) => {
      const on = i === n;
      if (on){
        // compute fresh vars on activation
        computeVars(card);
        card.style.zIndex = ++zCursor;
        card.classList.remove('resetting');
        // ensure we are at start state
        card.classList.remove('animate');
        // force reflow
        void card.offsetHeight;
        card.classList.add('active');
        // run one-shot to end
        requestAnimationFrame(() => card.classList.add('animate'));
      } else {
        // fade out and snap back to start
        card.classList.add('resetting');
        card.classList.remove('animate');
        card.classList.remove('active');
        void card.offsetHeight;
      }
    });
  }
  setActive(0);
  setInterval(() => { idx = (idx+1)%cards.length; setActive(idx); }, seconds*1000);
})();

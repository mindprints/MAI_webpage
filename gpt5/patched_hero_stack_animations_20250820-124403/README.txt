
Patched hero-stack animations (pan/zoom with gradient fillers)

What changed
------------
1) styles.css
   - Removed looping keyframes (.zoom-animation / .pan-animation).
   - Added variable-driven, one-shot animations for .hero-card:
     background-position/size transition + fade, with classes:
       .active (fade in), .animate (run end state), .resetting (snap back).
   - Keeps cards stacked and uses z-index rotation for smooth swaps.

2) script.js
   - Appended a new IIFE that overrides the old hero-stack loop and
     implements a stacked carousel with one-shot animations.
   - Generates SVG gradient data URIs as fillers and assigns them to
     each .hero-card (no external image access required).
   - Computes pan/zoom targets per card and feeds them via CSS variables.
   - Disables the old rotation loop by clearing stack.dataset.animating,
     resets transforms, and removes old animation classes.

Notes
-----
- Ensure the hero-stack markup is present in home.html:
    <div id="hero-stack" class="hero-stack ...">
      <div class="hero-card"></div> ... (repeat)
    </div>
  If it was commented out, please uncomment it.

- Tall images pan vertically; wide images pan horizontally; near-2:3 zoom.
- None of the animations loop. When a card leaves the top, it resets to
  its start pose behind the scenes.

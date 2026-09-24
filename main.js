import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import ScrambleTextPlugin from 'gsap/ScrambleTextPlugin';
import Lenis from 'lenis';
import SplitType from 'split-type';
import { CONFIG } from './config.js';

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

// Image Trail Effect Class - Desktop (Mouse-based)
class ImageTrail {
    constructor(container) {
        this.container = container;
        this.images = [...container.querySelectorAll('.image-trail__img')];
        this.imgIndex = 0;
        this.zIndex = 1;

        // Mouse position tracking
        this.mousePos = { x: 0, y: 0 };
        this.cachePos = { x: 0, y: 0 };

        // Threshold for showing new image (distance in pixels)
        this.threshold = 80;

        // Performance: Track visibility state
        this.isActive = false;
        this.rafId = null;

        // Bind methods
        this.onMouseMove = this.onMouseMove.bind(this);
        this.render = this.render.bind(this);

        this.init();
    }

    init() {
        // Listen to mouse movement on the hero section
        const hero = this.container.closest('.hero');
        if (!hero) return;

        hero.addEventListener('mousemove', this.onMouseMove);

        // Performance: Use IntersectionObserver to pause RAF when off-screen
        const observer = new IntersectionObserver((entries) => {
            this.isActive = entries[0].isIntersecting;
            if (this.isActive && !this.rafId) {
                this.startLoop();
            } else if (!this.isActive && this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        }, { threshold: 0 });
        observer.observe(hero);
    }

    startLoop() {
        if (!this.isActive) return;
        this.render();
        this.rafId = requestAnimationFrame(() => this.startLoop());
    }

    onMouseMove(e) {
        const rect = this.container.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
    }

    getDistance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }

    showNextImage() {
        const img = this.images[this.imgIndex];
        if (!img) return;

        // Update z-index for stacking
        this.zIndex++;
        img.style.zIndex = this.zIndex;

        // Random rotation for visual interest
        const rotation = gsap.utils.random(-15, 15);

        // Position the image at cursor
        gsap.set(img, {
            x: this.mousePos.x,
            y: this.mousePos.y,
            rotation: rotation
        });

        // Animate in
        gsap.timeline()
            .to(img, {
                opacity: 1,
                scale: 1,
                duration: 0.4,
                ease: 'power2.out'
            })
            .to(img, {
                opacity: 0,
                scale: 0.3,
                duration: 0.8,
                ease: 'power2.in',
                delay: 0.3
            });

        // Cycle to next image
        this.imgIndex = (this.imgIndex + 1) % this.images.length;

        // Update cache position
        this.cachePos.x = this.mousePos.x;
        this.cachePos.y = this.mousePos.y;
    }

    render() {
        // Calculate distance from last cached position
        const distance = this.getDistance(
            this.mousePos.x,
            this.mousePos.y,
            this.cachePos.x,
            this.cachePos.y
        );

        // Show new image if moved past threshold
        if (distance > this.threshold) {
            this.showNextImage();
        }
    }
}

// Touch Image Effect Class - Mobile/Tablet (Tap-based, 1 image per tap)
class TouchImageEffect {
    constructor(container) {
        this.container = container;
        this.images = [...container.querySelectorAll('.image-trail__img')];
        this.imgIndex = 0;
        this.zIndex = 1;
        this.lastTapTime = 0;
        this.tapCooldown = 150; // Prevent accidental double-taps

        // Bind methods
        this.onTap = this.onTap.bind(this);

        this.init();
    }

    init() {
        const hero = this.container.closest('.hero');
        if (!hero) return;

        // Listen for touch and click events
        hero.addEventListener('touchstart', this.onTap, { passive: true });
        hero.addEventListener('click', this.onTap);
    }

    onTap(e) {
        // Cooldown to prevent rapid double-fires
        const now = Date.now();
        if (now - this.lastTapTime < this.tapCooldown) return;
        this.lastTapTime = now;

        // Prevent double-firing (touchstart + click on same tap)
        if (e.type === 'click' && 'ontouchstart' in window) {
            // On touch devices, ignore synthetic click events
            return;
        }

        // Get tap position
        let x, y;
        if (e.touches && e.touches[0]) {
            const rect = this.container.getBoundingClientRect();
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            const rect = this.container.getBoundingClientRect();
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        // Show single image at tap position
        this.showImageAtPosition(x, y);
    }

    showImageAtPosition(x, y) {
        const img = this.images[this.imgIndex];
        if (!img) return;

        // Update z-index for proper stacking
        this.zIndex++;
        img.style.zIndex = this.zIndex;

        // Random rotation for visual interest
        const rotation = gsap.utils.random(-15, 15);

        // Set initial state - centered at tap point, scaled down
        gsap.set(img, {
            x: x,
            y: y,
            rotation: 0,
            scale: 0,
            opacity: 0
        });

        // Animate: pop in elegantly, hold briefly, then fade out
        gsap.timeline()
            .to(img, {
                scale: 1,
                rotation: rotation,
                opacity: 1,
                duration: 0.4,
                ease: 'back.out(1.7)'
            })
            .to(img, {
                opacity: 0,
                scale: 0.8,
                y: y + 20, // slight drop as it fades
                duration: 0.5,
                ease: 'power2.in'
            }, '+=0.4'); // Hold for 0.4s before fading

        // Cycle to next image
        this.imgIndex = (this.imgIndex + 1) % this.images.length;
    }
}

// Initialize Image Trail - Both mouse and touch/click support on all devices
const initImageTrail = () => {
    const container = document.getElementById('image-trail');
    if (!container) return;

    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    // Always initialize touch/click effect for taps and clicks
    new TouchImageEffect(container);

    // Also initialize mouse trail on non-touch devices
    if (!isTouchDevice) {
        new ImageTrail(container);
    }
};

// Initialize Lenis (Smooth Scroll) - Returns the instance for control
let lenisInstance = null;

const initLenis = () => {
    lenisInstance = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
    });

    lenisInstance.on('scroll', ScrollTrigger.update);
    // Sync GSAP with Lenis (single RAF source - no conflict)
    gsap.ticker.add((time) => {
        lenisInstance.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return lenisInstance;
};

// 2. Hero Animation
const initHero = () => {
    const heroContainer = document.querySelector('.hero__container');
    const subtitle = document.querySelector('.hero__subtitle');

    // Split Text - this creates the .char elements
    const title = new SplitType('.hero__title', { types: 'chars' });

    // 1. Set initial hidden states BEFORE revealing container
    gsap.set(title.chars, {
        yPercent: 100,
        opacity: 0
    });

    gsap.set(subtitle, {
        y: 20,
        opacity: 0
    });

    // 2. Reveal container now that initial states are set
    // CSS has visibility:hidden on .hero__container, .is-ready makes it visible
    heroContainer.classList.add('is-ready');

    // 3. Create animation timeline
    const tl = gsap.timeline();

    // Animate characters TO visible state
    tl.to(title.chars, {
        yPercent: 0,
        opacity: 1,
        stagger: 0.05,
        duration: 1,
        ease: 'power4.out'
    });

    // Animate subtitle TO visible state
    tl.to(subtitle, {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power2.out'
    }, "-=0.5");

    // Scroll Effect (Exploding Text)
    gsap.to('.hero__container', {
        scale: 2,
        opacity: 0,
        filter: 'blur(10px)',
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        }
    });
};

// 3. Horizontal Scroll (About) - Works on all devices
const initAbout = () => {
    const track = document.querySelector('.about__track');

    gsap.to(track, {
        xPercent: -66.666, // Move 2/3rds (since 3 panels)
        ease: 'none',
        scrollTrigger: {
            trigger: '.about',
            pin: true,
            scrub: 1,
            start: 'top top',
            end: '+=3000' // Scroll distance
        }
    });
};

// 4. Skills Cloud (3D Tilt)
const initSkills = () => {
    const section = document.querySelector('.skills');
    const cloud = document.querySelector('.skills__cloud');

    section.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;

        gsap.to(cloud, {
            rotationY: x,
            rotationX: -y,
            duration: 1,
            ease: 'power2.out'
        });
    });
};

// 5. Projects (Parallax Stack)
const initProjects = () => {
    const cards = document.querySelectorAll('.project-card');

    cards.forEach((card, i) => {
        gsap.to(card, {
            scale: 0.9 + (0.05 * i), // Subtle scale diff
            scrollTrigger: {
                trigger: card,
                start: 'top 15%', // Sticky position matches CSS
                end: 'bottom 15%',
                scrub: true
            }
        });
    });
};

// 6. Experience Section (Animated Cards)
const initExperience = () => {
    const line = document.querySelector('.experience__line');
    const cards = document.querySelectorAll('.exp-card');

    // Animated line drawing
    ScrollTrigger.create({
        trigger: '.experience__grid',
        start: 'top 80%',
        toggleActions: 'play none none reset',
        onEnter: () => line.classList.add('is-visible'),
        onLeaveBack: () => line.classList.remove('is-visible')
    });

    // Experience cards with staggered reveal and 3D transforms
    cards.forEach((card, index) => {
        // Stagger delay based on card index
        const delay = index * 0.15;

        ScrollTrigger.create({
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none reset',
            onEnter: () => {
                // Add delay for staggered effect
                setTimeout(() => {
                    card.classList.add('is-visible');
                }, delay * 1000);
            },
            onLeaveBack: () => card.classList.remove('is-visible')
        });
    });
};

// 7. Section Titles Animation (Global)
const initSectionTitles = () => {
    const titles = document.querySelectorAll('.section-title');
    titles.forEach(title => {
        ScrollTrigger.create({
            trigger: title,
            start: 'top 85%',
            toggleActions: 'play none none reset',
            onEnter: () => title.classList.add('is-visible'),
            onLeaveBack: () => title.classList.remove('is-visible')
        });
    });
};



// 8. Contact Links - magnetic hover (reveal is driven by initSpotlight)
const initContactLinks = () => {
    const contactLinks = document.querySelectorAll('.contact-link');
    if (contactLinks.length === 0) return;

    // Skip magnetic effect on touch devices
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    contactLinks.forEach((link) => {
        const icon = link.querySelector('.contact-link__icon');

        if (!isTouchDevice) {
            // Magnetic hover effect for icon
            link.addEventListener('mousemove', (e) => {
                const rect = icon.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                gsap.to(icon, {
                    x: x * 0.2,
                    y: y * 0.2,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            link.addEventListener('mouseleave', () => {
                gsap.to(icon, {
                    x: 0,
                    y: 0,
                    duration: 0.6,
                    ease: 'elastic.out(1, 0.4)'
                });
            });
        }
    });
};

// 10. Spotlight CTA - stacked "BUILD"; the front "I" drops out, turns sideways and becomes the contact link
const SVG_NS = 'http://www.w3.org/2000/svg';
const WORD_VIEWBOX_WIDTH = 6661;
// Fallback if getBBox is unavailable (e.g. SVG not rendered yet)
const LETTER_I_BOX = { x: 3205.66, y: 0, width: 337.5, height: 1750 };

const initSpotlight = () => {
    const section = document.querySelector('.spotlight');
    const front = section?.querySelector('.spotlight__header');
    const letterI = front?.querySelector('.spotlight__letter-i');
    if (!letterI) return;

    const opts = CONFIG.spotlight;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const contactLinksRow = section.querySelector('.contact-links');
    const contactLinks = contactLinksRow ? [...contactLinksRow.querySelectorAll('.contact-link')] : [];

    // Echo layers: clones sit behind the original, which stays the front (interactive) layer
    for (let i = 1; i < opts.layers; i++) {
        const clone = front.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        section.insertBefore(clone, front);
    }
    const headers = [...section.querySelectorAll('.spotlight__header')];
    const last = headers.length - 1;
    headers.forEach((header, i) => {
        // Back layers fade toward the surface colour, front layer is full text colour
        const t = last ? Math.pow(i / last, 1.5) : 1;
        header.style.setProperty('--layer-fill', gsap.utils.interpolate('#262626', '#EDEDED', t));
    });

    // Wrap the front "I" in <a><g>: GSAP transforms the group, the anchor makes it a real link
    const link = document.createElementNS(SVG_NS, 'a');
    link.setAttribute('href', opts.href);
    link.setAttribute('class', 'spotlight__link');
    link.setAttribute('aria-label', opts.label);
    const group = document.createElementNS(SVG_NS, 'g');
    letterI.parentNode.insertBefore(link, letterI);
    link.appendChild(group);
    group.appendChild(letterI);

    let box = LETTER_I_BOX;
    try {
        const b = letterI.getBBox();
        if (b.width && b.height) box = b;
    } catch { /* keep fallback */ }
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Label is drawn upright inside the vertical "I" (rotated -90) so it reads normally once the group turns +90
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('class', 'spotlight__label');
    label.setAttribute('x', cx);
    label.setAttribute('y', cy);
    label.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
    label.setAttribute('aria-hidden', 'true');
    group.appendChild(label);
    gsap.set(group, { transformOrigin: '50% 50%' });

    const labelText = opts.label.toUpperCase();
    const labelTween = reduceMotion ? null : gsap.to(label, {
        duration: 0.75,
        scrambleText: { text: labelText, chars: 'upperCase', revealDelay: 0.1, speed: 0.5 },
        paused: true,
    });

    // Geometry is derived from the live layout, so the "I" always lands in the empty space
    // under the stack and at a readable size, whatever the viewport.
    let geo = { shiftStep: 0, slide: 0, letterScale: 1 };
    const measure = () => {
        const style = getComputedStyle(front);
        const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        const padTop = parseFloat(style.paddingTop);
        const k = (front.clientWidth - padX) / WORD_VIEWBOX_WIDTH; // px per SVG unit
        if (!k) return;

        const vw = window.innerWidth;
        const headerTop = front.offsetTop;
        const headerH = front.offsetHeight;
        const shiftStep = vw < 1000 ? 20 : 6;
        const frontScale = 1 - last * opts.scaleStep;
        const frontShift = last * shiftStep;
        const stackBottom = headerTop + headerH + frontShift;
        // Usable space runs from the stack down to the copyright line (or the section bottom)
        const credits = section.querySelector('.spotlight__credits');
        const bottomLimit = credits ? credits.offsetTop - 16 : section.clientHeight;
        const freeSpace = Math.max(bottomLimit - stackBottom, 0);
        // Fixed space around the bar: gap above it, the icon row and gaps below it
        const reservedH = (contactLinksRow
            ? contactLinksRow.offsetHeight + opts.linksGap + opts.linksBottomGap
            : 0) + opts.barTopGap;

        // Finished bar length on screen; keep its thickness inside what's left after the icons
        const { vw: vwFrac, min, max } = opts.barWidth;
        let barLen = gsap.utils.clamp(min, max, vw * vwFrac);
        barLen = Math.min(barLen, (Math.max(freeSpace - reservedH, 0) * 0.9 * box.height) / box.width, vw - 32);
        barLen = Math.max(barLen, 120);
        const barThickness = (barLen * box.width) / box.height;

        const blockTop = stackBottom + opts.barTopGap + Math.max((freeSpace - barThickness - reservedH) / 2, 0);
        const target = blockTop + barThickness / 2;
        if (contactLinksRow) contactLinksRow.style.top = `${target + barThickness / 2 + opts.linksGap}px`;

        // Header scales from its bottom edge, so solve for the SVG-unit slide that puts the centre on target
        const slide = (headerH - padTop - (stackBottom - target) / frontScale) / k - cy;
        geo = { shiftStep, slide, letterScale: barLen / (box.height * k * frontScale) };
    };

    let isRevealed = false;
    const setRevealed = (revealed) => {
        if (revealed === isRevealed) return;
        isRevealed = revealed;
        section.classList.toggle('is-revealed', revealed);
        // Stagger comes from the nth-child transition delays in CSS
        contactLinks.forEach((el) => el.classList.toggle('is-visible', revealed));
        if (labelTween) {
            revealed ? labelTween.play() : labelTween.reverse();
        } else {
            label.textContent = revealed ? labelText : '';
        }
    };

    // quickSetters skip creating a tween per property per frame - render runs on every scroll tick
    // (quickSetter doesn't expand the `scale` alias, so set scaleX/scaleY together)
    const scaleSetter = (el) => {
        const setX = gsap.quickSetter(el, 'scaleX');
        const setY = gsap.quickSetter(el, 'scaleY');
        return (v) => { setX(v); setY(v); };
    };
    const headerSetters = headers.map((header) => ({
        scale: scaleSetter(header),
        y: gsap.quickSetter(header, 'y', 'px'),
    }));
    const setGroupRotation = gsap.quickSetter(group, 'rotation');
    const setGroupY = gsap.quickSetter(group, 'y');
    const setGroupScale = scaleSetter(group);
    let lastCascade = -1;
    let lastDrop = -1;

    const render = (progress, force = false) => {
        const cascade = Math.min(progress / 0.5, 1);
        if (force || cascade !== lastCascade) {
            lastCascade = cascade;
            headerSetters.forEach((set, i) => {
                set.scale(1 - i * opts.scaleStep * cascade);
                set.y(i * geo.shiftStep * cascade);
            });
        }

        const drop = gsap.utils.clamp(0, 1, (progress - 0.5) / 0.5);
        if (force || drop !== lastDrop) {
            lastDrop = drop;
            setGroupRotation(90 * drop);
            setGroupY(geo.slide * drop);
            setGroupScale(gsap.utils.interpolate(1, geo.letterScale, drop));
        }

        setRevealed(progress >= opts.revealAt);
    };

    let trigger = null;
    const mm = gsap.matchMedia();
    mm.add({
        // matchMedia only runs the callback when some condition matches, so keep one that always does
        any: 'all',
        // Pinning only where scrolling runs on the main thread with a fine pointer (desktop).
        // On touch/phones a pinned section jitters: native momentum scroll runs ahead of JS,
        // and the collapsing address bar moves the pin's end point.
        pinned: '(pointer: fine) and (min-width: 769px)',
        reduce: '(prefers-reduced-motion: reduce)',
    }, (ctx) => {
        const { pinned, reduce } = ctx.conditions;
        measure();

        if (reduce) {
            // No scroll choreography: show the finished composition, keep it laid out on refresh
            render(1, true);
            const relayout = () => { measure(); render(1, true); };
            ScrollTrigger.addEventListener('refresh', relayout);
            trigger = null;
            return () => ScrollTrigger.removeEventListener('refresh', relayout);
        }

        render(0, true);
        trigger = ScrollTrigger.create({
            trigger: section,
            ...(pinned
                ? {
                    start: 'top top',
                    end: () => `+=${window.innerHeight * opts.scrollLength}`,
                    pin: true,
                    anticipatePin: 1,
                    scrub: true,
                }
                : {
                    // Plays while the section scrolls into view, no pin. Finishes a little before
                    // the page bottom so a hidden/shown address bar can't leave it half done.
                    start: 'top 75%', // word (22svh into the section) is on screen by now
                    end: `bottom bottom+=${opts.touchEndOffset}`,
                    scrub: opts.touchScrub,
                }),
            invalidateOnRefresh: true,
            onRefresh: (self) => { measure(); render(self.progress, true); },
            onUpdate: (self) => render(self.progress),
        });
    });

    // Keyboard users tabbing onto the bar or the (still hidden) icons get taken to the revealed state
    const revealOnFocus = () => {
        if (isRevealed || !trigger) return;
        if (lenisInstance) lenisInstance.scrollTo(trigger.end);
        else window.scrollTo(0, trigger.end);
    };
    [link, ...contactLinks].forEach((el) => el.addEventListener('focus', revealOnFocus));
};

// 11. Dynamic Year Update
const initYearUpdate = () => {
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
};

// 9. Dynamic Hero Images & Favicon
const initHeroImages = () => {
    return new Promise((resolveAll) => {
        // Load all images (jpg, png, svg, webp) from assets/hero directory
        // NOTE: Ensure these files actually exist in your project structure!
        const imagesGlob = import.meta.glob('/assets/hero/*.{jpg,jpeg,png,webp,svg}', { eager: true });

        const imageUrls = Object.values(imagesGlob).map(mod => {
            return typeof mod === 'object' && mod.default ? mod.default : mod;
        });

        if (imageUrls.length === 0) {
            resolveAll([]);
            return;
        }

        // 1. Set Tab Bar Image (Favicon)
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = imageUrls[0];

        // 2. Populate Image Trail
        const trailContainer = document.getElementById('image-trail');
        if (trailContainer) {
            trailContainer.innerHTML = '';
            const images = [];
            const imagePromises = imageUrls.map(url => {
                const img = document.createElement('img');
                img.className = 'image-trail__img';
                img.alt = 'Hero Background';
                img.setAttribute('role', 'presentation');
                img.src = url;
                images.push(img);

                if ('decode' in img) {
                    return img.decode()
                        .then(() => { trailContainer.appendChild(img); })
                        .catch(() => { trailContainer.appendChild(img); });
                } else {
                    return new Promise((resolve) => {
                        img.onload = img.onerror = () => {
                            trailContainer.appendChild(img);
                            resolve();
                        };
                    });
                }
            });

            Promise.all(imagePromises).then(() => {
                resolveAll(images);
            });
        } else {
            resolveAll([]);
        }
    });
};

// ==========================================
// MASTER INIT (FIXED)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    // 4. Run Year Update Immediately (No delay)
    if (typeof initYearUpdate === 'function') initYearUpdate();

    const preloader = document.querySelector('.preloader');

    // 1. Define Unlock Function
    const unlockAndInit = () => {
        document.documentElement.classList.remove('is-loading');
        // Initialize everything
        if (typeof initLenis === 'function') initLenis();
        if (typeof initHero === 'function') initHero();
        if (typeof initAbout === 'function') initAbout();
        if (typeof initSkills === 'function') initSkills();
        if (typeof initProjects === 'function') initProjects();
        if (typeof initExperience === 'function') initExperience();
        if (typeof initSpotlight === 'function') initSpotlight();
        if (typeof initSectionTitles === 'function') initSectionTitles();
        if (typeof initContactLinks === 'function') initContactLinks();
        if (typeof initImageTrail === 'function') initImageTrail();
    };

    // 2. Start Image Loading IMMEDIATELY (Parallel)
    // Yeh background mein chalega jab tak animation ho rahi hai
    const imagesLoadingPromise = initHeroImages().catch(err => {
        console.warn("Image load failed", err);
        return []; // Fail safely
    });

    // 3. Start Signature Timer (Parallel)
    const signatureAnimationPromise = new Promise((resolve) => {
        const path = document.querySelector('.signature-path');
        if (!path) { resolve(); return; }

        // Wait for animation end OR 3.5s timeout (whichever comes first)
        const fallbackTimer = setTimeout(resolve, 3500);
        path.addEventListener('animationend', () => {
            clearTimeout(fallbackTimer);
            resolve();
        }, { once: true });
    });

    // Lock Scroll
    document.documentElement.classList.add('is-loading');
    window.scrollTo(0, 0);

    // 4. Wait for BOTH to finish
    Promise.all([signatureAnimationPromise, imagesLoadingPromise])
        .then(([_, images]) => {
            // GPU Warmup (Optional optimization)
            if (images && images.length > 0) {
                images.forEach(img => {
                    img.style.opacity = '0.01';
                    void img.offsetHeight;
                    img.style.opacity = '';
                });
            }
            return new Promise(r => setTimeout(r, 100)); // Tiny buffer
        })
        .then(() => {
            // Exit Sequence
            if (preloader) preloader.classList.add('fade-out');
            setTimeout(unlockAndInit, 500); // Unlock while fading
            setTimeout(() => {
                if (preloader) preloader.style.display = 'none';
            }, 1500);
        });
});

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

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



// 8. Footer Magnetic Button
const initFooter = () => {
    const btn = document.querySelector('.magnetic-btn');
    if (!btn) return;  // Error handling: return early if element not found

    const text = btn.querySelector('.magnetic-btn__text');

    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3 });
        if (text) gsap.to(text, { x: x * 0.1, y: y * 0.1, duration: 0.3 });
    });

    btn.addEventListener('mouseleave', () => {
        gsap.to([btn, text].filter(Boolean), { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.3)' });
    });

    // Keyboard accessibility: activate on Enter/Space
    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            // Trigger the link's default action
            if (btn.href) {
                window.location.href = btn.href;
            }
        }
    });
};

// 9. Contact Links with Magnetic Effect & GSAP Animations
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

    // Scroll-triggered staggered reveal
    ScrollTrigger.create({
        trigger: '.contact-links',
        start: 'top 85%',
        toggleActions: 'play none none reset',
        onEnter: () => {
            contactLinks.forEach((link, index) => {
                setTimeout(() => {
                    link.classList.add('is-visible');
                }, index * 100);
            });
        },
        onLeaveBack: () => {
            contactLinks.forEach((link) => {
                link.classList.remove('is-visible');
            });
        }
    });
};



// 9. Dynamic Hero Images & Favicon
const initHeroImages = () => {
    return new Promise((resolveAll) => {
        // Load all images (jpg, png, svg, webp) from assets/hero directory
        // { eager: true } imports them immediately
        // Vite handles asset URLs automatically
        const imagesGlob = import.meta.glob('/assets/hero/*.{jpg,jpeg,png,webp,svg}', { eager: true });

        // Extract URLs (handling both direct string and module.default formats)
        const imageUrls = Object.values(imagesGlob).map(mod => {
            return typeof mod === 'object' && mod.default ? mod.default : mod;
        });

        if (imageUrls.length === 0) {
            resolveAll();
            return;
        }

        // 1. Set Tab Bar Image (Favicon) to the FIRST image
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = imageUrls[0];

        // 2. Populate Image Trail with these images
        const trailContainer = document.getElementById('image-trail');
        if (trailContainer) {
            // Clear hardcoded Unsplash placeholders
            trailContainer.innerHTML = '';

            // Create a promise for each image loading
            const imagePromises = imageUrls.map(url => {
                const img = document.createElement('img');
                img.className = 'image-trail__img';
                img.alt = 'Hero Background';
                img.setAttribute('role', 'presentation');
                img.src = url;

                // robust decoding: ensure image is paint-ready before DOM insertion
                if ('decode' in img) {
                    return img.decode()
                        .then(() => {
                            trailContainer.appendChild(img);
                        })
                        .catch((err) => {
                            console.warn(`Image decode failed for ${url}, falling back.`, err);
                            trailContainer.appendChild(img);
                        });
                } else {
                    // Fallback for older browsers (unlikely needed but safe)
                    return new Promise((resolve) => {
                        img.onload = () => {
                            trailContainer.appendChild(img);
                            resolve();
                        };
                        img.onerror = () => {
                            trailContainer.appendChild(img);
                            resolve();
                        };
                    });
                }
            });

            // Wait for all images to settle
            Promise.all(imagePromises).then(() => {
                resolveAll();
            });

        } else {
            resolveAll();
        }
    });
};

// Master Init
window.addEventListener('DOMContentLoaded', () => {
    // Lock scroll during loading animation
    document.documentElement.classList.add('is-loading');
    window.scrollTo(0, 0);

    // 1. Initialize standard assets dynamically & return Promise
    const imagesLoadedPromise = initHeroImages();

    // 2. Signature Preloader Setup
    const preloader = document.querySelector('.preloader');
    const signaturePath = document.getElementById('sig-path');

    // Create a promise for the signature animation
    const signatureAnimationPromise = new Promise((resolve) => {
        if (!signaturePath) {
            resolve(); // Resolve immediately if no signature
            return;
        }

        // Setup CSS variables for path length
        const pathLength = signaturePath.getTotalLength();
        signaturePath.style.setProperty('--path-length', pathLength);
        signaturePath.style.strokeDasharray = pathLength;
        signaturePath.style.strokeDashoffset = pathLength;

        // Listen for animation completion
        signaturePath.addEventListener('animationend', () => {
            // Keep it glowing while we might be waiting for images
            signaturePath.classList.add('drawn');
            // Resolve the visual part of the loading
            resolve();
        }, { once: true });
    });

    // 3. Helper to unlock and start the site
    const unlockAndInit = () => {
        window.scrollTo(0, 0);
        document.documentElement.classList.remove('is-loading');

        // Initialize Lenis exactly when needed
        initLenis();

        // Start all site logic
        initImageTrail();
        initHero();
        initAbout();
        initSkills();
        initProjects();
        initExperience();
        initSectionTitles();
        initFooter();
        initContactLinks();

        // Handle orientation change - refresh ScrollTrigger
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                ScrollTrigger.refresh();
            }, 100);
        });

        // Handle resize for responsive recalculation
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                ScrollTrigger.refresh();
            }, 250);
        });
    };

    // 4. Wait for BOTH: Images Loaded AND Signature Drawn
    Promise.all([imagesLoadedPromise, signatureAnimationPromise])
        .then(() => {
            // Add a small buffer for the "glow" to be appreciated or to smooth the transition
            setTimeout(() => {
                // Determine if we need to start the exit sequence
                // The signature might be glowing.

                // 1. Fade out the whole preloader container
                preloader.classList.add('fade-out');

                // 2. Schedule the site unlock to happen during the fade for smoothness
                // (Start revealing content while veil lifts)
                setTimeout(() => {
                    unlockAndInit();
                }, 400);

                // 3. Remove preloader from DOM
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 1200);

            }, 600); // 600ms buffer after both are ready
        })
        .catch((err) => {
            console.warn("Loading issue:", err);
            // Fallback: force open if something fails
            preloader.classList.add('fade-out');
            setTimeout(unlockAndInit, 1000);
        });
});

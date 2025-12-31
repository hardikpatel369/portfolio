import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

// Image Trail Effect Class
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

// Initialize Image Trail
const initImageTrail = () => {
    const container = document.getElementById('image-trail');
    if (container) {
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

// 3. Horizontal Scroll (About)
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



// 9. Dynamic Hero Images & Favicon
const initHeroImages = () => {
    // Load all images (jpg, png, svg, webp) from assets/hero directory
    // { eager: true } imports them immediately
    // Vite handles asset URLs automatically
    const imagesGlob = import.meta.glob('/assets/hero/*.{jpg,jpeg,png,webp,svg}', { eager: true });

    // Extract URLs (handling both direct string and module.default formats)
    const imageUrls = Object.values(imagesGlob).map(mod => {
        // If imports as module with default export (typical for assets)
        return typeof mod === 'object' && mod.default ? mod.default : mod;
    });

    if (imageUrls.length === 0) return;

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

        // Inject new local assets
        imageUrls.forEach(url => {
            const img = document.createElement('img');
            img.className = 'image-trail__img';
            img.src = url;
            img.alt = 'Hero Background';
            img.setAttribute('role', 'presentation');
            trailContainer.appendChild(img);
        });
    }
};

// Master Init
window.addEventListener('DOMContentLoaded', () => {
    // Initialize standard assets dynamically
    initHeroImages();

    // Lock scroll during loading animation
    document.documentElement.classList.add('is-loading');
    window.scrollTo(0, 0);

    // DON'T initialize Lenis here - it bypasses CSS overflow:hidden
    // We'll init it after preloader finishes

    // Signature Preloader Animation
    const preloader = document.querySelector('.preloader');
    const signaturePath = document.getElementById('sig-path');

    // Helper function to unlock scroll and initialize site
    const unlockAndInit = () => {
        // Reset scroll to top before unlocking
        window.scrollTo(0, 0);

        // Remove loading lock
        document.documentElement.classList.remove('is-loading');

        // NOW initialize Lenis smooth scroll (after loading is complete)
        initLenis();

        // Initialize all site components
        initImageTrail();
        initHero();
        initAbout();
        initSkills();
        initProjects();
        initExperience();
        initSectionTitles();
        initFooter();
    };

    if (signaturePath) {
        // Calculate actual path length and set CSS variable
        const pathLength = signaturePath.getTotalLength();
        signaturePath.style.setProperty('--path-length', pathLength);
        signaturePath.style.strokeDasharray = pathLength;
        signaturePath.style.strokeDashoffset = pathLength;

        // Listen for animation end to add glow effect
        signaturePath.addEventListener('animationend', () => {
            signaturePath.classList.add('drawn');

            // Wait a moment with the glow, then start transition
            setTimeout(() => {
                preloader.classList.add('fade-out');

                // Initialize site components as the signature transitions
                setTimeout(() => {
                    unlockAndInit();
                }, 400); // Start hero animation while signature is still visible

                // Remove preloader from DOM after animation completes
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 1200); // Match the signature-exit animation duration
            }, 600); // Glow effect duration before exit
        });
    } else {
        // Fallback: if no signature path, just proceed
        setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
                unlockAndInit();
            }, 1000);
        }, 2000);
    }
});

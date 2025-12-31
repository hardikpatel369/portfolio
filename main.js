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

// Initialize Lenis (Smooth Scroll)
const initLenis = () => {
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    // Sync GSAP with Lenis (single RAF source - no conflict)
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
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

// 6. Experience Timeline (Draw Line)
const initExperience = () => {
    // Draw Line
    gsap.from('.timeline__line line', {
        strokeDashoffset: 1000,
        scrollTrigger: {
            trigger: '.experience',
            start: 'top center',
            end: 'bottom center',
            scrub: 1
        }
    });

    // Reveal Items
    const items = document.querySelectorAll('.timeline__item');
    items.forEach(item => {
        gsap.to(item, {
            opacity: 1,
            x: 0,
            scrollTrigger: {
                trigger: item,
                start: 'top 80%',
                end: 'top 50%',
                toggleActions: 'play none none reverse'
            }
        });
    });
};



// 7. Footer Magnetic Button
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

// 8. SVG Path Drawing
const initSVGStroke = () => {
    const path = document.getElementById("stroke-path");
    if (!path) return;

    // 1. Prepare the path length
    const pathLength = path.getTotalLength();

    // 2. Set initial state (Hidden)
    gsap.set(path, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength
    });

    // 3. Animate based on TOTAL page scroll
    gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
            trigger: "body",       // Track the whole body
            start: "top top",      // Start when top of body hits top of viewport
            end: "bottom bottom",  // End when bottom of body hits bottom of viewport
            scrub: 1,              // Smooth scrubbing (1s lag for fluid feel)
        }
    });
};

// Master Init
window.addEventListener('DOMContentLoaded', () => {
    initLenis();
    // Simulate Preloader typing manually for simplicity in this artifact
    const textElement = document.getElementById('preloader-text');
    let step = 0;
    const steps = [
        "> CONNECTING TO DATABASE...",
        "> LOADING JAVA MODULES...",
        "> INITIALIZING CREATIVE ENGINE...",
        "> ACCESS GRANTED."
    ];

    const typeWriter = () => {
        if (step < steps.length) {
            textElement.textContent = steps[step];
            step++;
            setTimeout(typeWriter, 800);
        } else {
            // Finish
            gsap.to('.preloader', {
                yPercent: -100,
                duration: 1.5,
                ease: 'power4.inOut',
                delay: 0.5,
                onComplete: () => {
                    initImageTrail();
                    initHero();
                    initAbout();
                    initSkills();
                    initProjects();
                    initExperience();
                    initSVGStroke();
                    initFooter();

                }
            });
        }
    };

    typeWriter();
});

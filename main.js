import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis (Smooth Scroll)
const initLenis = () => {
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync GSAP with Lenis
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
};

// 1. Preloader
const initPreloader = () => {
    const textElement = document.getElementById('preloader-text');
    const texts = [
        "> CONNECTING TO DATABASE...",
        "> LOADING JAVA MODULES...",
        "> INITIALIZING CREATIVE ENGINE...",
        "> ACCESS GRANTED."
    ];

    let tl = gsap.timeline({
        onComplete: () => {
            // Curtain Reveal
            gsap.to('.preloader', {
                yPercent: -100,
                duration: 1.5,
                ease: 'power4.inOut',
                delay: 0.5
            });
            // Trigger Hero Animation after preloader
            initHero();
        }
    });

    texts.forEach((text, i) => {
        tl.to(textElement, {
            text: text, // Requires TextPlugin usually, but doing Typewriter manually is safer without extra plugin load if not installed.
            duration: 0.1, // fast dummy
            onStart: () => { textElement.textContent = text; }
        }).to({}, { duration: 0.8 }) // wait
    });
};

// 2. Hero Animation
const initHero = () => {
    // Split Text
    const title = new SplitType('.hero__title', { types: 'chars' });

    const tl = gsap.timeline();

    tl.from(title.chars, {
        yPercent: 100,
        opacity: 0,
        stagger: 0.05,
        duration: 1,
        ease: 'power4.out'
    });

    tl.from('.hero__subtitle', {
        y: 20,
        opacity: 0,
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
    const text = btn.querySelector('.magnetic-btn__text');

    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3 });
        gsap.to(text, { x: x * 0.1, y: y * 0.1, duration: 0.3 });
    });

    btn.addEventListener('mouseleave', () => {
        gsap.to([btn, text], { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.3)' });
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
                    initHero();
                    initAbout();
                    initSkills();
                    initProjects();
                    initExperience();
                    initFooter();
                }
            });
        }
    };

    typeWriter();
});

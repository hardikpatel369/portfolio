/**
 * Portfolio Configuration
 * Centralized configuration for magic numbers and animation parameters
 */

export const CONFIG = {
    /**
     * Image Trail Effect Settings
     */
    imageTrail: {
        /** Distance in pixels mouse must move before showing next image */
        threshold: 80,
        /** Random rotation range for images (degrees) */
        rotationRange: [-15, 15],
    },

    /**
     * Project Cards Stack Effect
     */
    projects: {
        /** Base scale for stacked cards */
        baseScale: 0.9,
        /** Scale increment per card in stack */
        scaleStep: 0.05,
        /** Sticky top position (vh) */
        stickyTop: '15%',
    },

    /**
     * About Section Horizontal Scroll
     */
    about: {
        /** Total scroll distance for horizontal section (pixels) */
        scrollDistance: 3000,
        /** Number of panels */
        panelCount: 3,
    },

    /**
     * Animation Timing
     */
    animations: {
        /** Preloader step duration (ms) */
        preloaderStepDelay: 800,
        /** Lenis smooth scroll duration */
        smoothScrollDuration: 1.2,
    },

    /**
     * Spotlight CTA ("BUILD" stack whose "I" becomes the contact link)
     */
    spotlight: {
        /** Text revealed inside the dropped "I" */
        label: 'Contact Me',
        /** Where the "Contact Me" bar goes (pre-filled email, formerly "Initiate Contact") */
        href: "mailto:patelhardik94271@gmail.com?subject=Let%27s%20Connect%20-%20Portfolio%20Inquiry&body=Hi%20Hardik%2C%0A%0AI%20visited%20your%20portfolio%20and%20I%27m%20impressed%20with%20your%20work.%20I%27d%20love%20to%20discuss%20a%20potential%20collaboration.%0A%0ABest%20regards%2C%0A",
        /** Gap between the bar and the contact icons below it (px) */
        linksGap: 32,
        /** Space kept free under the contact icons, above the copyright line (px) */
        linksBottomGap: 48,
        /** Total header copies, including the front one */
        layers: 6,
        /** Each layer further forward ends this much smaller */
        scaleStep: 0.075,
        /** Pinned scroll length, as a fraction of viewport height */
        scrollLength: 1.5,
        /** Touch/phone (no pin): finish this many px before the page bottom (address-bar slack) */
        touchEndOffset: 120,
        /** Touch/phone: where the whole group sits in the section (0 = top, 0.5 = centred) */
        compactTopRatio: 0.4,
        /** Touch/phone: seconds the animation takes to catch up to the finger (smooths flings) */
        touchScrub: 0.5,
        /** Scroll progress where the label scrambles in */
        revealAt: 0.75,
        /** Width of the finished "I" bar on screen: vw fraction, clamped (px) */
        barWidth: { vw: 0.7, min: 240, max: 340 },
        /** Minimum space between the "BUILD" word and the bar (px) */
        barTopGap: 48,
    },

    /**
     * Experience Timeline
     */
    experience: {
        /** Line stroke dashoffset for animation */
        strokeDashoffset: 1000,
    },
};

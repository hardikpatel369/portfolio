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
     * Experience Timeline
     */
    experience: {
        /** Line stroke dashoffset for animation */
        strokeDashoffset: 1000,
    },
};

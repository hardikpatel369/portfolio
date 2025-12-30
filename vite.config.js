import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        // Minification
        minify: 'terser',
        cssMinify: true,

        // Source maps for debugging
        sourcemap: false,

        // Chunk splitting for better caching
        rollupOptions: {
            output: {
                manualChunks: {
                    // Separate vendor chunks for better caching
                    vendor: ['gsap', 'gsap/ScrollTrigger'],
                    smoothScroll: ['lenis'],
                },
            },
        },

        // Target modern browsers
        target: 'es2020',
    },

    // Development server
    server: {
        port: 3000,
        open: true,
    },

    // Preview server (production build preview)
    preview: {
        port: 4173,
    },
});

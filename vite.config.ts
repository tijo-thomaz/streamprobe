import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
    plugins: [react()],
    css: {
        postcss: {
            plugins: [tailwindcss, autoprefixer],
        },
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                popup: resolve(__dirname, 'src/popup/index.html'),
                videoDetector: resolve(__dirname, 'src/content/videoDetector.ts'),
                background: resolve(__dirname, 'src/background.ts')
            },
            output: {
                entryFileNames: (chunkInfo) => {
                    if (chunkInfo.name === 'videoDetector') {
                        return 'content/videoDetector.js';
                    }
                    if (chunkInfo.name === 'background') {
                        return 'background.js';
                    }
                    return 'assets/[name]-[hash].js';
                },
                assetFileNames: 'assets/[name]-[hash].[ext]'
            }
        },
        assetsDir: 'assets',
        emptyOutDir: true,
        sourcemap: false,
        assetsInlineLimit: 4096
    },
    server: {
        port: 3000,
        open: '/src/popup/index.html'
    }
}); 
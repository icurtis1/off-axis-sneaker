import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: [
      'lucide-react',
      '@mediapipe/face_mesh',
      '@mediapipe/camera_utils',
      '@mediapipe/drawing_utils'
    ],
  },
  build: {
    rollupOptions: {
      external: [
        '@mediapipe/face_mesh',
        '@mediapipe/camera_utils',
        '@mediapipe/drawing_utils'
      ]
    }
  }
});
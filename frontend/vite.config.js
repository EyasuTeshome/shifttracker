import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // No proxy — set VITE_API_URL env var in Vercel dashboard to point at your Render backend
});

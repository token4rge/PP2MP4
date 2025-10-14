import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Expose the API_KEY to the client-side code.
    // Vite will perform a direct text replacement of `process.env.API_KEY`
    // with the value from the build environment.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  return {
    // GitHub Project Pages: https://<user>.github.io/writing-compiler/
    base: command === 'build' ? '/writing-compiler/' : '/',
    plugins: [react(), tailwindcss()],
  }
})

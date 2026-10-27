import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // <-- Importante per gestire i percorsi

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Scontrino/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // <-- Dice a Vite che "@" corrisponde alla cartella "src"
    },
  },
})

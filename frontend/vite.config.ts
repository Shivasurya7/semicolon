import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const envDir = '..'
const requiredEnv = ['VITE_WARMUP_PROBLEM_SLUG', 'VITE_SUPPORT_EMAIL'] as const

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, 'VITE_')
  const missing = requiredEnv.filter((key) => !env[key]?.trim())
  if (missing.length > 0) {
    throw new Error(`Missing required config: ${missing.join(', ')}. Copy .env.example to .env at the repo root.`)
  }

  return {
    envDir,
    plugins: [react()],
  }
})

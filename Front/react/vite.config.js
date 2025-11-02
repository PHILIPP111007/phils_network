import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

var ReactConfig = {
  babel: {
    plugins: [
      // Add the React Compiler Babel plugin here
      "babel-plugin-react-compiler",
    ],
  },
  jsxRuntime: "automatic", // для React 19
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  root: ".",
  build: {
    outDir: "dist",
    minify: "esbuild",
    target: "esnext",
  },
  define: {
    global: {}
  },
  plugins: [
    react(ReactConfig),
  ],
  // Оптимизации
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
    ],
  },
})
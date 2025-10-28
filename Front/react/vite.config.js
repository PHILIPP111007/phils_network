import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

var ReactConfig = {
  babel: {
    plugins: [
      // Add the React Compiler Babel plugin here
      "babel-plugin-react-compiler",
      // You can also pass options to the compiler if needed
      // ['babel-plugin-react-compiler', { /* compiler options */ }]
    ],
  },
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
  },
  define: {
    global: {}
  },
  plugins: [
    react(ReactConfig),
  ],
});
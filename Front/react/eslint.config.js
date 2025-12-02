import { defineConfig } from "eslint/config"
import globals from "globals"
import js from "@eslint/js"
import pluginReact from "eslint-plugin-react"

export default defineConfig([
  // Базовые правила JavaScript
  js.configs.recommended,
  // Правила React
  pluginReact.configs.flat.recommended,

  {
    files: ["**/*.{js,jsx}"],
    ignores: ["dist", "node_modules"],
    rules: {
      semi: "off",
      "react/react-in-jsx-scope": "off", // Не требует импорт React в каждом файле (React 17+)
      "react/prop-types": "off", // Отключаем проверку prop-types если не используем
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // Включаем поддержку JSX
        },
      },
    },
  },
])
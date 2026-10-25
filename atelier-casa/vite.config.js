import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import adminApi from "./scripts/vite-admin-plugin.mjs";

// L'espace admin n'existe qu'en développement (npm run admin) : il n'est jamais publié avec le site.
// En ligne (GitHub Pages), le site vit dans /atelier-casa/ : gardez le même nom que votre dépôt.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/atelier-casa/" : "/",
  plugins: [react(), adminApi()],
}));

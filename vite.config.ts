import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import { resolve } from "path";

export default defineConfig({
  base: "./",
  plugins: [
    electron({
      entry: "src/main/main.ts",
      vite: {
        build: {
          outDir: "dist",
          rollupOptions: {
            external: ["electron"],
          },
        },
      },
    }),
    renderer(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
});

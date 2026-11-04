import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    outDir: resolve(__dirname, "extension/v3/src"),
    emptyOutDir: false,
    minify: true,
    lib: {
      entry: resolve(__dirname, "src/entry.js"),
      name: "jsonToDomBundle",
      formats: ["es"],
      fileName: () => "jsonToDom.min.js"
    }
  }
});


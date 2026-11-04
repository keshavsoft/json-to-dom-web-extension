import { defineConfig } from "vite";
import { readdirSync, existsSync, copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const latestSrcVersion = readdirSync(resolve(__dirname, "src"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^v\d+$/.test(entry.name))
    .map((entry) => ({ name: entry.name, n: Number(entry.name.slice(1)) }))
    .sort((a, b) => b.n - a.n)[0]?.name;

if (!latestSrcVersion) {
    throw new Error("No src/vN folders found");
}

const entryFile = existsSync(resolve(__dirname, "src", latestSrcVersion, "index.js"))
    ? resolve(__dirname, "src", latestSrcVersion, "index.js")
    : resolve(__dirname, "src", latestSrcVersion, "build/buildSpecElement.js");

export default defineConfig({
    plugins: [
        {
            name: "copy-latest-to-root-dist",
            closeBundle() {
                try {
                    copyFileSync(
                        resolve(__dirname, "docs/dist", latestSrcVersion, "min.js"),
                        resolve(__dirname, "docs/dist", "min.js")
                    );
                } catch (e) {
                    console.warn("Could not copy latest to docs/dist/min.js", e);
                }
            }
        }
    ],
    build: {
        outDir: resolve(__dirname, "docs/dist", latestSrcVersion),
        emptyOutDir: false,
        minify: true,
        lib: {
            entry: entryFile,
            name: "buildSpecElement",
            formats: ["es"],
            fileName: () => "min.js"
        }
    }
});

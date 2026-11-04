import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionsRoot = path.join(__dirname, 'extension');
const docsExtensionDir = path.join(__dirname, 'docs', 'extension');

// Ensure docs/extension output folder exists
if (!fs.existsSync(docsExtensionDir)) {
    fs.mkdirSync(docsExtensionDir, { recursive: true });
}

// 1. Detect latest version folder in extension/ (e.g. v1, v2)
const versionFolders = fs.readdirSync(extensionsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^v\d+$/.test(entry.name))
    .map(entry => ({ name: entry.name, n: Number(entry.name.slice(1)) }))
    .sort((a, b) => b.n - a.n);

if (versionFolders.length === 0) {
    console.error('Error: No version directories (v1, v2...) found in extension/.');
    process.exit(1);
}

const targetVersionFolder = versionFolders[0].name;
const targetDir = path.join(extensionsRoot, targetVersionFolder);
const manifestPath = path.join(targetDir, 'manifest.json');

if (!fs.existsSync(manifestPath)) {
    console.error(`Error: manifest.json not found in extension/${targetVersionFolder}.`);
    process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version;

console.log(`📦 Packaging latest extension (${targetVersionFolder} - v${version})...`);

const zip = new AdmZip();

// Pack manifest
zip.addLocalFile(manifestPath);

// Pack icons, src, and popup (if present)
zip.addLocalFolder(path.join(targetDir, 'icons'), 'icons');
zip.addLocalFolder(path.join(targetDir, 'src'), 'src');
if (fs.existsSync(path.join(targetDir, 'popup'))) {
    zip.addLocalFolder(path.join(targetDir, 'popup'), 'popup');
}

// 2. Direct zip output into docs/extension for public GitHub Pages serving
const zipName = `tag-to-json-extension-v${version}.zip`;
const zipPath = path.join(docsExtensionDir, zipName);

if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
}

zip.writeZip(zipPath);
console.log(`🎉 Success! Extension packaged directly into docs: docs/extension/${zipName}`);

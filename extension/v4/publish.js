import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, 'manifest.json');

if (!fs.existsSync(manifestPath)) {
    console.error('Error: manifest.json not found in extension/v4.');
    process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version;

console.log(`Packaging extension/v4 (v${version}) for Mozilla / Chrome...`);

const zip = new AdmZip();

// Pack manifest
zip.addLocalFile(manifestPath);

// Pack icons, src, and popup
zip.addLocalFolder(path.join(__dirname, 'icons'), 'icons');
zip.addLocalFolder(path.join(__dirname, 'src'), 'src');
zip.addLocalFolder(path.join(__dirname, 'popup'), 'popup');

const zipName = `tag-to-json-extension-v${version}.zip`;
const zipPath = path.join(__dirname, zipName);

if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
}

zip.writeZip(zipPath);
console.log(`🎉 Success! Created extension package: ${zipPath}`);

// Copy package to docs/extension/
const docsExtensionDir = path.join(__dirname, '..', '..', 'docs', 'extension');
if (fs.existsSync(docsExtensionDir)) {
    const docsZipPath = path.join(docsExtensionDir, zipName);
    fs.copyFileSync(zipPath, docsZipPath);
    console.log(`📦 Copied package to docs: ${docsZipPath}`);
}

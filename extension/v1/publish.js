import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, 'manifest.json');

if (!fs.existsSync(manifestPath)) {
    console.error('Error: manifest.json not found in extension/v1.');
    process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version;

console.log(`Packaging extension/v1 (v${version}) for Mozilla / Chrome...`);

const zip = new AdmZip();

// Pack manifest
zip.addLocalFile(manifestPath);

// Pack icons and src
zip.addLocalFolder(path.join(__dirname, 'icons'), 'icons');
zip.addLocalFolder(path.join(__dirname, 'src'), 'src');

const zipName = `tag-to-json-extension-v${version}.zip`;
const zipPath = path.join(__dirname, zipName);

if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
}

zip.writeZip(zipPath);
console.log(`🎉 Success! Created extension package: ${zipPath}`);

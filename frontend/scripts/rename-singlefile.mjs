import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const version = packageJson.version;
const distDir = path.join(__dirname, '..', 'dist-singlefile');
const srcFile = path.join(distDir, 'index.html');
const destFile = path.join(distDir, `freebrowse-${version}.html`);

if (fs.existsSync(srcFile)) {
  fs.renameSync(srcFile, destFile);
  console.log(`Renamed: index.html -> freebrowse-${version}.html`);

  // Clean up extra files copied from public/ for a cleaner single-file distribution
  const filesToRemove = ['favicon.svg', '.placeholder'];
  const dirsToRemove = ['assets'];

  for (const file of filesToRemove) {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Removed: ${file}`);
    }
  }

  for (const dir of dirsToRemove) {
    const dirPath = path.join(distDir, dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true });
      console.log(`Removed: ${dir}/`);
    }
  }
} else {
  console.error('Error: dist-singlefile/index.html not found');
  process.exit(1);
}

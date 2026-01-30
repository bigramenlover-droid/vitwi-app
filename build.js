// Простой build скрипт для Vercel
// Копирует файлы в директорию public для Vercel

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

function copyFile(src, dest) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            copyFile(srcPath, destPath);
        }
    }
}

// Копируем файлы
['index.html', 'styles.css', 'config.js'].forEach(file => {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(publicDir, file);
    if (fs.existsSync(srcPath)) {
        copyFile(srcPath, destPath);
        console.log(`✓ Copied ${file}`);
    }
});

// Копируем директорию src
const srcDir = path.join(__dirname, 'src');
const destSrcDir = path.join(publicDir, 'src');
if (fs.existsSync(srcDir)) {
    copyDir(srcDir, destSrcDir);
    console.log(`✓ Copied directory src/`);
}

// Копируем директорию images (если существует)
const imagesDir = path.join(__dirname, 'images');
const destImagesDir = path.join(publicDir, 'images');
if (fs.existsSync(imagesDir)) {
    copyDir(imagesDir, destImagesDir);
    console.log(`✓ Copied directory images/`);
}

console.log('Build completed successfully!');


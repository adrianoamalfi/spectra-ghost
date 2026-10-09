import { createWriteStream } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = resolve(root, 'spectra.zip');
const output = createWriteStream(outputPath);
const archive = new ZipArchive({ zlib: { level: 9 } });

const completed = new Promise((resolveCompletion, rejectCompletion) => {
    archive.on('warning', rejectCompletion);
    archive.on('error', rejectCompletion);
    output.on('error', rejectCompletion);
    output.on('close', resolveCompletion);
});

archive.pipe(output);
archive.glob('**/*', {
    cwd: root,
    dot: false,
    ignore: [
        'node_modules/**',
        'docs/**',
        'scripts/**',
        '*.md',
        '**/*.md',
        '*.zip',
        '**/*.zip',
        'LICENSE',
        'package-lock.json',
        'routes.example.yaml',
    ],
});
const finalized = archive.finalize();
await Promise.all([finalized, completed]);

console.log(`Created ${outputPath} (${archive.pointer()} bytes)`);

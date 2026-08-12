/**
 * fix-wincodeSign-cache.js
 *
 * Pre-populates the electron-builder winCodeSign cache by extracting
 * the archive ourselves and ignoring the macOS symlink errors
 * (those darwin dylib symlinks are NOT needed on Windows at all).
 *
 * After this runs, electron-builder will find the cache already populated
 * and skip its download/extraction step entirely.
 */

const { execFileSync } = require('child_process');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const os    = require('os');

const WINCODES_URL  = 'https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-2.6.0/winCodeSign-2.6.0.7z';
const CACHE_DIR     = path.join(process.env.LOCALAPPDATA, 'electron-builder', 'Cache', 'winCodeSign', 'winCodeSign-2.6.0');
const TMP_FILE      = path.join(os.tmpdir(), 'winCodeSign-2.6.0.7z');
const SEVENZIP      = path.join(__dirname, 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    // Follow redirects (GitHub releases redirect to S3)
    function get(u) {
      https.get(u, { headers: { 'User-Agent': 'electron-builder-cache-fix' } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
        file.on('error', reject);
      }).on('error', reject);
    }
    get(url);
  });
}

async function main() {
  // 1. Create cache directory
  console.log('📁 Creating cache directory...');
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  // Check if already fully populated
  const windowsDir = path.join(CACHE_DIR, 'windows-10');
  if (fs.existsSync(windowsDir)) {
    console.log('✅ winCodeSign cache already exists — skipping download.');
    return;
  }

  // 2. Download winCodeSign archive (if not already cached)
  if (!fs.existsSync(TMP_FILE)) {
    console.log('⬇️  Downloading winCodeSign-2.6.0.7z (~5.6 MB)...');
    await download(WINCODES_URL, TMP_FILE);
    console.log('✅ Download complete.');
  } else {
    console.log('✅ Archive already downloaded at temp location.');
  }

  // 3. Extract — ignoring symlink errors (those are darwin dylibs, not needed on Windows)
  console.log('📦 Extracting archive (symlink errors for darwin libs are harmless and ignored)...');
  try {
    execFileSync(SEVENZIP, [
      'x',
      TMP_FILE,
      `-o${CACHE_DIR}`,
      '-y',          // yes to all
      '-bd',         // no progress bar
    ], { stdio: 'inherit' });
  } catch (e) {
    // Exit code 2 = "Fatal error" in 7-Zip but only from the darwin symlinks
    // The Windows-critical files are extracted before those errors — continue.
    console.log('⚠️  7-Zip exited with errors (expected: darwin symlinks skipped). Verifying content...');
  }

  // 4. Verify the critical Windows files were extracted
  const signtool = path.join(CACHE_DIR, 'windows-10', 'x64', 'signtool.exe');
  if (fs.existsSync(signtool)) {
    console.log('✅ winCodeSign cache successfully populated!');
    console.log('   ' + signtool);

    // Create placeholder empty files for the darwin symlinks so 7-Zip
    // content verification (if any) doesn't re-trigger extraction
    const darwinLib = path.join(CACHE_DIR, 'darwin', '10.12', 'lib');
    fs.mkdirSync(darwinLib, { recursive: true });
    ['libcrypto.dylib', 'libssl.dylib'].forEach(f => {
      const fp = path.join(darwinLib, f);
      if (!fs.existsSync(fp)) fs.writeFileSync(fp, '');
    });

    console.log('\n🎉 Cache ready. Run  npm run dist  now — it should succeed!');
  } else {
    console.error('❌ Extraction failed — signtool.exe not found. Please enable Developer Mode in Windows Settings and retry.');
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });

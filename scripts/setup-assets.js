const fs = require('fs');
const path = require('path');
const https = require('https');

const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Helper to download a URL or fallback to a generated placeholder
function downloadOrFallback(url, filepath, fallbackGenerator) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(filepath);
    const req = https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`[setup-assets] Successfully downloaded: ${filepath}`);
          resolve(true);
        });
      } else {
        file.close();
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        console.warn(`[setup-assets] HTTP ${response.statusCode} for ${url}, generating fallback...`);
        fallbackGenerator(filepath);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      console.warn(`[setup-assets] Error fetching ${url}: ${err.message}, generating fallback...`);
      fallbackGenerator(filepath);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      console.warn(`[setup-assets] Timeout fetching ${url}, generating fallback...`);
      fallbackGenerator(filepath);
      resolve(false);
    });
  });
}

// Minimal fallback SVG wrapped as webp/png buffer or simple binary placeholder
function generateLogoFallback(filepath) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF2A5F" />
      <stop offset="100%" stop-color="#8A2BE2" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="#0B0F19" />
  <circle cx="256" cy="256" r="180" fill="url(#grad)" opacity="0.15" />
  <polygon points="200,140 360,256 200,372" fill="url(#grad)" />
</svg>`;
  fs.writeFileSync(filepath.replace(/\.png$/, '.svg'), svg);
  // Write a basic 1x1 PNG or SVG copy
  const transparentPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  fs.writeFileSync(filepath, Buffer.from(transparentPngBase64, 'base64'));
  console.log(`[setup-assets] Created logo fallback at ${filepath}`);
}

function generateBannerFallback(filepath) {
  const transparentWebpBase64 = "UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA";
  fs.writeFileSync(filepath, Buffer.from(transparentWebpBase64, 'base64'));
  console.log(`[setup-assets] Created banner fallback at ${filepath}`);
}

async function main() {
  console.log('[setup-assets] Initializing asset setup...');
  
  const logoUrl = 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/play.png';
  const bannerUrl = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80';

  const logoPath = path.join(publicDir, 'logo.png');
  const faviconPath = path.join(publicDir, 'favicon.ico');
  const bannerPath = path.join(publicDir, 'banner-placeholder.webp');

  await downloadOrFallback(logoUrl, logoPath, generateLogoFallback);
  await downloadOrFallback(logoUrl, faviconPath, generateLogoFallback);
  await downloadOrFallback(bannerUrl, bannerPath, generateBannerFallback);

  console.log('[setup-assets] Asset setup completed!');
}

main();

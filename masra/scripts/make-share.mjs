// Turns the single-file build into page content for the hosted share link
// (the host adds its own <html>/<head>/<body> skeleton).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const html = readFileSync('dist-artifact/artifact.html', 'utf8')
const styles = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0])
const scripts = [...html.matchAll(/<script type="module"[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0])
if (!styles.length || !scripts.length) throw new Error('style or script not found in build output')

const out = [
  '<title>مَسْرى | MASRA</title>',
  '<meta name="description" content="عرض استثماري تفاعلي لمنصة سعودية ذكية لحجز وتوجيه رحلات الركاب">',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap">',
  '<style>:root{color-scheme:dark;background:#0b0d0c}html,body{background:#0b0d0c;color:#fff}</style>',
  ...styles,
  '<div id="root" dir="rtl" lang="ar"></div>',
  ...scripts,
].join('\n')

mkdirSync('share', { recursive: true })
writeFileSync('share/masra.html', out)
console.log('share/masra.html', (out.length / 1024).toFixed(0) + ' KB')

// Сайттың файлдарын (bilim-qadam/public) қосымшаның www/ папкасына көшіреді
// және қосымшаға сервер мекенжайын қосады.
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '..', 'bilim-qadam', 'public');
const OUT = path.join(__dirname, '..', 'www');
const API = process.env.BQ_API || 'https://bilim-qadam-xcnr.onrender.com';

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(SRC)) fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));

const indexPath = path.join(OUT, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
const inject = `<script>window.BQ_API = ${JSON.stringify(API)}; window.BQ_APP = true;</script>`;
if (!html.includes('<head>')) throw new Error('index.html has no <head>');
html = html.replace('<head>', '<head>\n' + inject);
// Қосымшада PWA манифесі керек емес
html = html.replace(/<link rel="manifest"[^>]*>\n?/, '');
fs.writeFileSync(indexPath, html);
console.log('www/ ready, API =', API, '| files:', fs.readdirSync(OUT).join(', '));

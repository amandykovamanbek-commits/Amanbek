// node render.cjs [out.pdf]  -> PDF + page previews (PREV dir) + overflow check
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto('file://' + path.join(__dirname, 'guide.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.pdf({ path: path.join(__dirname, process.argv[2] || 'guide.pdf'), width: '1080px', height: '1350px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  const pages = await p.$$('.page');
  for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: path.join(process.env.PREV || __dirname, `p${String(i + 1).padStart(2, '0')}.png`) });
  const ov = await p.evaluate(() => [...document.querySelectorAll('.page')].map((pg, i) => {
    const f = pg.querySelector('footer').getBoundingClientRect().top; let m = 0;
    pg.querySelectorAll(':scope > *:not(footer):not(.glow)').forEach((e) => { m = Math.max(m, e.getBoundingClientRect().bottom); });
    return [i + 1, Math.round(f - m)];
  }));
  console.log('gap to footer per page', JSON.stringify(ov));
  await b.close();
})();

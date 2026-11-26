const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1366, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file:///home/claude/kr-trainer/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload();
  await p.screenshot({ path: '/tmp/r1.png' });
  await p.click('a[href="#opd"]'); await p.waitForTimeout(200); await p.screenshot({ path: '/tmp/r2.png' });
  // full correct opd2
  await p.selectOption('#v-opd2', '5'); await p.click('[data-start=opd2]');
  const v = await p.evaluate(() => { const v = BCOMP.buildVariant(GEN.hash('opd2-v5')); return { rows: v.rows, c: v.options.correct }; });
  for (let i = 0; i < v.rows.length; i++) for (const c of ['IP','CR','AR','DR','SP','BR','AC','NZVC']) await p.fill(`input[data-r="${i}"][data-c="${c}"]`, v.rows[i][c].toLowerCase());
  await p.check(`input[data-f="${v.c}"]`);
  await p.screenshot({ path: '/tmp/r3.png' });
  await p.click('#finishBtn'); await p.click('.dlg .btn.primary');
  console.log('opd2 full score', await p.textContent('.score'));
  await p.screenshot({ path: '/tmp/r4.png', fullPage: true });
  // training mode, partial
  await p.click('#home'); await p.check('#tr-opd2'); await p.selectOption('#v-opd2', '1'); await p.click('[data-start=opd2]');
  await p.fill('input[data-r="0"][data-c="IP"]', '00E'); await p.fill('input[data-r="0"][data-c="AC"]', 'FFFF');
  await p.click('[data-check="0"]'); await p.click('[data-show="1"]');
  await p.screenshot({ path: '/tmp/r5.png' });
  await p.click('#finishBtn'); await p.click('.dlg .btn.primary');
  console.log('train score', await p.textContent('.score'));
  await p.screenshot({ path: '/tmp/r6.png', fullPage: true });
  // regression: opd1 & prog still start
  await p.click('#home'); await p.click('[data-start=opd]'); console.log('opd1 ok', await p.isVisible('#tin'));
  await p.click('#quitBtn'); await p.click('.dlg .btn.danger');
  await p.goto('file:///home/claude/kr-trainer/index.html#prog'); await p.click('[data-start=prog]'); console.log('prog q', await p.locator('.q').count());
  const m = await b.newPage({ viewport: { width: 375, height: 800 } });
  await m.goto('file:///home/claude/kr-trainer/index.html#opd'); await m.click('[data-start=opd2]'); await m.screenshot({ path: '/tmp/r7.png' });
  console.log('mobile width', await m.evaluate(() => document.documentElement.scrollWidth));
  console.log('errors', errs); await b.close();
})();

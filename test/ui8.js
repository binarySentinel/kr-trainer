const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1366, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file:///home/claude/kr-trainer/index.html#opd-2'); await p.evaluate(() => localStorage.clear()); await p.reload();
  console.log('starts:', await p.$$eval('[data-start]', e => e.map(x => x.dataset.start)));
  await p.screenshot({ path: '/tmp/o0.png' });
  await p.selectOption('#v-opd4', '4'); await p.click('[data-start=opd4]');
  const v = await p.evaluate(() => { const t = MC.build(GEN.hash('opd4-v4')); return t.rows; });
  console.log('rows', v.length, 'inputs', await p.locator('.mct input').count());
  await p.screenshot({ path: '/tmp/o1.png' });
  for (let i = 0; i < v.length; i++) for (const c of ['mp','mem','mr','ip','cr','ar','dr','sp','br','ac','nzvc','mp2']) await p.fill(`input[data-i="${i}"][data-c="${c}"]`, v[i][c].toLowerCase());
  console.log(await p.textContent('#progress'));
  await p.click('#finishBtn'); await p.click('.dlg .btn.primary');
  console.log('score', (await p.textContent('.score')).trim());
  await p.screenshot({ path: '/tmp/o2.png', fullPage: true });
  await p.click('#home');
  // training mode
  const tr = await p.locator('#tr-opd4').count(); console.log('train toggle', tr);
  if (tr) { await p.check('#tr-opd4'); await p.click('[data-start=opd4]');
    await p.fill('input[data-i="0"][data-c="mp"]', '01'); await p.click('[data-show="0"]'); await p.click('[data-copy="1"]');
    console.log('copied ip row1:', await p.inputValue('input[data-i="1"][data-c="ip"]'), 'mp:', await p.inputValue('input[data-i="1"][data-c="mp"]'));
    await p.click('[data-check="1"]'); console.log('ok cells', await p.locator('input.ok').count(), 'bad', await p.locator('input.bad').count());
    await p.click('#finishBtn'); await p.click('.dlg .btn.primary'); console.log('train score', (await p.textContent('.score')).trim()); }
  console.log('errors', errs); await b.close();
})();

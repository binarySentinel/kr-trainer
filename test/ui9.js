const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1366, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file:///home/claude/kr-trainer/index.html#opd-2'); await p.evaluate(() => localStorage.clear()); await p.reload();
  console.log('starts:', await p.$$eval('[data-start]', e => e.map(x => x.dataset.start)));
  await p.screenshot({ path: '/tmp/r0.png' });
  for (const [v, mode] of [['6', 'good'], ['9', 'noext'], ['3', 'err']]) {
    await p.selectOption('#v-opd3', v); await p.click('[data-start=opd3]');
    const t = await p.evaluate(v => { const t = RK3.build(GEN.hash('opd3-v' + v)); return { sol: t.solution, type: t.type, op: t.op }; }, v);
    let code = t.sol;
    if (mode === 'noext') code = code.replace(/\n\s+CALL EXT[^\n]*/, '').replace(/BEQ POSV/, 'BR POSV');
    if (mode === 'err') code = code.replace('ST CURL', 'STX CURL');
    await p.fill('#aSrc', code);
    await p.click('#aComp'); console.log(v, t.type, t.op, 'compile:', await p.textContent('#aMsg'));
    if (mode === 'good') {
      for (let k = 0; k < 5; k++) await p.click('#aStep');
      console.log('after 5 steps regs:', (await p.textContent('#aRegs')).replace(/\s+/g, ' '));
      await p.screenshot({ path: '/tmp/r1.png' });
      await p.click('#aRun'); console.log('run:', await p.textContent('#aMsg'));
      await p.screenshot({ path: '/tmp/r2.png' });
    }
    await p.click('#finishBtn'); await p.click('.dlg .btn.primary');
    console.log(mode, 'score', (await p.textContent('.score')).trim(), '|', (await p.textContent('.res-head p:nth-child(3)')).trim());
    if (mode === 'noext') await p.screenshot({ path: '/tmp/r3.png', fullPage: true });
    await p.click('#home');
  }
  console.log('history', await p.evaluate(() => JSON.parse(localStorage.getItem('krt.hist')).map(h => h.course + ' ' + h.score)));
  console.log('errors', errs); await b.close();
})();

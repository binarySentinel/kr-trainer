const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1366, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file:///home/claude/kr-trainer/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload();
  console.log('home meta:', await p.$$eval('.meta', e => e.map(x => x.textContent)));
  await p.goto('file:///home/claude/kr-trainer/index.html#prog');
  console.log('sem1 starts:', await p.$$eval('[data-start]', e => e.map(x => x.dataset.start)));
  await p.click('.tab >> nth=1'); await p.waitForTimeout(200);
  console.log('sem2 starts:', await p.$$eval('[data-start]', e => e.map(x => x.dataset.start)), await p.evaluate(() => location.hash));
  await p.screenshot({ path: '/tmp/k0.png' });
  for (const v of ['2', '17']) {
    await p.selectOption('#v-prog3', v); await p.click('[data-start=prog3]');
    console.log('questions:', await p.locator('.q').count(), '| timer:', await p.textContent('#timer'));
    const qs = await p.evaluate(v => KR3.build(GEN.hash('prog3-v' + v)).map(q => ({ type: q.type, correct: q.correct, answer: q.answer, ci: q.correctIdx })), v);
    for (let i = 0; i < qs.length; i++) { const q = qs[i];
      if (q.type === 'text') await p.fill(`#q${i} .ans`, q.answer);
      else if (q.type === 'single') await p.check(`#q${i} input[value="${q.ci}"]`);
      else if (q.type === 'cats') { for (let k = 0; k < q.correct.length; k++) await p.selectOption(`#q${i} select[data-k="${k}"]`, q.correct[k]); }
      else for (let j = 0; j < q.correct.length; j++) if (q.correct[j]) await p.check(`#q${i} input[value="${j}"]`); }
    if (v === '2') await p.screenshot({ path: '/tmp/k1.png', fullPage: true });
    await p.click('#finishBtn'); await p.click('.dlg .btn.primary');
    console.log('variant', v, 'score:', (await p.textContent('.score')).trim());
    if (v === '2') await p.screenshot({ path: '/tmp/k2.png', fullPage: true });
    await p.click('#home'); console.log('back at', await p.evaluate(() => location.hash));
  }
  await p.selectOption('#v-prog3', '5'); await p.click('[data-start=prog3]'); await p.click('#finishBtn'); await p.click('.dlg .btn.primary');
  console.log('empty score:', (await p.textContent('.score')).trim());
  await p.goto('file:///home/claude/kr-trainer/index.html#opd-2'); await p.waitForTimeout(200);
  console.log('opd sem2 text:', (await p.textContent('main')).slice(0, 200).replace(/\s+/g, ' '));
  console.log('errors', errs); await b.close();
})();

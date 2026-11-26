const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1366, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file:///home/claude/kr-trainer/index.html#prog'); await p.evaluate(() => localStorage.clear()); await p.reload();
  await p.screenshot({ path: '/tmp/m1.png' });
  console.log('slide option present:', await p.locator('#tr-prog2').count());
  for (const v of ['3', '11']) {
    await p.selectOption('#v-prog2', v); await p.click('[data-start=prog2]');
    console.log('questions:', await p.locator('.q').count(), '| timer:', await p.textContent('#timer'));
    const qs = await p.evaluate(v => KR2.build(GEN.hash('prog2-v' + v)).map(q => ({ type: q.type, correct: q.correct, accept: q.accept, answer: q.answer, ci: q.correctIdx })), v);
    for (let i = 0; i < qs.length; i++) { const q = qs[i];
      if (q.type === 'text') await p.fill(`#q${i} .ans`, q.accept ? q.accept[0] : q.answer);
      else if (q.type === 'single') await p.check(`#q${i} input[value="${q.ci}"]`);
      else for (let j = 0; j < q.correct.length; j++) if (q.correct[j]) await p.check(`#q${i} input[value="${j}"]`); }
    if (v === '3') await p.screenshot({ path: '/tmp/m2.png' });
    await p.click('#finishBtn'); await p.click('.dlg .btn.primary');
    console.log('variant', v, 'score:', (await p.textContent('.score')).trim());
    if (v === '3') await p.screenshot({ path: '/tmp/m3.png', fullPage: true });
    await p.click('#home');
  }
  console.log('history:', await p.evaluate(() => JSON.parse(localStorage.getItem('krt.hist')).map(h => h.score)));
  await p.click('[data-start=prog]'); console.log('КР1 still:', await p.locator('.q').count());
  const m = await b.newPage({ viewport: { width: 375, height: 800 } }); await m.goto('file:///home/claude/kr-trainer/index.html#prog'); await m.click('[data-start=prog2]');
  console.log('mobile width', await m.evaluate(() => document.documentElement.scrollWidth));
  console.log('errors', errs); await b.close();
})();

const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1366, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/kr-trainer/index.html#prog'); await p.evaluate(() => localStorage.clear()); await p.reload();
  await p.selectOption('#v-prog2', '2'); await p.click('[data-start=prog2]');
  console.log('LMS mode questions:', await p.locator('.q').count(), '| timer:', await p.textContent('#timer'));
  const qs = await p.evaluate(() => KR2.build(GEN.hash('prog2-v2')).map(q => ({ type: q.type, correct: q.correct, accept: q.accept })));
  for (let i = 0; i < qs.length; i++) { const q = qs[i];
    if (q.type === 'text') await p.fill(`#q${i} .ans`, q.accept[0]);
    else { const idx = q.correct.map((c, j) => c ? j : -1).filter(j => j >= 0); for (const j of (i === 0 ? idx.slice(0, 1) : idx)) await p.check(`#q${i} input[value="${j}"]`); } }
  await p.screenshot({ path: '/tmp/l1.png' });
  await p.click('#finishBtn'); await p.click('.dlg .btn.primary');
  console.log('score:', (await p.textContent('.score')).trim(), '| history:', await p.evaluate(() => JSON.parse(localStorage.getItem('krt.hist'))[0].score));
  console.log('errors', errs); await b.close();
})();

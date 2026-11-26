const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1366, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file:///home/claude/kr-trainer/index.html#prog'); await p.evaluate(() => localStorage.clear()); await p.reload();
  await p.screenshot({ path: '/tmp/k1.png' });
  await p.selectOption('#v-prog2', '4'); await p.click('[data-start=prog2]');
  const qs = await p.evaluate(() => KR2.build(GEN.hash('prog2-v4')).map(q => ({ type: q.type, correct: q.correct, accept: q.accept })));
  for (let i = 0; i < qs.length; i++) {
    if (i === 2) await p.screenshot({ path: '/tmp/k2.png' });
    const q = qs[i];
    if (q.type === 'text') await p.fill('.ans', q.accept[q.accept.length - 1].replace(/;$/, ''));
    else for (let j = 0; j < q.correct.length; j++) if (q.correct[j]) await p.check(`input[data-q="${i}"][value="${j}"]`);
    await p.click('#nextQ');
  }
  console.log('slide full score:', await p.textContent('.score'));
  await p.screenshot({ path: '/tmp/k3.png', fullPage: true });
  // auto-advance: start, then pretend 100s passed
  await p.click('#home'); await p.selectOption('#v-prog2', '9'); await p.click('[data-start=prog2]');
  await p.evaluate(() => { const e = JSON.parse(localStorage.getItem('krt.exam')); e.qStart -= 100000; e.startedAt -= 100000; localStorage.setItem('krt.exam', JSON.stringify(e)); });
  await p.reload(); await p.waitForTimeout(800);
  console.log('after 100s on q:', await p.evaluate(() => JSON.parse(localStorage.getItem('krt.exam')).qi));
  await p.evaluate(() => { const e = JSON.parse(localStorage.getItem('krt.exam')); e.qStart -= 2000000; e.startedAt -= 2000000; localStorage.setItem('krt.exam', JSON.stringify(e)); });
  await p.reload(); await p.waitForTimeout(800);
  console.log('after all time:', await p.textContent('.score'));
  // training
  await p.click('#home'); await p.check('#tr-prog2'); await p.click('[data-start=prog2]');
  console.log('training questions on page:', await p.locator('.q').count());
  await p.screenshot({ path: '/tmp/k4.png' });
  await p.click('#quitBtn'); await p.click('.dlg .btn.danger');
  // regressions
  await p.click('[data-start=prog]'); console.log('prog1 q:', await p.locator('.q').count()); await p.click('#quitBtn'); await p.click('.dlg .btn.danger');
  await p.goto('file:///home/claude/kr-trainer/index.html#opd'); await p.click('[data-start=opd2]'); console.log('opd2 rows:', await p.locator('tr.cmd').count());
  const m = await b.newPage({ viewport: { width: 375, height: 800 } });
  await m.goto('file:///home/claude/kr-trainer/index.html#prog'); await m.click('[data-start=prog2]'); await m.screenshot({ path: '/tmp/k5.png' });
  console.log('mobile width', await m.evaluate(() => document.documentElement.scrollWidth));
  console.log('errors', errs); await b.close();
})();

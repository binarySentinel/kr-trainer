// reference solutions: JS (assembler + microcode machine) vs expected values vs bcomp-ng.jar
const fs = require('fs'), { execFileSync } = require('child_process');
for (const f of ['mc.js', 'asm.js', 'rk3.js']) eval(fs.readFileSync(__dirname + '/../src/' + f, 'utf8'));
const N = +(process.argv[2] || 300), H = (v, w) => v.toString(16).toUpperCase().padStart(w, '0');
const blocks = [], meta = []; let jsFail = 0; const types = {};
for (let i = 0; i < N; i++) {
  const t = RK3.build(9000 + i); types[t.type + (t.op || '')] = (types[t.type + (t.op || '')] || 0) + 1;
  const c = RK3.check(t, t.solution);
  if (c.error || c.passed !== 3) { if (jsFail++ < 3) console.log('JS FAIL', i, t.type, t.op, t.sel, c.error || c.tests.map(x => [x.ok, x.halted, x.got.map(v => H(v, 4)).join(' ')])); }
  t.tests.forEach((ts, k) => {
    const lo = 0x400, hi = 0x400 + ts.expect.length - 1;
    blocks.push(t.solution + '\n@@DATA ' + ts.data.map(([a, v]) => H(a, 3) + ':' + H(v, 4)).join(',') + '\n@@RUN ' + H(lo, 3) + ' ' + H(hi, 3));
    meta.push({ i, k, t, ts, c });
  });
}
const out = execFileSync('java', ['-cp', '/tmp/jar/bcomp.jar:/tmp/mc', 'AsmRun'], { input: blocks.join('\n=====\n') + '\n', maxBuffer: 1 << 28, stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim().split('\n');
let jarBad = 0, cmdBad = 0;
meta.forEach((m, j) => {
  const o = out[j]; const mm = / H=(-?\d+) M=(.*)$/.exec(o || '');
  const exp = m.ts.expect.map(([, v]) => H(v, 4)).join(',');
  if (!mm || mm[2] !== exp) { if (jarBad++ < 3) console.log('JAR DIFF', m.i, m.k, m.t.type, '\n exp', exp, '\n jar', o && o.slice(-200)); }
  else if (+mm[1] !== m.c.tests[m.k].cmds) cmdBad++;
});
console.log('tasks', N, types, 'js failures', jsFail, 'jar mismatches', jarBad, 'command-count differences', cmdBad);

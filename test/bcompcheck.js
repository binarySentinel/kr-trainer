// Compare the JS model with real bcomp-ng.jar (harness in /tmp/jh)
const B = require('../src/bcomp.js'); const { execSync } = require('child_process'); const fs = require('fs');
const hx = B.hx;
function rnd(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
const cases = [];
// 1) generated variants
for (let s = 1; s <= 600; s++) {
  const v = B.buildVariant(s * 2654435761 >>> 0);
  const words = []; const n = 3 + v.prog.length; for (let i = 0; i < n; i++) words.push(hx(v.memInit[v.base + i] || 0, 4));
  cases.push({ kind: 'gen', base: v.base, start: v.start, words, exp: v.rows, final: hx(v.final, 4) });
}
// 2) random programs with wider instruction set
const ops = ['CLA','NOT','CLC','CMC','ROL','ROR','ASL','ASR','INC','DEC','NEG','ADD','SUB','AND','OR','ADC','CMP','LD'];
for (let s = 1; s <= 600; s++) {
  const r = rnd(s * 7919 + 13), base = 0x00A, start = 0x00D, prog = [];
  const n = 4 + Math.floor(r() * 8);
  for (let i = 0; i < n; i++) { const mn = ops[Math.floor(r() * ops.length)]; prog.push({ mn, arg: ['ADD','SUB','AND','OR','ADC','CMP','LD'].includes(mn) ? base + Math.floor(r() * 3) : null }); }
  prog.push({ mn: 'ST', arg: base + 2 }); prog.push({ mn: 'HLT' });
  const mem = {}; [0,1,2].forEach(k => mem[base + k] = Math.floor(r() * 65536));
  // edge values sometimes
  if (r() < 0.3) mem[base] = [0, 0x7FFF, 0x8000, 0xFFFF, 1][Math.floor(r() * 5)];
  prog.forEach((p, i) => mem[start + i] = B.encode(p.mn, p.arg));
  const words = []; for (let i = 0; i < 3 + prog.length; i++) words.push(hx(mem[base + i], 4));
  const st = { mem, IP: start, AC: 0, N: 0, Z: 1, V: 0, C: 0, SP: 0 };
  const rows = prog.map(() => { const x = B.step(st); return [hx(x.IP,3),hx(x.CR,4),hx(x.AR,3),hx(x.DR,4),hx(x.SP,3),hx(x.BR,4),hx(x.AC,4),x.NZVC].join(' '); });
  cases.push({ kind: 'rand', base, start, words, expS: rows, prog, final: hx(mem[base + 2], 4) });
}
const input = cases.map(c => `base=${hx(c.base,3)} start=${hx(c.start,3)} steps=${(c.exp||c.expS).length} words=${c.words.join(',')}`).join('\n') + '\n';
const out = execSync('cd /tmp/jh && java -cp /tmp/jar/bcomp.jar:. Harness 2>/dev/null', { input, maxBuffer: 1 << 26 }).toString().trim().split('\n');
let bad = 0, cells = 0; const byOp = {};
cases.forEach((c, i) => {
  const [regs, mem] = out[i].split('|'); const got = regs.split(';').filter(Boolean);
  const exp = c.exp ? c.exp.map(r => [r.IP,r.CR,r.AR,r.DR,r.SP,r.BR,r.AC,r.NZVC].join(' ')) : c.expS;
  got.forEach((g, k) => { cells++; if (g !== exp[k]) { bad++; const op = c.prog ? c.prog[k].mn : 'gen'; byOp[op] = (byOp[op]||0)+1; if (bad < 8 && c.prog && ['OR','AND'].includes(c.prog[k].mn)) console.log(c.kind, 'row', k, c.prog ? c.prog[k].mn : '', '\n jar:', g, '\n js :', exp[k]); } });
  const fm = mem.split(',')[2]; if (fm !== c.final) { bad++; console.log('final mem mismatch', fm, c.final); }
});
console.log('programs', cases.length, 'rows', cells, 'mismatches', bad, byOp);

// compares the JS microcode emulator with bcomp-ng.jar (tact mode)
const fs = require('fs'), { execFileSync } = require('child_process');
eval(fs.readFileSync(__dirname + '/../src/mc.js', 'utf8'));
const H = MC.hx, lines = [], tasks = [];
for (let i = 0; i < 3000; i++) { const t = MC.build(1000 + i); tasks.push(t); }
const r = MC.mk(77), ri = n => Math.floor(r() * n);
for (let i = 0; i < 3000; i++) {
  let cmd; do { cmd = ri(0x10000); } while ((cmd >> 12) === 1 || cmd === 0x0100 || (cmd & 0xF000) === 0x9000 && false);
  const ip = 0x100 + ri(0x500), mem = [[ip, cmd]], used = new Set([ip]);
  const add = a => { a &= 0x7FF; if (!used.has(a)) { used.add(a); mem.push([a, ri(0x10000)]); } };
  const off = ((cmd & 0xFF) ^ 0x80) - 0x80; add(ip + 1 + off);
  for (let k = 0; k < 30; k++) add(ri(0x800));
  const sp = ri(0x800); add(sp); add(sp + 1); add(sp - 1);
  const t = { ip, cr: ri(0x10000), ar: ri(0x800), dr: ri(0x10000), sp, br: ri(0x10000), ac: ri(0x10000), ps: ri(0x100) & ~0x80 & ~0x10, mem, watch: mem[1][0] }; if (t.watch === ip) t.watch = mem[2][0];
  // make pointer-based modes point somewhere filled
  mem[1][1] = mem[2 + ri(20)][0] | (r() < 0.5 ? 0 : 0);
  tasks.push(t);
}
for (const t of tasks) { const cmdp = t.mem.find(([a]) => a === t.ip), wp = t.mem.find(([a]) => a === t.watch) || cmdp, rest = t.mem.filter(x => x !== cmdp && x !== wp);
  lines.push([t.ip, t.cr, t.ar, t.dr, t.sp, t.br, t.ac, t.ps].map((v, i) => H(v, i === 7 ? 3 : 4)).join(' ') + ' ' + [cmdp, wp, ...rest].map(([a, v]) => H(a, 3) + ' ' + H(v, 4)).join(' ')); }
// MT watches the 2nd pair: reorder so watch pair comes right after the command
const out = execFileSync('java', ['-cp', '/tmp/jar/bcomp.jar:/tmp/mc', 'MT'], { input: lines.join('\n') + '\n', maxBuffer: 1 << 28, stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim().split('\n');
let bad = 0, rows = 0; const seen = new Set();
let skipped = 0;
tasks.forEach((t, i) => {
  if (!t.rows) t.rows = MC.trace(t);
  if (t.rows.some(r => r.mp === 'E0')) { skipped++; return; }
  const js = t.rows.map(r => MC.COLS.map(c => r[c]).join(' ')).join(';') + ';';
  rows += t.rows.length; t.rows.forEach(r => seen.add(r.mp));
  if (js !== out[i]) { if (bad++ < 3) { console.log('MISMATCH', lines[i]); const a = js.split(';'), b = out[i].split(';'); for (let k = 0; k < Math.max(a.length, b.length); k++) if (a[k] !== b[k]) { console.log(' js ', a[k]); console.log(' jar', b[k]); break; } } }
});
console.log('tasks', tasks.length, 'rows', rows, 'distinct MC addresses', seen.size, 'mismatches', bad, 'skipped reserved', skipped);

// random programs: JS assembler vs bcomp-ng.jar assembler
const fs = require('fs'), { execFileSync } = require('child_process');
eval(fs.readFileSync(__dirname + '/../src/mc.js', 'utf8')); eval(fs.readFileSync(__dirname + '/../src/asm.js', 'utf8'));
const r = MC.mk(+(process.argv[2] || 5)), ri = n => Math.floor(r() * n), pick = a => a[ri(a.length)];
const LB = ['A', 'B', 'X1', 'cur', 'ЦИКЛ', 'PTR', 'START'];
const ops = ['AND', 'OR', 'ADD', 'ADC', 'SUB', 'CMP', 'LOOP', 'LD', 'SWAM', 'JUMP', 'CALL', 'ST', 'ld', 'Add'];
const na = ['NOP', 'HLT', 'CLA', 'NOT', 'CLC', 'CMC', 'ROL', 'ROR', 'ASL', 'ASR', 'SXTB', 'SWAB', 'INC', 'DEC', 'NEG', 'POP', 'POPF', 'RET', 'IRET', 'PUSH', 'PUSHF', 'SWAP', 'DI', 'EI', 'hlt'];
const br = ['BEQ', 'BNE', 'BMI', 'BPL', 'BCS', 'BCC', 'BVS', 'BVC', 'BLT', 'BGE', 'BR', 'BHIS', 'BLO'];
const nums = () => r() < 0.85 ? pick(['0', '1', '-1', '5', '127', '-128', '0x10', '0XFF', '0x7F', '3', '-0x5']) : pick(['128', '-129', '255', '256', '0x7FF', '0x800', '2047', '+3', '1a', '0x']);
function operand() {
  const l = pick(LB);
  return pick(['#' + nums(), '# ' + nums(), '(' + l + ')', '(' + l + ')+', '-(' + l + ')', '( ' + l + ' ) +', '&' + nums(), '$' + l, '$ ' + l, nums(), l, l, l, l, l].concat(r() < 0.1 ? ['(0x30)', 'Q', '#' + l] : []));
}
function line() {
  const k = ri(20);
  let s;
  if (k < 7) s = pick(ops) + ' ' + operand();
  else if (k < 10) s = pick(na) + (r() < 0.05 ? ' 1' : '');
  else if (k < 12) s = pick(br) + ' ' + (r() < 0.9 ? pick(LB) : nums());
  else if (k < 15) s = 'WORD ' + Array.from({ length: 1 + ri(3) }, () => pick([nums(), '?', '$' + pick(LB), '$' + pick(LB), (1 + ri(4)) + ' DUP (' + pick([nums(), '?']) + ')'].concat(r() < 0.1 ? [pick(LB), '2 DUP ()'] : []))).join(', ');
  else if (k < 16) s = 'ORG ' + pick(['0x10', '0x20', '0x80', '0x40', '0x30', '16', '0x7FE', '0x900']);
  else if (k < 17) s = pick(['IN', 'OUT', 'INT']) + ' ' + nums();
  else if (k < 18) s = '';
  else if (k < 19) s = '; comment';
  else s = 'END';
  if (r() < 0.1) s += ' ; c';
  return s;
}
const progs = [];
for (let i = 0; i < +(process.argv[3] || 3000); i++) {
  const n = 2 + ri(14), ls = []; for (let k = 0; k < n; k++) ls.push(line());
  const free = ls.map((s, k) => k).filter(k => !/^(ORG|END)/.test(ls[k]));
  for (const lb of LB) { if (r() < 0.04 || !free.length) continue; const k = free.splice(ri(free.length), 1)[0]; ls[k] = lb + ': ' + ls[k]; }
  progs.push(ls.join('\n'));
}
const out = execFileSync('java', ['-cp', '/tmp/jar/bcomp.jar:/tmp/mc', 'AsmRun'], { input: progs.join('\n=====\n') + '\n', maxBuffer: 1 << 28, stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim().split('\n');
const H = (v, w) => v.toString(16).toUpperCase().padStart(w, '0');
let bad = 0, ok = 0, errs = 0;
progs.forEach((p, i) => {
  let js;
  try { const a = ASM.assemble(p); js = 'S=' + H(a.start, 3) + ' W=' + [...a.mem.entries()].sort((x, y) => x[0] - y[0]).map(([k, v]) => H(k, 3) + ':' + H(v, 4) + ',').join(''); } catch (e) { if (!(e instanceof ASM.AsmError)) throw e; js = 'ERR'; }
  const jar = out[i] === 'ERR' ? 'ERR' : out[i].replace(/ L=\w+/, '');
  if (js === 'ERR' && jar === 'ERR') errs++; else if (js === jar) ok++;
  else if (bad++ < 6) console.log('---\n' + p + '\n js :' + js + '\n jar:' + jar);
});
console.log('ok', ok, 'both-error', errs, 'mismatch', bad);

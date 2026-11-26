// reference solution for ОПД РК1 through the shell model: every variant must grade 100%
const fs = require('fs');
eval(fs.readFileSync(__dirname + '/../src/gen.js', 'utf8') + fs.readFileSync(__dirname + '/../src/shell.js', 'utf8'));
let bad = 0, empt = 0;
for (let v = 1; v <= 500; v++) {
  const d = GEN.buildOpd(GEN.hash('opd-v' + v)), sh = new SHELL.Shell(SHELL.newState());
  for (const line of GEN.refSolution(d.nodes).split('\n')) { if (!line.trim() || line.startsWith('#')) continue; const r = sh.run(line.replace(/\s+#.*$/, '')); const e = r.filter(x => x.k === 'err'); if (e.length && bad++ < 3) console.log(v, line, e); }
  const items = GEN.gradeTree(p => sh.lookup(p), d.nodes), nb = items.filter(i => !i.ok);
  if (nb.length && bad++ < 5) console.log('variant', v, nb.slice(0, 3));
  empt += d.nodes.filter(n => n.type === 'd' && !d.nodes.some(x => x.path.startsWith(n.path + '/'))).length;
}
console.log('variants 500, avg empty dirs', (empt / 500).toFixed(2), 'problems', bad);

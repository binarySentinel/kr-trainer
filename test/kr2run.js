// Compile and run every generated КР2 code question; compare output with the site's answer
const K = require('../src/kr2code.js'), K2 = require('../src/kr2.js'); const fs = require('fs'); const { execSync } = require('child_process');
const root = '/tmp/k2run'; fs.rmSync(root, { recursive: true, force: true }); fs.mkdirSync(root);
const cases = []; const seen = new Set();
for (let s = 1; s <= 400; s++) {
  const R = K2.mk(s * 2654435761 >>> 0);
  for (const g of K.GENS) { const qq = g(R); if (seen.has(qq.code)) continue; seen.add(qq.code); cases.push({ g: g.name, ...qq }); }
}
cases.forEach((c, i) => { fs.mkdirSync(root + '/p' + i); fs.writeFileSync(root + '/p' + i + '/Main.java', 'package p' + i + ';\n' + c.code); });
fs.writeFileSync(root + '/Run.java', `import java.io.*;
public class Run { public static void main(String[] a) throws Exception {
  PrintStream orig = System.out; int n = Integer.parseInt(a[0]);
  for (int i = 0; i < n; i++) { ByteArrayOutputStream b = new ByteArrayOutputStream(); System.setOut(new PrintStream(b, true, "UTF-8"));
    try { Class.forName("p" + i + ".Main").getMethod("main", String[].class).invoke(null, (Object) new String[0]); } catch (Throwable t) { System.out.print("!!" + t.getCause()); }
    System.setOut(orig); orig.println(b.toString("UTF-8").trim().replace("\\n", "\\\\n")); } } }`);
const files = cases.map((c, i) => 'p' + i + '/Main.java').join(' ');
try { execSync('cd ' + root + ' && javac -nowarn -d out Run.java ' + files + ' 2>&1 | grep -v "^Note\\|Picked" | head -20', { stdio: 'inherit', maxBuffer: 1 << 26 }); } catch (e) {}
const out = execSync('cd ' + root + ' && java -cp out Run ' + cases.length + ' 2>/dev/null', { maxBuffer: 1 << 26 }).toString().split('\n');
let bad = 0; const per = {};
cases.forEach((c, i) => { per[c.g] = (per[c.g] || 0) + 1; if ((out[i] || '').trim() !== c.answer) { bad++; if (bad < 8) console.log('MISMATCH', c.g, JSON.stringify(out[i]), 'vs', JSON.stringify(c.answer), '\n' + c.code); } });
console.log('distinct programs', cases.length, per, 'mismatches', bad);
// compile questions
let cbad = 0;
K.COMPILE.forEach((t, i) => { const d = root + '/c' + i; fs.mkdirSync(d); fs.writeFileSync(d + '/Main.java', K.program(t.decls, [], t.body));
  let ok; try { execSync('cd ' + d + ' && javac -nowarn Main.java', { stdio: 'pipe' }); ok = true; } catch (e) { ok = false; }
  if (ok !== t.ok) { cbad++; console.log('COMPILE MISMATCH', i, 'expected', t.ok, '\n' + K.program(t.decls, [], t.body)); } });
console.log('compile questions', K.COMPILE.length, 'mismatches', cbad);

// Verify KR2 code with javac: compiles where it should, fails where it should
const K = require('../src/kr2.js'); const fs = require('fs'); const { execSync } = require('child_process');
let n = 0, bad = 0;
function compiles(files) {
  const dir = '/tmp/k2/' + (n++); fs.mkdirSync(dir, { recursive: true });
  for (const [name, src] of Object.entries(files)) fs.writeFileSync(dir + '/' + name + '.java', src);
  try { execSync('cd ' + dir + ' && javac -nowarn *.java 2>&1', { stdio: 'pipe' }); return true; } catch (e) { return false; }
}
const expect = (ok, want, what) => { if (ok !== want) { bad++; console.log('FAIL', what, 'expected', want ? 'compile' : 'error'); } };
const seen = new Set();
for (let s = 1; s <= 300; s++) {
  const R = K.mk(s * 7919);
  // overrides
  const o = K.genOverride(R); if (!seen.has(o.code)) { seen.add(o.code); expect(compiles({ MyClass: o.code }), true, 'override\n' + o.code); }
  // inner
  const q = K.genInner(R);
  for (const a of q.accept) { const key = q.code + a; if (seen.has(key)) continue; seen.add(key);
    expect(compiles({ [q.javac.cls]: q.code.replace(q.javac.slot, '            ' + a) }), true, 'inner accept ' + a + '\n' + q.code); }
  // wrong answers that must NOT compile
  const m = q.answer.match(/(\w+)\(\);$/)[1], O = q.javac.cls;
  if (/static class/.test(q.code)) { for (const w of [m + '();', O + '.this.' + m + '();']) { const key = q.code + w; if (seen.has(key)) continue; seen.add(key); expect(compiles({ [O]: q.code.replace(q.javac.slot, '            ' + w) }), false, 'static nested wrong ' + w); } }
  if (/public class \w+ \{\n\n\s+public void/.test(q.code.split('\n').slice(4).join('\n')) && !/static/.test(q.code)) { const w = 'this.' + m + '();'; const key = q.code + w; if (!seen.has(key)) { seen.add(key); expect(compiles({ [O]: q.code.replace(q.javac.slot, '            ' + w) }), false, 'inner this wrong'); } }
  // interface
  const f = K.genIface(R); const fk = f.code; if (!seen.has(fk)) { seen.add(fk);
    if (f.javac.broken) expect(compiles({ [f.javac.cls]: f.javac.broken }), false, 'iface broken\n' + f.javac.broken);
    expect(compiles({ [f.javac.cls]: f.javac.ok }), true, 'iface fixed\n' + f.javac.ok); }
}
// abstract types: every accepted answer compiles, Object (or a too-abstract type) does not
for (const t of K.ABSTR) {
  const cls = t.code[0].split(' ')[1], src = t.code.join('\n');
  for (const a of t.ans) expect(compiles({ [cls]: src.replace(/\bX\b/g, a) }), true, 'abstract ' + a + '\n' + src);
  if (t.ans[0] !== 'Object') expect(compiles({ [cls]: src.replace(/\bX\b/g, 'Object') }), false, 'abstract Object should fail ' + cls);
}
// SOLID snippets that are real Java (S uses "..." pseudo-bodies on purpose)
const stubs = { Wheel: 'class Wheel {}', MySqlDatabase: 'class MySqlDatabase {}', EmailSender: 'class EmailSender {}', PowerSwitch: 'class PowerSwitch {}', PdfPrinter: 'class PdfPrinter {}', LithiumBattery: 'class LithiumBattery {}',
  Shape: 'interface Shape {}', Circle: 'class Circle implements Shape { double r; }', Square: 'class Square implements Shape { double a; }', Animal: 'interface Animal {}', Cat: 'class Cat implements Animal {}', Dog: 'class Dog implements Animal {}',
  Bird: 'class Bird { public void fly() {} }', Vehicle: 'class Vehicle { public void refuel() {} }', Account: 'class Account { public void withdraw() {} }' };
for (let s = 1; s <= 200; s++) {
  const R = K.mk(s * 104729);
  for (const k of ['I', 'D', 'SO', 'O', 'L']) {
    const t = K.SOLID_T[k](R); if (seen.has(t.code)) continue; seen.add(t.code);
    const name = t.code.match(/(?:class|interface) (\w+)/)[1]; const files = { [name]: t.code };
    for (const [sn, ss] of Object.entries(stubs)) if (sn !== name && new RegExp('\\b' + sn + '\\b').test(t.code)) files[sn] = ss;
    expect(compiles(files), true, 'solid ' + k + '\n' + t.code);
  }
}
console.log('javac runs', n, 'failures', bad);
// the distractor "protected void => private void" must still fail
{ const ok = (()=>{ const fs=require('fs'),{execSync}=require('child_process'); fs.mkdirSync('/tmp/k2/pv',{recursive:true}); fs.writeFileSync('/tmp/k2/pv/Greeter.java','interface Greeter {\n    private void hello();\n}'); try{execSync('cd /tmp/k2/pv && javac Greeter.java',{stdio:'pipe'});return true}catch(e){return false} })(); console.log('private-without-body distractor fails to compile:', !ok); }

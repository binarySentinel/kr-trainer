const K = require('../src/kr3.js'); const fs = require('fs'); const { execSync } = require('child_process');
const root = '/tmp/k3run'; fs.rmSync(root, { recursive: true, force: true }); fs.mkdirSync(root);
const coll = [], strm = [], seen = new Set();
for (let s = 1; s <= 1500; s++) {
  const R = K.mk(s * 2654435761 >>> 0);
  const c = K.GENS[1](R); if (!seen.has(c.code)) { seen.add(c.code); coll.push(c); }
  const t = K.GENS[7](R); if (!seen.has(t.code + t.prompt)) { seen.add(t.code + t.prompt); strm.push(t); }
}
const ops = `static String del_even(String s){StringBuilder b=new StringBuilder();for(int i=0;i<s.length();i++)if(i%2==1)b.append(s.charAt(i));return b.toString();}
static String del_odd(String s){StringBuilder b=new StringBuilder();for(int i=0;i<s.length();i++)if(i%2==0)b.append(s.charAt(i));return b.toString();}
static String del_penult(String s){return s.substring(0,s.length()-2)+s.charAt(s.length()-1);}
static String del_first(String s){return s.substring(1);}
static String dup3(String s){return s.substring(0,3)+s.charAt(2)+s.substring(3);}
static String dup1(String s){return s.charAt(0)+s;}
static String duplast(String s){return s+s.charAt(s.length()-1);}
static String swap13(String s){return ""+s.charAt(2)+s.charAt(1)+s.charAt(0)+s.substring(3);}
static String swap1n(String s){return s.charAt(s.length()-1)+s.substring(1,s.length()-1)+s.charAt(0);}`;
let src = 'import java.util.*; import java.util.stream.*;\n@SuppressWarnings("unchecked") public class T {\n' + ops + '\n';
coll.forEach((c, i) => { const v = c.java.decl.split(' ')[1];
  src += `static String c${i}(){ ${c.java.decl} ${c.java.ops.join(' ')} StringBuilder b=new StringBuilder(); for(Object o: ${v}) b.append(b.length()>0?",":"").append(o); return b.toString(); }\n`; });
strm.forEach((t, i) => { const j = t.java;
  src += `static String s${i}(){ StringBuilder b=new StringBuilder(); Stream.of(${j.words.map(w => '"' + w + '"').join(',')}).filter(s -> s.length() ${j.cmp} ${j.k}).map(s -> ${j.op}(s)).limit(${j.lim}).sorted().forEachOrdered(b::append); return b.toString(); }\n`; });
src += 'public static void main(String[] a){\n';
coll.forEach((c, i) => src += `System.out.println(c${i}());\n`);
strm.forEach((t, i) => src += `System.out.println(s${i}());\n`);
src += '}}\n';
fs.writeFileSync(root + '/T.java', src);
execSync('cd ' + root + ' && javac -nowarn -Xlint:none T.java 2>&1 | grep -v "Picked\\|Note" || true', { stdio: 'inherit' });
const out = execSync('cd ' + root + ' && java T 2>/dev/null', { maxBuffer: 1 << 26 }).toString().split('\n');
let bad = 0;
coll.forEach((c, i) => { if (out[i] !== c.answer) { bad++; if (bad < 6) console.log('COLL', out[i], 'vs', c.answer, '\n' + c.code); } });
strm.forEach((t, i) => { const o = out[coll.length + i]; if (o !== t.answer) { bad++; if (bad < 6) console.log('STREAM', o, 'vs', t.answer, '\n' + t.code); } });
console.log('collections', coll.length, 'streams', strm.length, 'mismatches', bad);
// lambdas: intended interface compiles
let lsrc = 'import java.util.*; import java.util.function.*; import java.time.*;\npublic class Lm { void f() {\n';
K.LAMBDAS.forEach((l, i) => lsrc += `${l[3]} x${i} = ${l[0]};\n`);
lsrc += '}}\n'; fs.writeFileSync(root + '/Lm.java', lsrc);
try { execSync('cd ' + root + ' && javac -nowarn Lm.java', { stdio: 'pipe' }); console.log('lambdas', K.LAMBDAS.length, 'all compile with their intended interface'); } catch (e) { console.log('LAMBDA COMPILE FAIL', e.stdout.toString()); }
// ResourceBundle with real files
const bundles = new Map();
for (let s = 1; s <= 400; s++) { const q = K.GENS[4](K.mk(s * 7919)); bundles.set(q.java.base + q.java.loc + q.java.line, q); }
let bb = 0, n = 0;
for (const q of bundles.values()) { const j = q.java, d = root + '/b' + (n++); fs.mkdirSync(d);
  fs.writeFileSync(d + '/' + j.base + '.properties', 'hello=hello\nworld=world\nbundle=bundle\n');
  fs.writeFileSync(d + '/' + j.base + '_' + j.loc + '.properties', j.line + '\n', 'utf8');
  fs.writeFileSync(d + '/B.java', 'import java.util.*; public class B { public static void main(String[] a) { Locale.setDefault(Locale.ROOT); ' + q.code.replace(/\n/g, ' ') + ' } }');
  const o = execSync('cd ' + d + ' && javac -nowarn B.java 2>/dev/null; java -Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -cp . B 2>/dev/null').toString().trim();
  if (o !== j.out) { bb++; console.log('BUNDLE', JSON.stringify(o), 'vs', j.out); } }
console.log('bundles', n, 'mismatches', bb);

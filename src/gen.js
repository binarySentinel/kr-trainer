/* Генераторы вариантов: Программирование КР1 и ОПД РК1 */
var GEN = (function () {
'use strict';

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function mk(seed) {
  const r = rng(seed);
  const R = {
    r,
    int: (a, b) => a + Math.floor(r() * (b - a + 1)),
    pick: arr => arr[Math.floor(r() * arr.length)],
    chance: p => r() < p,
    shuffle: arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  };
  R.sample = (arr, n) => R.shuffle(arr).slice(0, n);
  return R;
}
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const jdiv = (a, b) => { const q = Math.trunc(a / b); return q === 0 ? 0 : q; };
const jmod = (a, b) => { const m = a % b; return m === 0 ? 0 : m; };
const L = arr => arr.join('\n');

/* ================= Программирование: задачи с кодом ================= */

function gLoopIf(R) {
  const dw = R.chance(0.5);
  const i0 = R.int(0, 3);
  const lim = dw ? R.int(i0, i0 + 3) : R.int(i0 + 1, i0 + 4);
  const s0 = R.int(5, 20), x = R.int(i0, i0 + 2), y = x + 1, p = R.int(1, 5), q = R.int(2, 6), m = R.int(1, 4);
  const body = ['  if (i == ' + x + ') {', '    s += ' + p + ';', '  } else if (i == ' + y + ') {', '    s += ' + q + ';', '  } else {', '    s -= ' + m + ';', '  }', '  i++;'];
  const code = L(['int i = ' + i0 + ';', 'int s = ' + s0 + ';', dw ? 'do {' : 'while (i < ' + lim + ') {', ...body, dw ? '} while (i < ' + lim + ');' : '}', 'System.out.println(s);']);
  let i = i0, s = s0; const tr = [];
  const step = () => { let d; if (i === x) { s += p; d = '+' + p; } else if (i === y) { s += q; d = '+' + q; } else { s -= m; d = '−' + m; } tr.push('i=' + i + ': s' + d + ' → ' + s); i++; };
  if (dw) { do { step(); } while (i < lim); } else { while (i < lim) step(); }
  let ex = 'Трассировка: ' + tr.join('; ') + '.';
  if (dw && i0 >= lim) ex += ' Условие сразу ложно, но тело do-while выполняется хотя бы один раз.';
  return { code, answer: String(s), explain: ex };
}

function gSwitch(R) {
  const i0 = R.int(0, 2), lim = i0 + R.int(3, 4);
  const vals = R.sample([i0, i0 + 1, i0 + 2, i0 + 3].filter(v => v < lim), 2).sort((a, b) => a - b);
  const op = () => { const o = R.pick(['+=', '+=', '-=', '*=']); return { o, k: o === '*=' ? 2 : R.int(1, 5) }; };
  const cases = vals.map(v => Object.assign({ v, br: R.chance(0.6) }, op()));
  const hasDef = R.chance(0.8);
  const def = hasDef ? Object.assign({ def: true, br: true }, op()) : null;
  const s0 = R.int(1, 12);
  const lines = ['int i = ' + i0 + ';', 'int s = ' + s0 + ';', 'while (i < ' + lim + ') {', '  switch (i) {'];
  cases.forEach(c => lines.push('    case ' + c.v + ': s ' + c.o + ' ' + c.k + ';' + (c.br ? ' break;' : '')));
  if (hasDef) lines.push('    default: s ' + def.o + ' ' + def.k + ';');
  lines.push('  }', '  i++;', '}', 'System.out.println(s);');
  const list = hasDef ? cases.concat([def]) : cases;
  let s = s0; const tr = [];
  const ap = c => { if (c.o === '+=') s += c.k; else if (c.o === '-=') s -= c.k; else s *= c.k; };
  for (let i = i0; i < lim; i++) {
    let st = cases.findIndex(c => c.v === i);
    if (st < 0) st = hasDef ? cases.length : -1;
    const did = [];
    if (st >= 0) for (let j = st; j < list.length; j++) { ap(list[j]); did.push((list[j].def ? 'default' : 'case ' + list[j].v) + ' (s ' + list[j].o + ' ' + list[j].k + ')'); if (list[j].br) break; }
    tr.push('i=' + i + ': ' + (did.length ? did.join(' → ') : 'ничего') + ', s=' + s);
  }
  let ex = tr.join('; ') + '.';
  if (cases.some(c => !c.br)) ex += ' Без break выполнение «проваливается» в следующую ветку.';
  return { code: L(lines), answer: String(s), explain: ex };
}

function gForMod(R) {
  const a = R.int(0, 5), b = a + R.int(6, 12), st = R.pick([1, 2, 2, 3]), m = R.pick([2, 3, 4]), rem = R.pick([0, 1]);
  const p = R.int(1, 3); let q = R.int(2, 4); if (q === p) q++;
  const code = L(['int s = 0;', 'for (int i = ' + a + '; i <= ' + b + '; ' + (st === 1 ? 'i++' : 'i += ' + st) + ') {', '  if (i % ' + m + ' == ' + rem + ') {', '    s += ' + p + ';', '  } else {', '    s += ' + q + ';', '  }', '}', 'System.out.println(s);']);
  let s = 0; const yes = [], no = [];
  for (let i = a; i <= b; i += st) { if (i % m === rem) { s += p; yes.push(i); } else { s += q; no.push(i); } }
  return { code, answer: String(s), explain: 'i принимает значения ' + yes.concat(no).sort((x, y) => x - y).join(', ') + '. Условие выполнено для ' + (yes.length ? yes.join(', ') : 'ни одного') + ' (' + yes.length + '×' + p + '), иначе ' + no.length + '×' + q + '. Итого ' + s + '.' };
}

function gMethod(R) {
  const name = R.pick(['f', 'g', 'calc']), sv = R.pick(['N', 'A', 'X', 'Q', 'ab', 'Z']);
  const n = R.int(2, 5), k = R.int(3, 9);
  const V = [
    ['s + (n * k)', sv + (n * k), 'Скобки: сначала n * k = ' + (n * k) + ', затем конкатенация со строкой.'],
    ['s + n * k', sv + (n * k), 'Умножение старше сложения: n * k = ' + (n * k) + ', затем строка + число.'],
    ['s + n + k', sv + n + k, 'Слева направо: s + n — уже строка, затем к ней приписывается k. Числа не складываются.'],
    ['n + k + s', (n + k) + sv, 'Слева направо: n + k = ' + (n + k) + ' (оба int), затем приписывается строка.'],
    ['s + (n + k)', sv + (n + k), 'Скобки: n + k = ' + (n + k) + ', затем конкатенация.'],
    ['n * k + s + n', (n * k) + sv + n, 'n * k = ' + (n * k) + ', дальше строка: + s, + n приписываются.']
  ];
  const v = R.pick(V);
  const method = L(['static String ' + name + '(String s, int n) {', '  var k = ' + k + ';', '  return ' + v[0] + ';', '}']);
  const call = name + '("' + sv + '", ' + n + ')';
  return { prompt: 'Что вернёт метод?', code: method, call: 'при вызове ' + call, answer: v[1], explain: v[2] + ' Результат: ' + v[1] + '.', harness: { members: method, body: 'System.out.println(' + call + ');' } };
}

function fmtFrac(num, den, dec) {
  const sc = num * Math.pow(10, dec);
  let q = Math.floor(sc / den); const r = sc - q * den;
  if (2 * r >= den) q++;
  const s = String(q).padStart(dec + 1, '0');
  return s.slice(0, s.length - dec) + '.' + s.slice(s.length - dec);
}
function gPrintf(R) {
  const B = R.pick([2, 4, 5, 8]), A = R.int(1, 19), C = R.int(1, 3), dec = R.pick([1, 1, 2]);
  const v = R.int(0, 2); let code, num, den, ex;
  const f = '"%.' + dec + 'f"';
  if (v === 0) { code = L(['double d = ' + A + '.0;', 'int n = ' + B + ';', 'System.out.printf(' + f + ', d / n + ' + C + ');']); num = A + C * B; den = B; ex = 'd — double, поэтому деление вещественное: ' + A + '.0 / ' + B + ' + ' + C + '.'; }
  else if (v === 1) { code = L(['int a = ' + A + ';', 'int b = ' + B + ';', 'System.out.printf(' + f + ', a / b + ' + C + '.0);']); num = jdiv(A, B) + C; den = 1; ex = 'a / b — целочисленное деление: ' + A + ' / ' + B + ' = ' + jdiv(A, B) + '. Только потом прибавляется ' + C + '.0.'; }
  else { code = L(['int a = ' + A + ';', 'int b = ' + B + ';', 'System.out.printf(' + f + ', (double) a / b);']); num = A; den = B; ex = 'Приведение (double) применяется к a до деления, поэтому деление вещественное.'; }
  const ans = fmtFrac(num, den, dec);
  return { code, answer: ans, alt: [ans.replace('.', ',')], explain: ex + ' Формат %.' + dec + 'f — ' + dec + ' знак(а) после точки с округлением. Ответ: ' + ans + ' (в русской локали Java печатает через запятую: ' + ans.replace('.', ',') + ' — принимаются оба).' };
}

function g2D(R) {
  const m = [[R.int(1, 9), R.int(1, 9), R.int(1, 9)], [R.int(1, 9), R.int(1, 9), R.int(1, 9)]];
  const T = R.int(2, 8), U = R.int(2, 8), op = R.pick(['&&', '||']), tr = R.int(0, 1), tc = R.int(0, 2), act = R.pick(['= 0', '*= 2', '+= 10']);
  const code = L(['int[][] m = {{' + m[0].join(', ') + '}, {' + m[1].join(', ') + '}};', 'if (m[0][0] > ' + T + ' ' + op + ' m[1][1] < ' + U + ') {', '  m[' + tr + '][' + tc + '] ' + act + ';', '}', 'String s = "$";', 'for (int[] row : m) {', '  int sum = 0;', '  for (int x : row) {', '    sum += x;', '  }', '  s += sum + ":";', '}', 'System.out.println(s);']);
  const c1 = m[0][0] > T, c2 = m[1][1] < U, cond = op === '&&' ? c1 && c2 : c1 || c2;
  if (cond) { if (act === '= 0') m[tr][tc] = 0; else if (act === '*= 2') m[tr][tc] *= 2; else m[tr][tc] += 10; }
  const sums = m.map(r => r[0] + r[1] + r[2]);
  const ans = '$' + sums.map(x => x + ':').join('');
  return { code, answer: ans, explain: 'm[0][0] > ' + T + ' — ' + c1 + ', m[1][1] < ' + U + ' — ' + c2 + ', условие с ' + op + ' — ' + cond + (cond ? ', элемент m[' + tr + '][' + tc + '] изменён' : ', матрица не меняется') + '. Суммы строк: ' + sums.join(' и ') + '. Ответ: ' + ans };
}

function gString(R) {
  const w = R.pick(['java', 'switch', 'program', 'method', 'string', 'object', 'console', 'integer', 'boolean', 'compile']);
  const n = w.length, v = R.int(0, 4);
  let expr, ans, ex;
  if (v === 0) { const a = R.int(0, n - 3), b = R.int(a + 1, n); expr = 's.substring(' + a + ', ' + b + ') + s.length()'; ans = w.slice(a, b) + n; ex = 'substring(' + a + ', ' + b + ') берёт символы с индекса ' + a + ' по ' + (b - 1) + ': "' + w.slice(a, b) + '"; затем строка + число ' + n + ' → конкатенация.'; }
  else if (v === 1) { const i = R.int(0, n - 1), j = R.int(0, n - 1); expr = 's.charAt(' + i + ') + s.charAt(' + j + ')'; ans = String(w.charCodeAt(i) + w.charCodeAt(j)); ex = 'char + char — это сложение кодов символов (int), а не строка: \'' + w[i] + '\' = ' + w.charCodeAt(i) + ', \'' + w[j] + '\' = ' + w.charCodeAt(j) + '.'; }
  else if (v === 2) { const i = R.int(0, n - 1), j = R.int(0, n - 1); expr = '"" + s.charAt(' + i + ') + s.charAt(' + j + ')'; ans = w[i] + w[j]; ex = 'Пустая строка в начале превращает всё выражение в конкатенацию: "' + w[i] + '" + "' + w[j] + '".'; }
  else if (v === 3) { const c = R.chance(0.75) ? w[R.int(0, n - 1)] : R.pick(['x', 'q', 'z']); const a = R.int(1, n - 2); const idx = w.indexOf(c); expr = 's.indexOf(\'' + c + '\') + s.substring(' + a + ')'; ans = idx + w.slice(a); ex = 'indexOf(\'' + c + '\') = ' + idx + (idx < 0 ? ' (символа нет)' : ' (первое вхождение)') + '; int + String → конкатенация с "' + w.slice(a) + '".'; }
  else { expr = 's.length() + s.charAt(0)'; ans = String(n + w.charCodeAt(0)); ex = 'int + char → int: ' + n + ' + код \'' + w[0] + '\' (' + w.charCodeAt(0) + ').'; }
  return { code: L(['String s = "' + w + '";', 'System.out.println(' + expr + ');']), answer: ans, explain: ex + ' Ответ: ' + ans };
}

function gChar(R) {
  const code0 = R.int(65, 85), c = String.fromCharCode(code0), k = R.int(1, 4), v = R.int(0, 4);
  let lines, ans, ex;
  if (v === 0) { lines = ['char c = \'' + c + '\';', 'c += ' + k + ';', 'System.out.println(c);']; ans = String.fromCharCode(code0 + k); ex = 'Составное присваивание c += ' + k + ' сохраняет тип char: символ сдвигается на ' + k + '.'; }
  else if (v === 1) { lines = ['char c = \'' + c + '\';', 'System.out.println(c + ' + k + ');']; ans = String(code0 + k); ex = 'char + int даёт int: код \'' + c + '\' = ' + code0 + ', плюс ' + k + '.'; }
  else if (v === 2) { lines = ['char c = \'' + c + '\';', 'System.out.println((char) (c + ' + k + '));']; ans = String.fromCharCode(code0 + k); ex = 'c + ' + k + ' = ' + (code0 + k) + ', приведение (char) превращает код обратно в символ.'; }
  else if (v === 3) { lines = ['char c = \'' + c + '\';', 'int n = c - \'A\';', 'System.out.println(n);']; ans = String(code0 - 65); ex = 'Разность кодов: ' + code0 + ' − 65.'; }
  else { lines = ['char c = \'' + c + '\';', 'c++;', 'System.out.println("" + c + ' + k + ');']; ans = String.fromCharCode(code0 + 1) + k; ex = 'c++ даёт \'' + String.fromCharCode(code0 + 1) + '\'; дальше конкатенация строк, поэтому ' + k + ' просто приписывается.'; }
  return { code: L(lines), answer: ans, explain: ex + ' Ответ: ' + ans };
}

function gDivMod(R) {
  let a = 0; while (a === 0) a = R.int(-29, 29);
  const b = R.pick([2, 3, 4, 5, 7]) * (R.chance(0.2) ? -1 : 1);
  const ans = jdiv(a, b) + ' ' + jmod(a, b);
  return { code: L(['int a = ' + a + ';', 'int b = ' + b + ';', 'System.out.println(a / b + " " + a % b);']), answer: ans, explain: 'Целочисленное деление отбрасывает дробную часть (к нулю): ' + a + ' / ' + b + ' = ' + jdiv(a, b) + '. Знак остатка совпадает со знаком делимого: ' + a + ' % ' + b + ' = ' + jmod(a, b) + '.' };
}

function gConcat(R) {
  const a = R.int(1, 9), b = R.int(1, 9), c = R.int(1, 9), d = R.int(1, 9), s = R.pick(['x', '=', '#', 'ab']), v = R.int(0, 2);
  let expr, ans, ex;
  if (v === 0) { expr = a + ' + ' + b + ' + "' + s + '" + ' + c + ' + ' + d; ans = (a + b) + s + c + d; ex = 'Слева направо: ' + a + ' + ' + b + ' = ' + (a + b) + ' (числа), дальше всё — строка.'; }
  else if (v === 1) { expr = '"' + s + '" + ' + a + ' + ' + b + ' + ' + c + ' * ' + d; ans = s + a + b + (c * d); ex = 'Строка в начале: числа приписываются по очереди, но ' + c + ' * ' + d + ' = ' + (c * d) + ' вычисляется раньше (приоритет *).'; }
  else { expr = a + ' + ' + b + ' + "" + (' + c + ' + ' + d + ')'; ans = (a + b) + '' + (c + d); ex = a + ' + ' + b + ' = ' + (a + b) + ', затем строка, а скобки (' + c + ' + ' + d + ') = ' + (c + d) + '.'; }
  return { code: 'System.out.println(' + expr + ');', answer: ans, explain: ex + ' Ответ: ' + ans };
}

function gIncr(R) {
  const a = R.int(2, 9), v = R.int(0, 3);
  let lines, ans, ex;
  if (v === 0) { lines = ['int x = ' + a + ';', 'int y = x++ + ++x;', 'System.out.println(x + " " + y);']; ans = (a + 2) + ' ' + (a + a + 2); ex = 'x++ возвращает ' + a + ' (x стало ' + (a + 1) + '), ++x увеличивает до ' + (a + 2) + ' и возвращает ' + (a + 2) + '. y = ' + (2 * a + 2) + '.'; }
  else if (v === 1) { lines = ['int x = ' + a + ';', 'int y = ++x * 2 + x--;', 'System.out.println(x + " " + y);']; ans = a + ' ' + (3 * a + 3); ex = '++x → ' + (a + 1) + ', ×2 = ' + (2 * a + 2) + '; x-- возвращает ' + (a + 1) + ' и уменьшает x до ' + a + '.'; }
  else if (v === 2) { lines = ['int x = ' + a + ';', 'x += x++;', 'System.out.println(x);']; ans = String(2 * a); ex = 'x += x++ — это x = x + x++ = ' + a + ' + ' + a + '. Увеличение от x++ затирается присваиванием.'; }
  else { lines = ['int x = ' + a + ';', 'int y = x-- - --x;', 'System.out.println(x + " " + y);']; ans = (a - 2) + ' 2'; ex = 'x-- возвращает ' + a + ' (x = ' + (a - 1) + '), --x → ' + (a - 2) + '. y = ' + a + ' − ' + (a - 2) + ' = 2.'; }
  return { code: L(lines), answer: ans, explain: ex + ' Ответ: ' + ans };
}

function gArrRef(R) {
  const arr = [R.int(1, 9), R.int(1, 9), R.int(1, 9), R.int(1, 9)], i = R.int(0, 3); let j = R.int(0, 3); if (j === i) j = (i + 1) % 4;
  const val = R.int(10, 20), v = R.int(0, 2);
  let lines, ans, ex; const a = arr.slice();
  if (v === 0) { lines = ['int[] a = {' + arr.join(', ') + '};', 'int[] b = a;', 'b[' + i + '] = ' + val + ';', 'System.out.println(a[' + i + '] + a[' + j + ']);']; a[i] = val; ans = String(a[i] + a[j]); ex = 'b = a копирует ссылку: b и a — один и тот же массив, поэтому a[' + i + '] тоже стал ' + val + '. ' + val + ' + ' + a[j] + ' = ' + (a[i] + a[j]) + ' (числа складываются).'; }
  else if (v === 1) { lines = ['int[] a = {' + arr.join(', ') + '};', 'int[] b = a.clone();', 'b[' + i + '] = ' + val + ';', 'System.out.println(a[' + i + '] + " " + b[' + i + ']);']; ans = arr[i] + ' ' + val; ex = 'clone() создаёт копию, поэтому изменение b не затрагивает a.'; }
  else { lines = ['int[] a = {' + arr.join(', ') + '};', 'int[] b = a;', 'a[' + i + '] += b[' + i + '];', 'System.out.println(b[' + i + ']);']; ans = String(arr[i] * 2); ex = 'a и b ссылаются на один массив: a[' + i + '] = ' + arr[i] + ' + ' + arr[i] + ', и b[' + i + '] видит это же значение.'; }
  return { code: L(lines), answer: ans, explain: ex + ' Ответ: ' + ans };
}

function gNested(R) {
  const n = R.int(2, 4), m = R.int(3, 5), k = R.int(2, m), kw = R.pick(['break', 'continue']), add = R.pick(['s += j;', 's += i;', 's += i * j;']);
  const code = L(['int s = 0;', 'for (int i = 1; i <= ' + n + '; i++) {', '  for (int j = 1; j <= ' + m + '; j++) {', '    if (j == ' + k + ') {', '      ' + kw + ';', '    }', '    ' + add, '  }', '}', 'System.out.println(s);']);
  let s = 0; const js = [];
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) { if (j === k) { if (kw === 'break') break; continue; } if (i === 1) js.push(j); s += add === 's += j;' ? j : add === 's += i;' ? i : i * j; }
  return { code, answer: String(s), explain: (kw === 'break' ? 'break выходит только из внутреннего цикла' : 'continue пропускает только j = ' + k) + ', поэтому для каждого i обрабатываются j = ' + js.join(', ') + '. Итого s = ' + s + '.' };
}

function gTernary(R) {
  const x = R.int(1, 30), A = R.int(15, 25), B = R.int(5, 14);
  const r = x > A ? 'big' : x > B ? 'mid' : 'small';
  return { code: L(['int x = ' + x + ';', 'String r = x > ' + A + ' ? "big" : x > ' + B + ' ? "mid" : "small";', 'System.out.println(r + x % 4);']), answer: r + (x % 4), explain: 'x > ' + A + ' — ' + (x > A) + (x > A ? '' : ', x > ' + B + ' — ' + (x > B)) + ' → "' + r + '". x % 4 = ' + (x % 4) + ', приписывается к строке. Ответ: ' + r + (x % 4) };
}

function gForEach(R) {
  const arr = [R.int(1, 9), R.int(1, 9), R.int(1, 9), R.int(1, 9)], v = R.int(0, 1), sum = arr.reduce((a, b) => a + b, 0);
  const loop = v === 0 ? ['for (int x : arr) {', '  x *= 2;', '}'] : ['for (int i = 0; i < arr.length; i++) {', '  arr[i] *= 2;', '}'];
  const ans = String(v === 0 ? sum : 2 * sum);
  return { code: L(['int[] arr = {' + arr.join(', ') + '};', ...loop, 'int sum = 0;', 'for (int x : arr) {', '  sum += x;', '}', 'System.out.println(sum);']), answer: ans, explain: (v === 0 ? 'В for-each переменная x — копия элемента; x *= 2 не меняет массив. Сумма исходных элементов: ' : 'Цикл по индексу меняет сами элементы, сумма удваивается: ') + ans + '.' };
}

function gWhileDigits(R) {
  const D = R.pick([10, 10, 2, 3]), N = D === 10 ? R.int(10, 99999) : R.int(5, 200);
  let n = N, c = 0; while (n > 0) { n = jdiv(n, D); c++; }
  return { code: L(['int n = ' + N + ';', 'int c = 0;', 'while (n > 0) {', '  n /= ' + D + ';', '  c++;', '}', 'System.out.println(c + " " + n);']), answer: c + ' ' + n, explain: 'Цикл делит n на ' + D + ', пока n > 0: ' + c + ' итераций' + (D === 10 ? ' (число цифр в ' + N + ')' : '') + '. После цикла n = 0. Ответ: ' + c + ' 0' };
}

const CODE = [gLoopIf, gSwitch, gForMod, gMethod, gPrintf, g2D, gString, gChar, gDivMod, gConcat, gIncr, gArrRef, gNested, gTernary, gForEach, gWhileDigits];

/* ================= Теория ================= */
// [верно?, утверждение, пояснение]
const POOLS = {
  loops: { about: 'об инструкциях цикла', items: [
    [true, 'Циклы могут быть вложенными', 'Любой цикл можно поместить внутрь другого.'],
    [false, 'Циклы в Java не могут быть вложенными', 'Вложенные циклы разрешены.'],
    [true, 'continue можно использовать внутри while, do-while и for', 'continue работает во всех видах циклов.'],
    [true, 'Если условие цикла всегда истинно и в теле нет break, return или исключения, цикл не завершится', 'Это бесконечный цикл.'],
    [false, 'Цикл do-while не может быть вложенным', 'Любой цикл может быть вложенным.'],
    [false, 'Тело цикла do-while может не выполниться ни разу', 'do-while проверяет условие после тела, поэтому тело выполняется минимум один раз.'],
    [true, 'Тело цикла do-while выполняется хотя бы один раз', 'Условие проверяется после тела.'],
    [true, 'for-each по массиву int[] не позволяет изменить элементы массива через переменную цикла', 'Переменная цикла — копия значения элемента.'],
    [false, 'Цикл while — цикл с постусловием', 'while — цикл с предусловием; с постусловием — do-while.'],
    [false, 'Условие цикла while может быть строкой', 'Условие должно иметь тип boolean.'],
    [true, 'Условие цикла do-while должно иметь тип boolean', 'Как и у всех циклов.'],
    [false, 'break без метки завершает только текущую итерацию цикла', 'Это делает continue; break завершает весь цикл.'],
    [true, 'break без метки завершает самый внутренний цикл или switch', 'Внешние циклы продолжают работу.'],
    [true, 'Цикл for-each по массиву можно заменить циклом for со счётчиком', 'for (int i = 0; i < a.length; i++) обходит те же элементы.'],
    [true, 'for (;;) { } — бесконечный цикл', 'Все три части заголовка for можно опустить.'],
    [false, 'В заголовке цикла for обязательно должны быть все три части', 'Любую часть можно опустить: for (;;).']
  ]},
  branch: { about: 'об инструкциях ветвления и выбора', items: [
    [true, 'Выражение в скобках инструкции switch может иметь тип char', 'switch поддерживает char, byte, short, int, их обёртки, String и enum.'],
    [true, 'Выражение в скобках инструкции switch может иметь тип String', 'Начиная с Java 7.'],
    [false, 'Выражение в скобках инструкции switch может иметь тип double', 'double, float, long и boolean в switch не допускаются.'],
    [false, 'Если условие инструкции if ложно, программа завершается с ошибкой', 'Просто не выполняется тело if (или выполняется else).'],
    [true, 'Если условие в тернарном операторе ложно, результатом будет значение выражения после двоеточия', 'усл ? A : B — при false получаем B.'],
    [false, 'Тело инструкции if обязано быть блоком в фигурных скобках', 'Одну инструкцию можно писать без скобок.'],
    [true, 'Инструкции if можно объединять в цепочку с помощью else if', 'if … else if … else.'],
    [false, 'Условие инструкции if не может быть переменной типа boolean', 'Может: if (flag) { … }.'],
    [false, 'Условием if может быть целое число, как в языке C', 'В Java if (1) — ошибка компиляции, нужен boolean.'],
    [true, 'Без break выполнение switch продолжится со следующей ветки case', 'Это «проваливание» (fall-through).'],
    [true, 'Ветка default в switch необязательна', 'Если её нет и ни один case не подошёл, ничего не выполняется.'],
    [false, 'Ветка default обязана стоять последней в switch', 'default может стоять в любом месте, хотя обычно его пишут последним.'],
    [false, 'В одном switch можно указать два одинаковых значения case', 'Повтор значения case — ошибка компиляции.']
  ]},
  structure: { about: 'о структуре программы на Java', items: [
    [true, 'Блочный комментарий ограничивается символами /* и */', ''],
    [false, 'Имена переменных принято писать заглавными буквами', 'Принят camelCase с маленькой буквы; ЗАГЛАВНЫМИ пишут константы.'],
    [true, 'В именах Java различаются заглавные и строчные буквы', 'sum и Sum — разные имена.'],
    [true, 'Комментарии игнорируются компилятором', ''],
    [true, 'Комментарии не влияют на выполнение программы', ''],
    [false, 'Текстовая строка заключается в одинарные кавычки', 'В одинарные кавычки заключается символ (char), строка — в двойные.'],
    [true, 'Текстовая строка заключается в двойные кавычки', ''],
    [false, 'Параметры метода указываются в квадратных скобках', 'Параметры пишут в круглых скобках.'],
    [true, 'Файл с public class Calc должен называться Calc.java', 'Имя public-класса совпадает с именем файла.'],
    [true, 'Компилятор javac создаёт файлы с расширением .class', 'В них байт-код для JVM.'],
    [false, 'Каждая инструкция в Java заканчивается двоеточием', 'Простые инструкции заканчиваются точкой с запятой.'],
    [true, 'Простые инструкции заканчиваются точкой с запятой', ''],
    [false, 'Однострочный комментарий начинается с символа #', 'В Java — с //.'],
    [true, 'Однострочный комментарий начинается с //', '']
  ]},
  arrays: { about: 'о массивах', items: [
    [true, 'Индексация элементов массива начинается с 0', ''],
    [false, 'Индексация элементов массива начинается с 1', 'Первый элемент — a[0].'],
    [true, 'Длину массива можно узнать через поле length', 'a.length — без скобок.'],
    [false, 'Длину массива можно узнать методом length()', 'length() — метод строки; у массива поле length.'],
    [true, 'Размер уже созданного массива изменить нельзя', 'Нужно создать новый массив.'],
    [false, 'Массив int[] может одновременно хранить числа и строки', 'Все элементы массива одного типа.'],
    [true, 'Элементы нового массива int[] по умолчанию равны 0', ''],
    [true, 'Элементы нового массива String[] по умолчанию равны null', ''],
    [false, 'Присваивание b = a копирует все элементы массива a в новый массив b', 'Копируется только ссылка: b и a указывают на один массив.'],
    [true, 'Обращение a[a.length] вызывает ArrayIndexOutOfBoundsException', 'Последний допустимый индекс — length − 1.'],
    [false, 'Обращение к несуществующему индексу возвращает 0', 'Будет исключение ArrayIndexOutOfBoundsException.']
  ]},
  strings: { about: 'о строках', items: [
    [true, 'Объекты String неизменяемы', 'Методы вроде toUpperCase() возвращают новую строку.'],
    [false, 'Содержимое строк правильно сравнивать оператором ==', '== сравнивает ссылки; для содержимого нужен equals.'],
    [true, 'Для сравнения содержимого строк используется метод equals', ''],
    [true, 'Метод length() возвращает число символов в строке', ''],
    [false, 's.charAt(0) возвращает значение типа String', 'charAt возвращает char.'],
    [true, 'При конкатенации строки с числом получается строка', 'Число преобразуется в текст.'],
    [false, 'Индексы символов строки начинаются с 1', 'С 0, как и у массивов.'],
    [true, 's.substring(a, b) возвращает символы с индекса a по b − 1', 'Правая граница не включается.'],
    [false, 'Метод toUpperCase() изменяет исходную строку', 'Строки неизменяемы, возвращается новая строка.'],
    [true, 's.indexOf(c) возвращает −1, если символа нет в строке', '']
  ]},
  methods: { about: 'о методах', items: [
    [true, 'Метод с типом void не возвращает значение', ''],
    [false, 'Метод с типом результата int может завершиться без return', 'Каждый путь выполнения должен вернуть значение — иначе ошибка компиляции.'],
    [true, 'Можно объявить несколько методов с одним именем и разными параметрами', 'Это перегрузка (overloading).'],
    [false, 'Перегруженные методы могут отличаться только типом возвращаемого значения', 'Должны отличаться списком параметров.'],
    [true, 'Аргументы примитивных типов передаются в метод по значению', 'Изменение параметра внутри метода не меняет переменную снаружи.'],
    [true, 'Статический метод можно вызвать по имени класса, не создавая объект', ''],
    [false, 'Локальная переменная метода видна в других методах класса', 'Она видна только в своём блоке.'],
    [true, 'Метод main можно вызвать из другого метода как обычный статический метод', ''],
    [false, 'Метод может вернуть значение оператором break', 'Значение возвращает return.']
  ]},
  types: { about: 'о типах и переменных', items: [
    [true, 'Константа объявляется с модификатором final', ''],
    [false, 'Локальную переменную можно использовать до инициализации', 'Компилятор выдаст ошибку.'],
    [true, 'После int a = 7 / 2; значение a равно 3', 'Целочисленное деление.'],
    [false, 'Тип boolean может принимать значения 0 и 1', 'Только true и false.'],
    [true, 'При объявлении через var переменную нужно сразу инициализировать', 'Тип выводится из инициализатора.'],
    [true, 'char — целочисленный тип, с ним можно выполнять арифметику', 'Например, \'A\' + 1 = 66.'],
    [false, 'Тип String — примитивный', 'String — ссылочный тип (класс).'],
    [true, 'int занимает 32 бита', ''],
    [false, 'Результат (int) 3.99 равен 4', 'Приведение к int отбрасывает дробную часть: 3.']
  ]}
};

// [вопрос, правильный, неправильные..., пояснение]
const SINGLE = [
  ['Что такое константа в Java?', 'Переменная с модификатором final, значение которой не меняется', ['Переменная с модификатором static', 'Переменная с модификатором public', 'Переменная, объявленная с типом var'], 'final запрещает повторное присваивание.'],
  ['Файл называется Calc.java, в нём объявлен public class Calc. Какой файл появится после успешного выполнения javac Calc.java?', 'Calc.class', ['Calc.java', 'Calc.jar', 'Calc.exe'], 'javac компилирует исходник в байт-код .class.'],
  ['Какой метод класса Hello выполняет виртуальная машина Java при запуске командой java Hello?', 'main', ['start', 'Hello', 'run'], 'Точка входа — метод main.'],
  ['Что произойдёт при обращении arr[0], если arr == null?', 'NullPointerException', ['ArrayIndexOutOfBoundsException', 'Вернётся 0', 'Вернётся null'], 'Массива нет — ссылка null, обращение к нему даёт NullPointerException.'],
  ['Где видна локальная переменная?', 'Только в блоке, где она объявлена, начиная с места объявления', ['Во всей программе', 'Только в методах main', 'Во всём классе'], 'Область видимости локальной переменной — её блок.'],
  ['Можно ли вызвать метод main напрямую из другого метода?', 'Да, как обычный статический метод', ['Да, но только через один раз', 'Нет, main нельзя вызывать', 'Да, но только из другого main'], 'main — обычный static-метод.'],
  ['Что происходит при конкатенации строки с числом в Java?', 'Число преобразуется в строку и присоединяется', ['Ошибка компиляции', 'Строка преобразуется в число и они складываются', 'Число отбрасывается'], '"a" + 5 → "a5".'],
  ['Что произойдёт при присваивании b = a, где a и b — массивы?', 'b получит ссылку на тот же массив, что и a', ['Создастся полная копия массива a', 'Создастся новый массив той же длины', 'Компилятор выдаст ошибку'], 'Копируется ссылка.'],
  ['Чему равно значение выражения 7 / 2 для int?', '3', ['3.5', '4', '3.0'], 'Целочисленное деление отбрасывает дробную часть.'],
  ['Чему равно -7 % 3 в Java?', '-1', ['2', '1', '-2'], 'Знак остатка совпадает со знаком делимого.'],
  ['Какой тип имеет выражение \'a\' + 1?', 'int', ['char', 'String', 'byte'], 'char при арифметике повышается до int.'],
  ['Какое значение по умолчанию у элементов нового массива boolean[]?', 'false', ['true', 'null', '0'], ''],
  ['Как получить длину массива arr?', 'arr.length', ['arr.length()', 'arr.size()', 'length(arr)'], 'У массива поле length.'],
  ['Как получить длину строки s?', 's.length()', ['s.length', 's.size()', 's.count()'], 'У строки метод length().'],
  ['Что делает инструкция continue в цикле?', 'Переходит к следующей итерации цикла', ['Завершает цикл', 'Завершает метод', 'Повторяет текущую итерацию'], ''],
  ['Какой тип должно иметь условие в инструкции if?', 'boolean', ['int', 'Любой числовой', 'String'], ''],
  ['Сколько раз выполнится тело цикла do { … } while (false);?', '1', ['0', 'Бесконечно', 'Ошибка компиляции'], 'Тело do-while выполняется хотя бы раз.'],
  ['Сколько раз выполнится тело цикла for (int i = 0; i < 10; i += 3)?', '4', ['3', '10', '5'], 'i = 0, 3, 6, 9.'],
  ['Что выведет System.out.println("abc".equals("ABC"));?', 'false', ['true', 'Ошибка компиляции', '0'], 'equals учитывает регистр.'],
  ['Какой оператор — логическое «И» с сокращённым вычислением?', '&&', ['&', '||', 'and'], '&& не вычисляет правую часть, если левая false.'],
  ['Как правильно создать массив из 5 целых чисел?', 'int[] a = new int[5];', ['int a[5];', 'int[] a = int[5];', 'int a = new int[5];'], ''],
  ['Что вернёт "hello".indexOf(\'z\')?', '-1', ['0', 'null', '5'], 'Символ не найден.'],
  ['Какое расширение у файла исходного кода Java?', '.java', ['.class', '.jav', '.jar'], ''],
  ['Какой модификатор позволяет вызывать метод без создания объекта?', 'static', ['final', 'public', 'void'], ''],
  ['Что выведет System.out.println(1 + 2 + "3");?', '33', ['123', '6', '15'], '1 + 2 = 3, затем "3" + "3".'],
  ['Что произойдёт при компиляции: int x = 5; if (x = 5) { }', 'Ошибка компиляции', ['Условие истинно', 'Условие ложно', 'Ошибка во время выполнения'], 'x = 5 имеет тип int, а нужен boolean.'],
  ['Какой из типов не является примитивным?', 'String', ['int', 'char', 'boolean'], ''],
  ['Чему будет равно x после int x = (int) 3.99;?', '3', ['4', '3.99', 'Ошибка компиляции'], 'Приведение отбрасывает дробную часть.'],
  ['Чем println отличается от print?', 'println после вывода переводит строку', ['println выводит только числа', 'print работает быстрее', 'Ничем'], ''],
  ['Какое ключевое слово завершает метод и возвращает значение?', 'return', ['break', 'exit', 'continue'], '']
];

function makeMulti(R, key) {
  const P = POOLS[key], T = P.items.filter(x => x[0]), F = P.items.filter(x => !x[0]);
  const nT = R.int(2, Math.min(4, T.length));
  const chosen = R.shuffle(R.sample(T, nT).concat(R.sample(F, Math.min(6 - nT, F.length))));
  return { type: 'multi', prompt: 'Выберите все верные утверждения ' + P.about + '.', opts: chosen.map(x => x[1]), correct: chosen.map(x => x[0]), notes: chosen.map(x => x[2] || ''), used: chosen.map(x => x[1]) };
}

function buildProg(seed) {
  const R = mk(seed);
  const code = R.sample(CODE, 10).map(g => Object.assign({ type: 'text', prompt: 'Что выведет программа?', pts: 0.06 }, g(R)));
  const keys = Object.keys(POOLS);
  const topics = R.sample(keys, 4);
  const multi = topics.map(k => Object.assign(makeMulti(R, k), { pts: 0.04 }));
  const used = new Set([].concat(...multi.map(m => m.used)));
  const tf = [];
  while (tf.length < 2) {
    const item = R.pick(POOLS[R.pick(keys)].items);
    if (used.has(item[1])) continue; used.add(item[1]);
    tf.push({ type: 'single', prompt: 'Верно ли утверждение: «' + item[1] + '»?', opts: ['Верно', 'Неверно'], correctIdx: item[0] ? 0 : 1, explain: (item[0] ? 'Верно. ' : 'Неверно. ') + (item[2] || ''), pts: 0.04 });
  }
  const single = R.sample(SINGLE, 4).map(s => {
    const opts = R.shuffle([s[1]].concat(s[2]));
    return { type: 'single', prompt: s[0], opts, correctIdx: opts.indexOf(s[1]), explain: 'Правильный ответ: ' + s[1] + '. ' + (s[3] || ''), pts: 0.04 };
  });
  return R.shuffle(code.concat(multi, tf, single));
}

function norm(s) { return String(s == null ? '' : s).trim().replace(/\s+/g, ' ').replace(/^"(.*)"$/, '$1'); }
function gradeProgQ(q, a) {
  if (q.type === 'text') { const ok = a != null && [q.answer].concat(q.alt || []).some(x => norm(x) === norm(a)); return ok ? 1 : 0; }
  if (q.type === 'single') return a === q.correctIdx ? 1 : 0;
  if (q.type === 'multi') {
    const sel = Array.isArray(a) ? a : []; const nT = q.correct.filter(Boolean).length;
    const good = sel.filter(i => q.correct[i]).length, bad = sel.length - good;
    return Math.max(0, (good - bad) / nT);
  }
  return 0;
}

/* ================= ОПД ================= */
const PN = ['bulbasaur', 'charmander', 'squirtle', 'pikachu', 'eevee', 'vulpix', 'jigglypuff', 'meowth', 'psyduck', 'growlithe', 'abra', 'machop', 'geodude', 'ponyta', 'slowpoke', 'magnemite', 'gastly', 'onix', 'drowzee', 'krabby', 'cubone', 'koffing', 'rhyhorn', 'horsea', 'staryu', 'scyther', 'magmar', 'pinsir', 'lapras', 'ditto', 'snorlax', 'dratini', 'chikorita', 'cyndaquil', 'totodile', 'togepi', 'mareep', 'wooper', 'murkrow', 'sneasel', 'larvitar', 'treecko', 'torchic', 'mudkip', 'ralts', 'aron', 'numel', 'swablu', 'feebas', 'absol', 'bagon', 'beldum', 'spheal', 'shuppet'];
const TY = ['GRASS', 'POISON', 'FIRE', 'WATER', 'BUG', 'FLYING', 'NORMAL', 'ELECTRIC', 'GROUND', 'ROCK', 'PSYCHIC', 'ICE', 'DRAGON', 'GHOST', 'STEEL', 'DARK', 'NONE'];
const AB = ['Overgrow', 'Blaze', 'Torrent', 'Static', 'Levitate', 'Intimidate', 'Swift Swim', 'Keen Eye', 'Sturdy', 'Inner Focus', 'Run Away', 'Chlorophyll', 'Sand Veil', 'Synchronize', 'Shed Skin'];
const HB = ['Forest', 'Grassland', 'Mountain', 'Cave', 'Urban', 'Rainforest', 'Beach', 'Freshwater', 'Ocean', 'Tundra', 'Desert', 'Wetlands'];

function fileContent(R) {
  switch (R.int(0, 4)) {
    case 0: return 'weight=' + (R.int(10, 9000) / 10).toFixed(1) + ' height=' + R.int(5, 80) + '.0 atk=' + R.int(3, 12) + ' def=' + R.int(3, 12);
    case 1: return 'Тип покемона ' + R.sample(TY, 2).join(' ');
    case 2: return 'Способности ' + R.sample(AB, 2).join(' ');
    case 3: return 'Живет ' + R.sample(HB, 2).join(' ');
    default: return 'satk=' + R.int(3, 12) + ' sdef=' + R.int(3, 12) + '\nspd=' + R.int(3, 12);
  }
}
function modeStr(m) { let s = ''; for (let sh = 6; sh >= 0; sh -= 3) { const d = (m >> sh) & 7; s += (d & 4 ? 'r' : '-') + (d & 2 ? 'w' : '-') + (d & 1 ? 'x' : '-'); } return s; }
function octStr(m) { return (m & 511).toString(8).padStart(3, '0'); }
function verbal(m, dir) {
  const W = [['владелец', 'должен', 'не имеет'], ['группа-владелец', 'должна', 'не имеет'], ['остальные пользователи', 'должны', 'не имеют']];
  const obj = dir ? 'директорию' : 'файл';
  return [6, 3, 0].map((sh, k) => {
    const d = (m >> sh) & 7, acts = [];
    if (d & 4) acts.push('читать ' + obj);
    if (d & 2) acts.push('записывать ' + obj);
    if (d & 1) acts.push(dir ? 'переходить в директорию' : 'исполнять файл');
    if (!acts.length) return W[k][0] + ' ' + W[k][2] + ' никаких прав';
    const t = acts.length > 1 ? acts.slice(0, -1).join(', ') + ' и ' + acts[acts.length - 1] : acts[0];
    return W[k][0] + ' ' + W[k][1] + ' ' + t;
  }).join('; ');
}
function buildTree(R) {
  for (let attempt = 0; attempt < 500; attempt++) {
    const used = new Set(), nodes = [{ path: 'lab0', type: 'd' }];
    const nm = () => { let n; do { n = R.pick(PN) + R.int(0, 9); } while (used.has(n)); used.add(n); return n; };
    const file = p => nodes.push({ path: p + '/' + nm(), type: 'f', content: fileContent(R) });
    const fill = (p, depth) => {
      const k = R.int(2, 3);
      for (let j = 0; j < k; j++) {
        if (depth < 3 && R.chance(depth === 1 ? 0.5 : 0.4)) { const q = p + '/' + nm(); nodes.push({ path: q, type: 'd' }); fill(q, depth + 1); }
        else if (R.chance(0.25)) nodes.push({ path: p + '/' + nm(), type: 'd' }); // пустой каталог
        else file(p);
      }
    };
    for (let i = 0; i < 3; i++) { const q = 'lab0/' + nm(); nodes.push({ path: q, type: 'd' }); fill(q, 1); }
    const nf = R.int(1, 2); for (let i = 0; i < nf; i++) file('lab0');
    const seg = n => n.path.split('/').length;
    const deepDirs = nodes.filter(n => n.type === 'd' && seg(n) >= 4).length;
    const midDirs = nodes.filter(n => n.type === 'd' && seg(n) >= 3).length;
    const isEmpty = d => !nodes.some(x => x.path.startsWith(d.path + '/'));
    const empty = nodes.filter(n => n.type === 'd' && isEmpty(n)), emptyDeep = empty.filter(n => seg(n) >= 3).length;
    if (nodes.length < 18 || nodes.length > 26 || deepDirs < 1 || midDirs < 3 || empty.length < 2 || empty.length > 4 || emptyDeep < 1) continue;
    nodes.forEach(n => {
      if (n.path === 'lab0') return;
      let m;
      if (n.type === 'd') m = (R.pick([7, 7, 5, 3, 1, 6, 5, 3]) << 6) | (R.int(0, 7) << 3) | R.int(0, 7);
      else m = (R.pick([4, 6, 6, 4, 0, 2]) << 6) | (R.pick([0, 4, 6, 0, 2, 4]) << 3) | R.pick([0, 4, 6, 0, 2, 4]);
      n.mode = m; n.fmt = R.pick(['oct', 'sym', 'verb']);
    });
    nodes.sort((a, b) => a.path < b.path ? -1 : 1);
    return nodes;
  }
  throw new Error('tree');
}
function permText(n) {
  if (n.fmt === 'oct') return octStr(n.mode);
  if (n.fmt === 'sym') return modeStr(n.mode);
  return verbal(n.mode, n.type === 'd');
}
function refSolution(nodes) {
  const out = ['cd ~', '# 1) создаём каталоги'];
  nodes.filter(n => n.type === 'd').forEach(n => out.push('mkdir ' + n.path));
  out.push('# 2) создаём файлы с содержимым');
  nodes.filter(n => n.type === 'f').forEach(n => {
    out.push(n.content.includes('\n') ? 'echo -e "' + n.content.replace(/\n/g, '\\n') + '" > ' + n.path : 'echo "' + n.content + '" > ' + n.path);
  });
  out.push('# 3) права — от самых глубоких элементов к верхним,', '#    чтобы не потерять доступ к содержимому каталогов');
  nodes.filter(n => n.path !== 'lab0').slice().sort((a, b) => b.path.split('/').length - a.path.split('/').length).forEach(n => out.push('chmod ' + octStr(n.mode) + ' ' + n.path + '   # ' + modeStr(n.mode)));
  return out.join('\n');
}

function normC(s) { return String(s || '').replace(/\r/g, '').split('\n').map(l => l.trim().replace(/\s+/g, ' ')).join('\n').replace(/\n+$/, '').trim(); }
function gradeTree(lookup, nodes) {
  const items = [];
  nodes.forEach(n => {
    const g = lookup(n.path), kind = n.type === 'd' ? 'каталог' : 'файл';
    const okType = g && ((g.t === 'd') === (n.type === 'd'));
    items.push({ path: n.path, what: 'Создан ' + kind, ok: !!okType, exp: kind, got: !g ? 'нет' : g.t === 'd' ? 'каталог' : 'файл' });
    if (n.type === 'f') items.push({ path: n.path, what: 'Содержимое', ok: !!okType && normC(g.d) === normC(n.content), exp: n.content, got: okType ? (g.d || '(пусто)').replace(/\n$/, '') : '—' });
    if (n.mode != null) items.push({ path: n.path, what: 'Права', ok: !!g && (g.m & 511) === n.mode, exp: modeStr(n.mode) + ' (' + octStr(n.mode) + ')', got: g ? modeStr(g.m) + ' (' + octStr(g.m) + ')' : '—' });
  });
  return items;
}

function hex4(v) { return (v & 0xFFFF).toString(16).toUpperCase().padStart(4, '0'); }
function bin16(v) { return (v & 0xFFFF).toString(2).padStart(16, '0').replace(/(.{4})(?=.)/g, '$1 '); }
function flagsOf(A, B) {
  const sum = (A & 0xFFFF) + (B & 0xFFFF), res = sum & 0xFFFF, sres = res >= 0x8000 ? res - 0x10000 : res;
  return { a: hex4(A), b: hex4(B), s: hex4(res), C: sum > 0xFFFF ? 1 : 0, V: (A + B) !== sres ? 1 : 0, sres };
}
function buildFlags(R) {
  const want = R.pick(['none', 'C', 'V', 'CV']);
  const big = () => R.int(1000, 32767) * (R.chance(0.5) ? -1 : 1);
  for (let t = 0; t < 5000; t++) {
    const A = R.chance(0.8) ? big() : R.int(-999, 999), B = big();
    const f = flagsOf(A, B), cat = (f.C ? 'C' : '') + (f.V ? 'V' : '') || 'none';
    if (cat === want) return { A, B };
  }
  return { A: 12345, B: -2345 };
}
function explainFlags(A, B) {
  const f = flagsOf(A, B);
  const conv = (x, h) => x >= 0 ? x + ' = ' + h + '₁₆' : x + ': |' + x + '| = ' + (-x) + ' = ' + hex4(-x) + '₁₆; инвертируем биты и прибавляем 1 → ' + h + '₁₆';
  return [
    'A = ' + conv(A, f.a), 'B = ' + conv(B, f.b), '',
    '   ' + bin16(A) + '   (' + f.a + ')',
    ' + ' + bin16(B) + '   (' + f.b + ')',
    ' = ' + bin16(parseInt(f.s, 16)) + '   (' + f.s + ')' + (f.C ? '  и перенос 1 из 15-го разряда' : ''), '',
    'C = ' + f.C + ': ' + (f.C ? 'есть перенос из старшего (15-го) разряда — сумма без знака больше FFFF.' : 'переноса из старшего разряда нет.'),
    'V = ' + f.V + ': ' + (f.V ? 'знаки слагаемых одинаковые, а знак результата другой — результат ' + (A + B) + ' не помещается в [−32768; 32767].' : (Math.sign(A) !== Math.sign(B) ? 'слагаемые разных знаков — переполнение невозможно.' : 'знак результата совпадает со знаком слагаемых.')),
    'Результат как знаковое число: ' + f.sres + (f.V ? ' (а верная сумма ' + (A + B) + ')' : '') + '.'
  ].join('\n');
}

function buildOpd(seed) { const R = mk(seed); const nodes = buildTree(R); const fl = buildFlags(R); return { nodes, A: fl.A, B: fl.B }; }

function parseHex(s) {
  let t = String(s || '').trim().toUpperCase().replace(/\s+/g, '').replace(/^0X/, '').replace(/[H₁₆]+$/, '');
  if (!/^[0-9A-F]{1,4}$/.test(t)) return null;
  return parseInt(t, 16);
}

return { mk, hash, buildProg, gradeProgQ, buildOpd, gradeTree, CODE, POOLS, SINGLE, modeStr, octStr, permText, refSolution, flagsOf, explainFlags, parseHex, hex4, norm, fmtFrac };
})();
if (typeof module !== 'undefined') module.exports = GEN;

/* КР2: вопросы «что выведет программа» и «скомпилируется ли» по ООП */
var KR2CODE = (function () {
'use strict';
const L = a => a.join('\n');
const q = s => '"' + s + '"';
/* Программа: decls — классы верхнего уровня, members — статические члены Main, body — тело main */
function program(decls, members, body) {
  const out = [];
  decls.forEach(d => { out.push(d, ''); });
  out.push('public class Main {');
  members.forEach(m => out.push(m.split('\n').map(l => '    ' + l).join('\n'), ''));
  out.push('    public static void main(String[] args) {');
  body.forEach(l => out.push('        ' + l));
  out.push('    }', '}');
  return L(out);
}

/* 1. Полиморфизм: переопределение, static, поля, super */
function gPoly(R) {
  const [A, B] = R.pick([['Animal', 'Cat'], ['Shape', 'Circle'], ['Vehicle', 'Bike'], ['Base', 'Derived'], ['Phone', 'Smartphone']]);
  const v = R.int(0, 3);
  let decls, body, ans, ex;
  if (v === 0) {
    decls = [L(['class ' + A + ' {', '    String who() { return ' + q(A) + '; }', '}']), L(['class ' + B + ' extends ' + A + ' {', '    @Override', '    String who() { return ' + q(B) + '; }', '}'])];
    body = [A + ' x = new ' + B + '();', 'System.out.println(x.who());']; ans = B;
    ex = 'Тип переменной — ' + A + ', но объект — ' + B + '. Переопределённый метод выбирается по реальному типу объекта во время выполнения (позднее связывание): ' + B + '.';
  } else if (v === 1) {
    decls = [L(['class ' + A + ' {', '    static String who() { return ' + q(A) + '; }', '}']), L(['class ' + B + ' extends ' + A + ' {', '    static String who() { return ' + q(B) + '; }', '}'])];
    body = [A + ' x = new ' + B + '();', 'System.out.println(x.who());']; ans = A;
    ex = 'Статические методы не переопределяются, а скрываются. Вызов x.who() выбирается по типу переменной (' + A + ') на этапе компиляции: ' + A + '.';
  } else if (v === 2) {
    const a = A.toLowerCase(), b = B.toLowerCase();
    decls = [L(['class ' + A + ' {', '    String name = ' + q(a) + ';', '}']), L(['class ' + B + ' extends ' + A + ' {', '    String name = ' + q(b) + ';', '}'])];
    body = [A + ' x = new ' + B + '();', 'System.out.println(x.name + " " + ((' + B + ') x).name);']; ans = a + ' ' + b;
    ex = 'Поля не полиморфны: x.name берётся по типу переменной (' + A + ' → "' + a + '"), а после приведения к ' + B + ' — поле подкласса ("' + b + '").';
  } else {
    decls = [L(['class ' + A + ' {', '    String who() { return ' + q(A) + '; }', '}']), L(['class ' + B + ' extends ' + A + ' {', '    @Override', '    String who() { return ' + q(B + '-') + ' + super.who(); }', '}'])];
    body = [A + ' x = new ' + B + '();', 'System.out.println(x.who());']; ans = B + '-' + A;
    ex = 'Вызывается переопределённый who() из ' + B + ', а super.who() внутри него вызывает версию родителя: "' + B + '-" + "' + A + '".';
  }
  return { code: program(decls, [], body), answer: ans, explain: ex };
}

/* 2. Перегрузка: какой метод выберет компилятор */
const PRIM = ['byte', 'short', 'int', 'long', 'float', 'double'], RANK = t => PRIM.indexOf(t);
const BOX = { int: 'Integer', char: 'Character', long: 'Long', short: 'Short', float: 'Float', double: 'Double' };
const widens = (from, to) => from === to || (from === 'char' ? ['int', 'long', 'float', 'double'].includes(to) : RANK(from) >= 0 && RANK(to) > RANK(from));
const refSub = (from, to) => from === to || to === 'Object';
function resolve(arg, params) {
  const isPrim = arg in BOX || arg === 'byte';
  let app = params.filter(p => isPrim ? (p in BOX || p === 'byte') && widens(arg, p) : !(p in BOX) && refSub(arg, p));
  if (!app.length) {
    app = params.filter(p => isPrim ? !(p in BOX) && refSub(BOX[arg], p) : (p in BOX) && arg === 'Integer' && widens('int', p));
  }
  if (!app.length) return null;
  return app.sort((x, y) => (x in BOX) && (y in BOX) ? RANK(x) - RANK(y) : (x === 'Object' ? 1 : y === 'Object' ? -1 : 0))[0];
}
function gOverload(R) {
  for (;;) {
    const params = R.sample(['int', 'long', 'double', 'Integer', 'Object'], R.int(3, 4)).sort((a, b) => ['int', 'long', 'double', 'Integer', 'Object'].indexOf(a) - ['int', 'long', 'double', 'Integer', 'Object'].indexOf(b));
    const args = R.sample([['5', 'int'], ["'a'", 'char'], ['5L', 'long'], ['Integer.valueOf(7)', 'Integer'], ['"s"', 'String'], ['2.5f', 'float']], 3);
    const res = args.map(a => resolve(a[1], params));
    if (res.some(x => x == null)) continue;
    if (new Set(res).size < 2) continue;
    const members = params.map(p => 'static String m(' + p + ' x) { return ' + q(p) + '; }');
    const body = ['System.out.println(' + args.map(a => 'm(' + a[0] + ')').join(' + " " + ') + ');'];
    const why = args.map((a, i) => 'm(' + a[0] + '): аргумент ' + a[1] + ' → ' + res[i]).join('; ');
    return { code: program([], members, body), answer: res.join(' '), explain: 'Перегрузка выбирается при компиляции: сначала без упаковки (расширение примитивов int → long → double, подтипы ссылок), только потом с упаковкой/распаковкой, и из подходящих — самый конкретный. ' + why + '.' };
  }
}

/* 3. Порядок инициализации */
function gInit(R) {
  const [P, C] = R.pick([['Parent', 'Child'], ['Animal', 'Dog'], ['Base', 'Sub'], ['Device', 'Phone']]);
  const letters = R.shuffle('ABCDEFGHKMNPRSTX'.split('')).slice(0, 6);
  const [ps, pi, pc, cs, ci, cc] = letters, withInst = R.r() < 0.7;
  const pr = c => 'System.out.print(' + q(c) + ');';
  const decls = [L(['class ' + P + ' {', '    static { ' + pr(ps) + ' }', ...(withInst ? ['    { ' + pr(pi) + ' }'] : []), '    ' + P + '() { ' + pr(pc) + ' }', '}']),
    L(['class ' + C + ' extends ' + P + ' {', '    static { ' + pr(cs) + ' }', ...(withInst ? ['    { ' + pr(ci) + ' }'] : []), '    ' + C + '() { ' + pr(cc) + ' }', '}'])];
  const seq = R.pick([[C], [C, C], [P, C], [C, P]]);
  const init = new Set(); let out = '';
  for (const k of seq) {
    if (!init.has(P)) { init.add(P); out += ps; }
    if (k === C && !init.has(C)) { init.add(C); out += cs; }
    out += (withInst ? pi : '') + pc;
    if (k === C) out += (withInst ? ci : '') + cc;
  }
  const body = seq.map(k => 'new ' + k + '();');
  return { code: program(decls, [], body), answer: out,
    explain: 'Статические блоки выполняются один раз — при первой загрузке класса, сначала у родителя. При каждом создании объекта: сначала конструктор родителя (super() вызывается неявно), причём перед телом конструктора выполняются блоки инициализации экземпляра; потом то же для подкласса. Итог: ' + out + '.' };
}

/* 4. try / finally / return */
function gFinally(R) {
  const v = R.int(0, 3), k1 = R.int(1, 9), k2 = R.int(10, 19);
  let members, body, ans, ex;
  if (v === 0) {
    members = [L(['static int f() {', '    int x = ' + k1 + ';', '    try {', '        return x;', '    } finally {', '        x = ' + k2 + ';', '    }', '}'])];
    body = ['System.out.println(f());']; ans = String(k1);
    ex = 'Значение для return вычисляется до выполнения finally. Изменение x в finally уже не влияет на возвращаемое значение: ' + k1 + '.';
  } else if (v === 1) {
    members = [L(['static int f() {', '    try {', '        return ' + k1 + ';', '    } finally {', '        return ' + k2 + ';', '    }', '}'])];
    body = ['System.out.println(f());']; ans = String(k2);
    ex = 'finally выполняется всегда, и return в finally заменяет результат из try: ' + k2 + '.';
  } else if (v === 2) {
    const thr = R.r() < 0.6;
    members = [L(['static String f() {', '    String s = "";', '    try {', '        s += "t";', ...(thr ? ['        throw new RuntimeException();'] : ['        s += "u";']), '    } catch (RuntimeException e) {', '        s += "c";', '    } finally {', '        s += "f";', '    }', '    return s;', '}'])];
    body = ['System.out.println(f());']; ans = thr ? 'tcf' : 'tuf';
    ex = thr ? 'В try добавляется "t", исключение переходит в catch ("c"), затем всегда выполняется finally ("f").' : 'Исключения нет: try ("t", "u"), catch пропускается, finally выполняется всегда ("f").';
  } else {
    members = [L(['static void g() {', '    try {', '        System.out.print("A");', '        return;', '    } finally {', '        System.out.print("B");', '    }', '}'])];
    body = ['g();', 'System.out.print("C");']; ans = 'ABC';
    ex = 'return в try не отменяет finally: сначала "A", перед выходом из метода "B", затем в main "C".';
  }
  return { code: program([], members, body), answer: ans, explain: ex };
}

/* 5. static-поля */
function gStatic(R) {
  const n = R.pick(['Counter', 'Ticket', 'User', 'Order']), s0 = R.int(0, 5), v = R.int(0, 1);
  let decls, body, ans, ex;
  if (v === 0) {
    const cnt = R.int(2, 4);
    decls = [L(['class ' + n + ' {', '    static int total = ' + s0 + ';', '    int id;', '    ' + n + '() {', '        total++;', '        id = total;', '    }', '}'])];
    const vars = ['a', 'b', 'c', 'd'].slice(0, cnt);
    body = vars.map(x => n + ' ' + x + ' = new ' + n + '();').concat(['System.out.println(a.id + " " + ' + vars[cnt - 1] + '.id + " " + ' + n + '.total);']);
    ans = (s0 + 1) + ' ' + (s0 + cnt) + ' ' + (s0 + cnt);
    ex = 'total — одно поле на весь класс, id — своё у каждого объекта. После ' + cnt + ' созданий total = ' + (s0 + cnt) + '; a.id = ' + (s0 + 1) + ', последний id = ' + (s0 + cnt) + '.';
  } else {
    const val = R.int(10, 50);
    decls = [L(['class ' + n + ' {', '    static int shared = ' + s0 + ';', '    int own = ' + s0 + ';', '}'])];
    body = [n + ' a = new ' + n + '();', n + ' b = new ' + n + '();', 'a.shared = ' + val + ';', 'a.own = ' + val + ';', 'System.out.println(b.shared + " " + b.own);'];
    ans = val + ' ' + s0;
    ex = 'Статическое поле общее для всех объектов (запись через a видна через b), а обычное поле у каждого объекта своё.';
  }
  return { code: program(decls, [], body), answer: ans, explain: ex };
}

/* 6. equals, ==, record */
function gEquals(R) {
  const v1 = R.int(1, 9), withEq = R.r() < 0.4;
  const decls = [withEq
    ? L(['class Point {', '    int v;', '    Point(int v) { this.v = v; }', '    @Override', '    public boolean equals(Object o) {', '        return o instanceof Point p && p.v == v;', '    }', '}'])
    : L(['class Point {', '    int v;', '    Point(int v) { this.v = v; }', '}']), 'record Pair(int v) {}'];
  const exprs = R.sample([['a.equals(b)', withEq], ['a == b', false], ['c.equals(d)', true], ['c == d', false], ['s1 == s2', true], ['s1 == s3', false], ['s1.equals(s3)', true]], 3);
  const body = ['Point a = new Point(' + v1 + '), b = new Point(' + v1 + ');', 'Pair c = new Pair(' + v1 + '), d = new Pair(' + v1 + ');', 'String s1 = "hi", s2 = "hi", s3 = new String("hi");',
    'System.out.println(' + exprs.map(e => '(' + e[0] + ')').join(' + " " + ') + ');'];
  return { code: program(decls, [], body), answer: exprs.map(e => String(e[1])).join(' '),
    explain: '== сравнивает ссылки: разные объекты → false. equals() у Point ' + (withEq ? 'переопределён и сравнивает v' : 'не переопределён, поэтому работает как ==') + '. record сам генерирует equals() по компонентам. Строковые литералы "hi" — один объект из пула строк, а new String() создаёт новый.' };
}

/* 7. default-методы */
function gDefault(R) {
  const v = R.int(0, 2);
  const iface = L(['interface Greeter {', '    default String hi() { return "I"; }', '}']);
  let decls, ans, ex;
  if (v === 0) { decls = [iface, L(['class Base {', '    public String hi() { return "B"; }', '}']), L(['class Impl extends Base implements Greeter {', '}'])]; ans = 'B'; ex = 'Правило «класс побеждает»: метод из суперкласса Base важнее default-метода интерфейса.'; }
  else if (v === 1) { decls = [iface, L(['class Impl implements Greeter {', '}'])]; ans = 'I'; ex = 'Impl не переопределяет hi(), поэтому используется default-метод интерфейса.'; }
  else { decls = [iface, L(['class Impl implements Greeter {', '    @Override', '    public String hi() { return Greeter.super.hi() + "X"; }', '}'])]; ans = 'IX'; ex = 'Greeter.super.hi() вызывает default-реализацию интерфейса ("I"), к ней добавляется "X".'; }
  return { code: program(decls, [], ['System.out.println(new Impl().hi());']), answer: ans, explain: ex };
}

/* 8. enum */
function gEnum(R) {
  const set = R.pick([['RED', 'GREEN', 'BLUE', 'BLACK'], ['MON', 'TUE', 'WED', 'THU', 'FRI'], ['NORTH', 'EAST', 'SOUTH', 'WEST'], ['LOW', 'MEDIUM', 'HIGH']]);
  const name = { RED: 'Color', MON: 'Day', NORTH: 'Dir', LOW: 'Level' }[set[0]];
  const i = R.int(0, set.length - 1), j = R.int(0, set.length - 1), v = R.int(0, 2);
  let expr, ans, ex;
  if (v === 0) { expr = name + '.' + set[i] + '.ordinal() + " " + ' + name + '.values().length'; ans = i + ' ' + set.length; ex = 'ordinal() — номер константы с нуля (' + set[i] + ' → ' + i + '), values() — массив всех констант (' + set.length + ').'; }
  else if (v === 1) { expr = name + '.valueOf("' + set[i] + '").compareTo(' + name + '.' + set[j] + ')'; ans = String(i - j); ex = 'compareTo у enum сравнивает порядковые номера: ' + i + ' − ' + j + ' = ' + (i - j) + '.'; }
  else { expr = name + '.values()[' + i + '].name() + ' + name + '.' + set[j] + '.ordinal()'; ans = set[i] + j; ex = 'values()[' + i + '] — константа ' + set[i] + ', name() даёт её имя; ' + set[j] + '.ordinal() = ' + j + ', число приписывается к строке.'; }
  return { code: program(['enum ' + name + ' { ' + set.join(', ') + ' }'], [], ['System.out.println(' + expr + ');']), answer: ans, explain: ex };
}

/* 9. какой catch сработает */
const EX_PARENT = { IllegalArgumentException: 'RuntimeException', ArithmeticException: 'RuntimeException', NullPointerException: 'RuntimeException', RuntimeException: 'Exception', Exception: 'Throwable' };
const isA = (x, y) => { for (let t = x; t; t = EX_PARENT[t]) if (t === y) return true; return false; };
function gCatch(R) {
  for (;;) {
    const thrown = R.pick(['IllegalArgumentException', 'ArithmeticException', 'NullPointerException', 'RuntimeException']);
    const pool = R.sample(['IllegalArgumentException', 'ArithmeticException', 'NullPointerException', 'RuntimeException', 'Exception'], R.int(2, 3));
    pool.sort((a, b) => (isA(a, b) ? -1 : isA(b, a) ? 1 : 0));
    let okOrder = true; for (let x = 0; x < pool.length; x++) for (let y = x + 1; y < pool.length; y++) if (isA(pool[y], pool[x])) okOrder = false;
    if (!okOrder) continue;
    const hit = pool.findIndex(c => isA(thrown, c));
    if (hit < 0) continue;
    const labels = ['1', '2', '3'];
    const div = thrown === 'ArithmeticException' && R.r() < 0.5;
    const members = div ? [] : ['static void fail() {\n    throw new ' + thrown + '();\n}'];
    const thr = div ? ['int zero = 0;', 'System.out.print(10 / zero);'] : ['fail();'];
    const body = ['try {', '    System.out.print("T");', ...thr.map(l => '    ' + l), '    System.out.print("X");', ...pool.flatMap((c, k) => ['} catch (' + c + ' e) {', '    System.out.print("' + labels[k] + '");']), '} finally {', '    System.out.print("F");', '}', 'System.out.print("E");'];
    return { code: program([], members, body), answer: 'T' + labels[hit] + 'FE',
      explain: 'После исключения остаток try ("X") не выполняется. Срабатывает первый catch, тип которого подходит: ' + thrown + ' является ' + pool[hit] + ' → "' + labels[hit] + '". Затем finally ("F") и код после try ("E"). Подклассы должны стоять в catch раньше родителей, иначе ошибка компиляции.' };
  }
}

/* 10. скомпилируется ли? (проверяется javac) */
const COMPILE = [
  { ok: false, decls: ['abstract class Shape {\n    abstract double area();\n}'], body: ['Shape s = new Shape();'], ex: 'Нельзя создать объект абстрактного класса.' },
  { ok: true, decls: ['abstract class Shape {\n    abstract double area();\n}', 'class Square extends Shape {\n    double area() { return 4; }\n}'], body: ['Shape s = new Square();', 'System.out.println(s.area());'], ex: 'Переменная абстрактного типа может ссылаться на объект конкретного подкласса, который реализовал все абстрактные методы.' },
  { ok: false, decls: ['class A {\n    abstract void f();\n}'], body: [], ex: 'Абстрактный метод может быть только в абстрактном классе (или интерфейсе).' },
  { ok: false, decls: ['class A {\n    final void f() {}\n}', 'class B extends A {\n    void f() {}\n}'], body: [], ex: 'final-метод нельзя переопределить.' },
  { ok: false, decls: ['final class A {}', 'class B extends A {}'], body: [], ex: 'От final-класса нельзя наследоваться.' },
  { ok: false, decls: ['interface I {\n    void f();\n}', 'class C implements I {\n    void f() {}\n}'], body: [], ex: 'Методы интерфейса неявно public, а при реализации нельзя сужать доступ: нужно public void f().' },
  { ok: true, decls: ['interface I {\n    void f();\n}', 'class C implements I {\n    public void f() {}\n}'], body: ['I i = new C();', 'i.f();'], ex: 'Метод реализован с модификатором public — всё корректно.' },
  { ok: false, decls: ['class A {\n    A(int x) {}\n}', 'class B extends A {\n    B() {}\n}'], body: [], ex: 'Конструктор B неявно вызывает super(), но у A нет конструктора без параметров.' },
  { ok: true, decls: ['class A {\n    A(int x) {}\n}', 'class B extends A {\n    B() { super(1); }\n}'], body: [], ex: 'Конструктор родителя с параметром вызван явно через super(1).' },
  { ok: false, decls: ['class A {\n    private A() {}\n}', 'class B extends A {}'], body: [], ex: 'Конструктор A приватный, поэтому неявный super() в B недоступен.' },
  { ok: false, decls: ['record Point(int x, int y) {}'], body: ['Point p = new Point(1, 2);', 'p.x = 5;'], ex: 'Компоненты record — private final поля; изменить их нельзя (и снаружи к полю нет доступа).' },
  { ok: true, decls: ['record Point(int x, int y) {}'], body: ['Point p = new Point(1, 2);', 'System.out.println(p.x() + p.y());'], ex: 'Методы доступа record называются как компоненты: x(), y().' },
  { ok: false, decls: ['enum Level { LOW, HIGH }'], body: ['Level l = new Level();'], ex: 'Объекты enum создавать через new нельзя — существуют только объявленные константы.' },
  { ok: false, decls: ['class Counter {\n    int count;\n    static void inc() { count++; }\n}'], body: [], ex: 'Из статического метода нельзя обращаться к полю экземпляра без объекта.' },
  { ok: true, decls: ['class Counter {\n    static int count;\n    static void inc() { count++; }\n}'], body: ['Counter.inc();'], ex: 'Статический метод работает со статическим полем — всё корректно.' },
  { ok: false, decls: [], body: ['final int x = 1;', 'x = 2;'], ex: 'final-переменной нельзя присвоить значение повторно.' },
  { ok: false, decls: ['interface Shape {\n    double area();\n}'], body: ['Shape s = new Shape();'], ex: 'Нельзя создать объект интерфейса через new Shape() (без тела анонимного класса).' },
  { ok: true, decls: ['interface Shape {\n    double area();\n}'], body: ['Shape s = new Shape() {', '    public double area() { return 1; }', '};'], ex: 'Это анонимный класс, реализующий интерфейс, — так можно.' },
  { ok: false, decls: ['class A {\n    void f() throws Exception {}\n}'], body: ['new A().f();'], ex: 'f() бросает проверяемое Exception, а main его не перехватывает и не объявляет в throws.' }
];
function gCompile(R) {
  const t = R.pick(COMPILE);
  return { type: 'single', prompt: 'Скомпилируется ли этот код?', code: program(t.decls, [], t.body), opts: ['Скомпилируется', 'Ошибка компиляции'], correctIdx: t.ok ? 0 : 1,
    explain: (t.ok ? 'Скомпилируется. ' : 'Ошибка компиляции. ') + t.ex, compileOk: t.ok };
}

const GENS = [gPoly, gOverload, gInit, gFinally, gStatic, gEquals, gDefault, gEnum, gCatch];
function build(R) {
  return GENS.map(g => Object.assign({ type: 'text', prompt: 'Что выведет программа?' }, g(R))).concat([gCompile(R)]);
}
return { build, GENS, gCompile, COMPILE, program, resolve };
})();
if (typeof module !== 'undefined') module.exports = KR2CODE;

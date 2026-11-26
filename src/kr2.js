/* Программирование, контрольная работа №2: ООП (SOLID, переопределение, вложенные классы, исключения, enum, record, интерфейсы) */
var KR2 = (function () {
'use strict';
function mk(seed) {
  let a = seed >>> 0;
  const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const R = { r, int: (x, y) => x + Math.floor(r() * (y - x + 1)), pick: arr => arr[Math.floor(r() * arr.length)] };
  R.shuffle = arr => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  R.sample = (arr, n) => R.shuffle(arr).slice(0, n);
  return R;
}
const L = a => a.join('\n');
const SOLID = ['S', 'O', 'L', 'I', 'D'];

/* ---------- 1–3. SOLID ---------- */
const SOLID_T = {
  I: R => {
    const v = R.pick([['Animal', 'run', 'jump'], ['Worker', 'work', 'eat'], ['Printer', 'print', 'scan', 'fax'], ['Animal', 'swim', 'fly'], ['Device', 'call', 'takePhoto', 'playMusic'], ['Shape', 'area', 'volume']]);
    return { code: L(['public interface ' + v[0] + ' {', '', ...v.slice(1).map(m => '    void ' + m + '();'), '', '}']), ans: ['I'],
      why: 'Нарушен I (Interface Segregation): «толстый» интерфейс заставляет реализовывать методы, которые нужны не всем (' + v.slice(1).join(', ') + '). Его стоит разделить на несколько маленьких интерфейсов.' };
  },
  D: R => {
    const v = R.pick([['Car', 'Wheel', 'wheels', true], ['UserService', 'MySqlDatabase', 'db'], ['Notifier', 'EmailSender', 'sender'], ['Lamp', 'PowerSwitch', 'powerSwitch'], ['Report', 'PdfPrinter', 'printer'], ['Robot', 'LithiumBattery', 'battery']]);
    const code = v[3]
      ? L(['public class Car {', '', '    private Wheel[] wheels;', '', '    public Car() {', '        this.wheels = new Wheel[]{ new Wheel() };', '    }', '}'])
      : L(['public class ' + v[0] + ' {', '', '    private ' + v[1] + ' ' + v[2] + ';', '', '    public ' + v[0] + '() {', '        this.' + v[2] + ' = new ' + v[1] + '();', '    }', '}']);
    return { code, ans: ['D'], deps: [v[1]],
      why: 'Нарушен D (Dependency Inversion): класс сам создаёт конкретную зависимость (new ' + v[1] + ') и зависит от реализации, а не от абстракции. Зависимость лучше передавать извне через интерфейс.' };
  },
  SO: R => {
    const v = R.pick([['Loser', 'age', 'luck'], ['Student', 'age', 'grade'], ['Account', 'id', 'balance'], ['Player', 'level', 'score'], ['Box', 'width', 'height']]);
    return { code: L(['public class ' + v[0] + ' {', '', '    public int ' + v[1] + ';', '    public int ' + v[2] + ';', '', '}']), ans: ['S', 'O'],
      why: 'На рубежке для класса с открытыми (public) полями принят ответ S и O: нет инкапсуляции — любой внешний код может менять состояние, поэтому класс нельзя расширять, не трогая код, который с этими полями работает.' };
  },
  S: R => {
    const n = R.pick(['Report', 'Invoice', 'Order']);
    return { code: L(['public class ' + n + ' {', '', '    public String generate() { ... }', '    public void print() { ... }', '    public void saveToFile(String path) { ... }', '    public void sendByEmail(String to) { ... }', '', '}']), ans: ['S'],
      why: 'Нарушен S (Single Responsibility): у класса несколько причин для изменения — формирование данных, печать, сохранение в файл и отправка почтой. Эти обязанности нужно разнести по разным классам.' };
  },
  O: R => {
    const v = R.pick([['AreaCalculator', 'area', 'Shape', [['Circle', 'Math.PI * c.r * c.r'], ['Square', 's.a * s.a']]], ['SoundPlayer', 'sound', 'Animal', [['Cat', '"Meow"'], ['Dog', '"Woof"']]]]);
    const [cls, m, base, kinds] = v, ret = cls === 'AreaCalculator' ? 'double' : 'String';
    const vars = ['c', 's'];
    return { code: L(['public class ' + cls + ' {', '', '    public ' + ret + ' ' + m + '(' + base + ' x) {',
      '        if (x instanceof ' + kinds[0][0] + ' ' + vars[0] + ') return ' + kinds[0][1] + ';',
      '        if (x instanceof ' + kinds[1][0] + ' ' + vars[1] + ') return ' + kinds[1][1] + ';',
      '        throw new IllegalArgumentException();', '    }', '}']), ans: ['O'],
      why: 'Нарушен O (Open/Closed): чтобы поддержать новый подтип ' + base + ', придётся менять этот метод (добавлять ещё одну проверку instanceof). Правильнее сделать ' + m + '() методом самого ' + base + ' и переопределять его в подклассах.' };
  },
  L: R => {
    const v = R.pick([['Bird', 'Penguin', 'fly'], ['Vehicle', 'Bicycle', 'refuel'], ['Account', 'FixedDeposit', 'withdraw']]);
    return { code: L(['public class ' + v[1] + ' extends ' + v[0] + ' {', '', '    @Override', '    public void ' + v[2] + '() {', '        throw new UnsupportedOperationException();', '    }', '', '}']), ans: ['L'],
      why: 'Нарушен L (Liskov Substitution): ' + v[1] + ' нельзя использовать везде, где ожидается ' + v[0] + ' — вызов ' + v[2] + '() вместо работы бросает исключение, то есть подкласс ломает поведение базового класса.' };
  }
};

/* ---------- 4. Переопределённые методы ---------- */
const OVR = {
  hashCode: { lines: ['@Override', 'public int hashCode()', '{ return super.hashCode(); }'], ov: 'hashCode' },
  hashCodeNoAnn: { lines: ['public int hashCode()', '{ return 42; }'], ov: 'hashCode' },
  toString: { lines: ['public String toString()', '{ return "MyClass {}"; }'], ov: 'toString' },
  toStringAnn: { lines: ['@Override', 'public String toString()', '{ return "MyClass {}"; }'], ov: 'toString' },
  clone: { lines: ['@Override', 'protected Object clone() { return null; }'], ov: 'clone' },
  equalsObj: { lines: ['public boolean equals(Object o)', '{ return this == o; }'], ov: 'equals' },
  equalsOverload: { lines: ['public boolean equals(MyClass o)', '{ return this == o; }'], ov: null, trap: 'equals(MyClass) — это перегрузка, а не переопределение: у Object метод equals(Object).' },
  hashcodeLower: { lines: ['public int hashcode()', '{ return 1; }'], ov: null, trap: 'hashcode() со строчной c — новый метод, а не переопределение hashCode().' },
  tostringLower: { lines: ['public String tostring()', '{ return ""; }'], ov: null, trap: 'tostring() со строчной s — новый метод, а не переопределение toString().' },
  save: { lines: ['public void save() { }'], ov: null }
};
function genOverride(R) {
  for (;;) {
    const picks = R.sample(Object.keys(OVR), R.int(3, 4));
    const ovs = picks.map(k => OVR[k].ov).filter(Boolean);
    if (new Set(ovs).size !== ovs.length) continue; // один и тот же метод дважды
    if (picks.includes('equalsObj') && picks.includes('equalsOverload')) continue;
    if (picks.includes('hashCode') && picks.includes('hashCodeNoAnn')) continue;
    const body = [];
    picks.forEach((k, i) => { if (i) body.push(''); OVR[k].lines.forEach(l => body.push('    ' + l)); });
    const opts = ['equals', 'hashCode', 'toString', 'clone', 'save', 'asString'];
    const traps = picks.map(k => OVR[k].trap).filter(Boolean);
    return { prompt: 'Укажите все переопределённые методы', code: L(['public class MyClass {', ...body, '}']), opts, correct: opts.map(o => ovs.includes(o)),
      explain: 'Переопределены методы класса Object: ' + (ovs.length ? ovs.join(', ') : 'нет') + '. Аннотация @Override не обязательна — toString() без неё всё равно переопределяет метод Object. ' + traps.join(' '), secs: 60, javac: { cls: 'MyClass', src: L(['public class MyClass {', ...body, '}']) } };
  }
}

/* ---------- 5. Вызов метода внешнего класса ---------- */
function genInner(R) {
  const [O, I, m, im] = R.pick([['Animal', 'Head', 'doIt', 'think'], ['Car', 'Engine', 'honk', 'start'], ['House', 'Door', 'lightOn', 'open'], ['Robot', 'Arm', 'beep', 'move'], ['Phone', 'Screen', 'ring', 'show']]);
  const kind = R.pick(['inner', 'inner', 'static', 'staticMethod', 'clash']);
  const outerM = kind === 'staticMethod' ? '    static void ' + m + '() {}' : '    void ' + m + '() {}';
  const inner = [kind === 'static' ? '    public static class ' + I + ' {' : '    public class ' + I + ' {'];
  if (kind === 'clash') inner.push('        void ' + m + '() {}', '');
  inner.push('        public void ' + im + '() {', '            //', '            // code here', '            //', '        }', '    }');
  const code = L(['public class ' + O + ' {', '', outerM, '', ...inner, '}']);
  let acc, ex;
  if (kind === 'inner') { acc = [m + '();', O + '.this.' + m + '();']; ex = I + ' — внутренний (не static) класс, у его объекта есть ссылка на внешний объект. Можно написать просто ' + m + '(); или явно ' + O + '.this.' + m + '();'; }
  else if (kind === 'clash') { acc = [O + '.this.' + m + '();']; ex = 'В ' + I + ' есть свой метод ' + m + '(), поэтому просто ' + m + '(); вызовет его. Метод внешнего класса вызывается через ' + O + '.this.' + m + '();'; }
  else if (kind === 'static') { acc = ['new ' + O + '().' + m + '();']; ex = I + ' — статический вложенный класс, ссылки на внешний объект у него нет (' + O + '.this не скомпилируется). Нужен объект: new ' + O + '().' + m + '();'; }
  else { acc = [m + '();', O + '.' + m + '();']; ex = 'Метод ' + m + '() статический, его можно вызвать по имени: ' + m + '(); или ' + O + '.' + m + '();'; }
  return { type: 'text', prompt: 'Замените комментарий на строку кода, которая вызывает метод ' + m + ' класса ' + O + '.', code, accept: acc, answer: acc[0], explain: ex, secs: 90,
    javac: { cls: O, src: code, slot: '            // code here', accept: acc } };
}

/* ---------- 6. Максимально абстрактный тип X ---------- */
const ABSTR = [
  { code: ['class Thrower {', '', '    public static void go(X x) throws X {', '        throw x;', '    }', '', '}'], ans: ['Throwable'], ex: 'Бросать (throw) и объявлять в throws можно любой подтип Throwable, а Throwable — самый общий из них.' },
  { code: ['class Closer {', '', '    public static void go(X x) throws Exception {', '        try (x) {', '        }', '    }', '', '}'], ans: ['AutoCloseable'], ex: 'В try-with-resources может стоять только объект, реализующий AutoCloseable (Closeable — его более узкий подтип).' },
  { code: ['class Walker {', '', '    public static void go(X x) {', '        for (Object o : x) {', '        }', '    }', '', '}'], ans: ['Iterable', 'Iterable<?>', 'Iterable<Object>', 'Iterable<? extends Object>'], ex: 'Цикл for-each работает с массивами и объектами Iterable; самый абстрактный тип — Iterable (коллекции — его подтипы).' },
  { code: ['class Printer {', '', '    public static String go(X x) {', '        return x.toString();', '    }', '', '}'], ans: ['Object'], ex: 'toString() объявлен в Object, поэтому подходит любой объект.' },
  { code: ['class Counter {', '', '    public static int go(X x) {', '        return x.length();', '    }', '', '}'], ans: ['CharSequence'], ex: 'Метод length() объявлен в интерфейсе CharSequence (его реализуют String, StringBuilder и др.).' },
  { code: ['class Starter {', '', '    public static void go(X x) {', '        new Thread(x).start();', '    }', '', '}'], ans: ['Runnable'], ex: 'Конструктор Thread принимает Runnable.' },
  { code: ['class Closer2 {', '', '    public static void go(X x) throws Exception {', '        x.close();', '    }', '', '}'], ans: ['AutoCloseable'], ex: 'close() с throws Exception объявлен в AutoCloseable — самом общем интерфейсе с этим методом.' }
];
function genAbstract(R) {
  const t = R.pick(ABSTR);
  return { type: 'text', prompt: 'Укажите максимально абстрактный допустимый тип данных X, при котором этот код скомпилируется', code: L(t.code), accept: t.ans, answer: t.ans[0], explain: t.ex, secs: 60,
    javac: { cls: t.code[0].split(' ')[1], src: L(t.code), x: t.ans } };
}

/* ---------- 7. Свойства исключений ---------- */
const EXC = [
  { q: 'Укажите все свойства проверяемых исключений (checked)', items: [
    [false, 'Блок finally обязательный'], [true, 'Генерируются компилятором'], [false, 'Генерируются JVM'], [false, 'Без try-catch не скомпилируется'],
    [true, 'try-catch или throws обязательны'], [true, 'Наследуются от Throwable'], [false, 'Наследуются от Error'], [false, 'Не могут иметь конструктора по умолчанию'], [false, 'Не содержат в себе стек вызовов']],
    ex: 'Проверяемые исключения наследуются от Exception (а значит, и от Throwable), но не от RuntimeException. Компилятор требует их обработать: try-catch или throws — что-то одно, поэтому «без try-catch не скомпилируется» неверно (хватит throws). На рубежке принят вариант «генерируются компилятором» — точнее, они проверяются компилятором. Стек вызовов есть у любого исключения, finally не обязателен.' },
  { q: 'Укажите все свойства непроверяемых исключений (unchecked)', items: [
    [true, 'Наследуются от RuntimeException или Error'], [true, 'Компилятор не требует их обрабатывать'], [false, 'try-catch или throws обязательны'], [true, 'Их можно перехватить в catch'],
    [true, 'Наследуются от Throwable'], [false, 'Не содержат в себе стек вызовов'], [false, 'Наследуются только от Exception напрямую'], [false, 'Блок finally обязательный']],
    ex: 'Непроверяемые — это RuntimeException, Error и их подклассы. Компилятор не заставляет их обрабатывать, но поймать в catch их можно. Как и все исключения, они наследуются от Throwable и содержат стек вызовов.' },
  { q: 'Укажите все верные утверждения об Error', items: [
    [true, 'Наследуется от Throwable'], [false, 'Наследуется от Exception'], [true, 'Обозначает серьёзные проблемы, например OutOfMemoryError'], [false, 'Обязательно указывать в throws'],
    [true, 'Является непроверяемым'], [false, 'Не может быть перехвачен в catch']],
    ex: 'Error — непроверяемый, прямой наследник Throwable (не Exception). Обычно его не обрабатывают, но синтаксически catch (Error e) допустим.' }
];
function genExc(R) {
  const t = R.pick([EXC[0], EXC[0], EXC[1], EXC[2]]);
  const it = R.shuffle(t.items);
  return { prompt: t.q, opts: it.map(x => x[1]), correct: it.map(x => x[0]), explain: t.ex, secs: 60 };
}

/* ---------- 8. enum ---------- */
function genEnum(R) {
  if (R.r() < 0.65) {
    const pool = [[true, 'name()'], [true, 'ordinal()'], [true, 'values()'], [true, 'valueOf(String)'], [false, 'toString()'], [false, 'hashCode()'], [false, 'equals(Object)'],
      [false, 'applySelfEffect(...)'], [false, 'order()'], [false, 'size()'], [false, 'getName()'], [false, 'sayPhrase(...)'], [false, 'завалитьРубежку()']];
    const tr = R.sample(pool.filter(x => x[0]), R.int(2, 3)), fl = R.sample(pool.filter(x => !x[0]), 7 - tr.length), it = R.shuffle(tr.concat(fl));
    return { prompt: 'Укажите методы enum (определённые ТОЛЬКО в enum)', opts: it.map(x => x[1]), correct: it.map(x => x[0]), secs: 60,
      explain: 'Только у перечислений есть name(), ordinal() (из класса Enum) и статические values(), valueOf(String), которые создаёт компилятор. toString(), hashCode(), equals() есть у любого объекта (Object).' };
  }
  const pool = [[true, 'name()'], [true, 'ordinal()'], [true, 'toString()'], [true, 'hashCode()'], [true, 'values()'], [true, 'compareTo(...)'],
    [false, 'order()'], [false, 'getName()'], [false, 'index()'], [false, 'applySelfEffect(...)'], [false, 'sayPhrase(...)'], [false, 'setOrdinal(int)']];
  const tr = R.sample(pool.filter(x => x[0]), R.int(3, 4)), fl = R.sample(pool.filter(x => !x[0]), 7 - tr.length), it = R.shuffle(tr.concat(fl));
  return { prompt: 'Укажите методы, которые есть у любого enum без объявления', opts: it.map(x => x[1]), correct: it.map(x => x[0]), secs: 60,
    explain: 'Любое перечисление наследует java.lang.Enum: name(), ordinal(), compareTo(), а также методы Object (toString(), hashCode()); компилятор добавляет values() и valueOf(String). Изменить ordinal нельзя.' };
}

/* ---------- 9. record ---------- */
function genRecord(R) {
  const pool = [[true, 'От record нельзя наследоваться'], [true, 'Не может содержать полей, кроме указанных в конструкторе'], [true, 'Может реализовывать интерфейсы'],
    [true, 'Автоматически генерирует equals(), hashCode() и toString()'], [true, 'Поля-компоненты неизменяемые (final)'], [true, 'Может содержать статические поля и методы'],
    [false, 'Может наследоваться от других классов'], [false, 'Не может реализовывать интерфейсы'], [false, 'Для компонентов создаются сеттеры'],
    [false, 'Методы доступа называются getX()'], [false, 'Может быть объявлен abstract']];
  const classic = R.r() < 0.35;
  let it;
  if (classic) it = [pool[6], pool[1], pool[7], pool[0]];
  else { const tr = R.sample(pool.filter(x => x[0]), R.int(2, 3)), fl = R.sample(pool.filter(x => !x[0]), 5 - tr.length); it = R.shuffle(tr.concat(fl)); }
  return { prompt: 'Укажите все свойства рекордов (record)', opts: it.map(x => x[1]), correct: it.map(x => x[0]), secs: 60,
    explain: 'record — неявно final класс, наследник java.lang.Record: от него нельзя наследоваться и сам он не может extends другой класс, но может реализовывать интерфейсы. Поля экземпляра — только компоненты (private final), статические поля разрешены. Методы доступа называются как компоненты: x(), а не getX(); сеттеров нет.' };
}

/* ---------- 10. Ошибки в интерфейсе ---------- */
const IFACE = [
  { code: ['interface Runnable {', '    public void run() {', '        System.out.println("not implemented yet");', '    }', '}'],
    opts: [[false, 'public interface => private interface'], [false, 'interface => default interface'], [false, 'interface => functional interface'], [true, 'public void => default void'], [false, 'нет ошибок']],
    fixed: ['interface Runnable {', '    default void run() {', '        System.out.println("not implemented yet");', '    }', '}'],
    ex: 'Обычный метод интерфейса не может иметь тела. Метод с реализацией по умолчанию объявляется со словом default.' },
  { code: ['interface Shape {', '    double PI;', '    double area();', '}'],
    opts: [[true, 'double PI; => double PI = 3.14;'], [false, 'double area(); => default double area();'], [false, 'interface => abstract interface'], [false, 'нет ошибок']],
    fixed: ['interface Shape {', '    double PI = 3.14;', '    double area();', '}'],
    ex: 'Поля интерфейса — это public static final константы, их обязательно инициализировать.' },
  { code: ['interface Greeter {', '    protected void hello();', '}'],
    opts: [[true, 'protected void => void'], [false, 'protected void => private void'], [false, 'interface => functional interface'], [false, 'нет ошибок']],
    fixed: ['interface Greeter {', '    void hello();', '}'],
    ex: 'Методы интерфейса не могут быть protected: абстрактные методы неявно public. private тоже не подойдёт — приватный метод интерфейса обязан иметь тело.' },
  { code: ['interface Greeter {', '    private void hello();', '}'],
    opts: [[true, 'private void hello(); => private void hello() { }'], [false, 'private => protected'], [false, 'interface => functional interface'], [false, 'нет ошибок']],
    fixed: ['interface Greeter {', '    private void hello() { }', '}'],
    ex: 'Приватные методы интерфейса (Java 9+) обязаны иметь тело — это вспомогательные методы для default-методов.' },
  { code: ['interface Greeter {', '    void greet();', '    default void bye() { System.out.println("bye"); }', '    static Greeter of() { return () -> {}; }', '}'],
    opts: [[false, 'default void => void'], [false, 'static Greeter => default Greeter'], [false, 'interface => functional interface'], [true, 'нет ошибок']], fixed: null,
    ex: 'Ошибок нет: абстрактный метод, default-метод с телом и статический метод с телом — всё допустимо.' }
];
function genIface(R) {
  const t = R.pick([IFACE[0], IFACE[0], IFACE[1], IFACE[2], IFACE[3], IFACE[4]]);
  const keepLast = t.opts[t.opts.length - 1][1] === 'нет ошибок';
  const it = keepLast ? R.shuffle(t.opts.slice(0, -1)).concat([t.opts[t.opts.length - 1]]) : R.shuffle(t.opts);
  return { prompt: 'Укажите все ошибки в коде (что нужно исправить, чтобы код скомпилировался)', code: L(t.code), opts: it.map(x => x[1]), correct: it.map(x => x[0]), explain: t.ex, secs: 60,
    javac: { cls: t.code[0].split(' ')[1], broken: t.fixed ? L(t.code) : null, ok: L(t.fixed || t.code) } };
}

/* ---------- сборка варианта ---------- */
function solidQ(R, key) {
  const t = SOLID_T[key](R);
  return { prompt: 'Какие из SOLID принципов нарушены в коде?', code: t.code, opts: SOLID.slice(), correct: SOLID.map(s => t.ans.includes(s)), explain: t.why,
    secs: key === 'I' || key === 'SO' ? 30 : 60, solidKey: key, deps: t.deps };
}
function build(seed) {
  const R = mk(seed);
  const keys = R.sample(['I', 'D', 'SO', 'I', 'D', 'SO', 'S', 'O', 'L'], 9);
  const sol = []; for (const k of keys) { if (!sol.includes(k)) sol.push(k); if (sol.length === 3) break; }
  const theory = sol.map(k => solidQ(R, k)).concat([genOverride(R), genInner(R), genAbstract(R), genExc(R), genEnum(R), genRecord(R), genIface(R)])
    .map(q => Object.assign({ type: q.type || 'multi', pts: 0.04 }, q));
  const code = (typeof KR2CODE !== 'undefined' ? KR2CODE : require('./kr2code.js')).build(R).map(q => Object.assign({ pts: 0.06 }, q));
  return R.shuffle(theory.concat(code));
}
function normCode(s) { return String(s || '').replace(/\s+/g, '').replace(/;+$/, '').toLowerCase(); }
function grade(q, a) {
  if (q.type === 'single') return a === q.correctIdx ? 1 : 0;
  if (q.type === 'text' && !q.accept) return a != null && String(a).trim().replace(/\s+/g, ' ').replace(/^"(.*)"$/, '$1') === q.answer ? 1 : 0;
  if (q.type === 'text') return a != null && q.accept.some(x => normCode(x) === normCode(a)) ? 1 : 0;
  const sel = Array.isArray(a) ? a : [], nT = q.correct.filter(Boolean).length;
  const good = sel.filter(i => q.correct[i]).length, bad = sel.length - good;
  return Math.max(0, (good - bad) / nT);
}
return { build, grade, mk, SOLID_T, IFACE, ABSTR, OVR, genOverride, genInner, genAbstract, genIface, normCode };
})();
if (typeof module !== 'undefined') module.exports = KR2;

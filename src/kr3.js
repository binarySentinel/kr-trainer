/* Программирование, контрольная работа №3 (2 семестр): 10 вопросов по 2 балла */
var KR3 = (function () {
'use strict';
const IO = {"DataOutputStream":{"kind":"O","m":["flush","writeInt"]},"DataInputStream":{"kind":"I","m":["skip","available","readInt"]},"BufferedReader":{"kind":"R","m":["skip","ready","read"]},"BufferedWriter":{"kind":"W","m":["flush","write","newLine"]},"CharArrayWriter":{"kind":"W","m":["flush","write","toCharArray"]},"CharArrayReader":{"kind":"R","m":["skip","ready","read"]},"ByteArrayOutputStream":{"kind":"O","m":["flush","toByteArray"]},"ByteArrayInputStream":{"kind":"I","m":["skip","available"]},"ObjectInputStream":{"kind":"I","m":["skip","available","readObject","readInt"]},"ObjectOutputStream":{"kind":"O","m":["flush","writeInt"]},"FileWriter":{"kind":"W","m":["flush","write"]},"FileReader":{"kind":"R","m":["skip","ready","read"]},"StringReader":{"kind":"R","m":["skip","ready","read"]},"StringWriter":{"kind":"W","m":["flush","write"]},"FileInputStream":{"kind":"I","m":["skip","available"]},"FileOutputStream":{"kind":"O","m":["flush"]},"PrintWriter":{"kind":"W","m":["flush","write"]},"InputStreamReader":{"kind":"R","m":["skip","ready","read"]},"PrintStream":{"kind":"O","m":["flush"]},"BufferedInputStream":{"kind":"I","m":["skip","available"]},"BufferedOutputStream":{"kind":"O","m":["flush"]}};
function mk(seed) {
  let a = seed >>> 0;
  const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const R = { r, int: (x, y) => x + Math.floor(r() * (y - x + 1)), pick: arr => arr[Math.floor(r() * arr.length)] };
  R.shuffle = arr => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  R.sample = (arr, n) => R.shuffle(arr).slice(0, n);
  return R;
}
const L = a => a.join('\n');

/* 1. Классы java.io */
const IO_Q = [
  { q: 'В каких классах пакета java.io можно вызвать метод long skip(long n)?', test: c => IO[c].m.includes('skip'), ex: 'skip(long) объявлен в InputStream и Reader, поэтому есть у всех потоков ввода (байтовых и символьных), но не у потоков вывода.' },
  { q: 'В каких классах пакета java.io можно вызвать метод void flush()?', test: c => IO[c].m.includes('flush'), ex: 'flush() объявлен в OutputStream и Writer (интерфейс Flushable) — он есть у всех потоков вывода и отсутствует у потоков ввода.' },
  { q: 'В каких классах пакета java.io можно вызвать метод boolean ready()?', test: c => IO[c].m.includes('ready'), ex: 'ready() объявлен в Reader, поэтому есть только у символьных потоков ввода.' },
  { q: 'В каких классах пакета java.io можно вызвать метод int available()?', test: c => IO[c].m.includes('available'), ex: 'available() объявлен в InputStream — он есть у байтовых потоков ввода, но не у Reader.' },
  { q: 'В каких классах пакета java.io можно вызвать метод void write(String str)?', test: c => IO[c].m.includes('write'), ex: 'write(String) объявлен в Writer, поэтому есть у всех символьных потоков вывода; у байтовых OutputStream его нет.' },
  { q: 'Какие классы пакета java.io используются для чтения или записи последовательности символов?', test: c => 'RW'.includes(IO[c].kind), ex: 'Последовательности символов читают и пишут наследники Reader и Writer (в названии обычно Reader/Writer). Классы с Stream в названии работают с байтами.' },
  { q: 'Какие классы пакета java.io используются для чтения или записи последовательности байтов?', test: c => 'IO'.includes(IO[c].kind), ex: 'Байтовые потоки — наследники InputStream и OutputStream (в названии Stream). Reader и Writer работают с символами.' },
  { q: 'Какие классы пакета java.io используются для чтения данных (являются потоками ввода)?', test: c => 'RI'.includes(IO[c].kind), ex: 'Потоки ввода — наследники InputStream (байты) и Reader (символы).' }
];
const IO_POOL = ['DataOutputStream', 'BufferedReader', 'CharArrayWriter', 'ByteArrayOutputStream', 'ObjectInputStream', 'ByteArrayInputStream', 'FileWriter', 'StringReader', 'DataInputStream', 'BufferedWriter', 'CharArrayReader', 'ObjectOutputStream', 'FileReader', 'StringWriter', 'FileInputStream', 'FileOutputStream', 'PrintWriter', 'InputStreamReader', 'BufferedInputStream', 'BufferedOutputStream'];
function gIO(R) {
  for (;;) {
    const t = R.pick(IO_Q), opts = R.r() < 0.35 ? IO_POOL.slice(0, 8) : R.sample(IO_POOL, 8);
    const correct = opts.map(t.test), n = correct.filter(Boolean).length;
    if (n < 2 || n > 6) continue;
    return { type: 'multi', prompt: t.q, opts, correct, explain: t.ex + ' Верно: ' + opts.filter((o, i) => correct[i]).join(', ') + '.' };
  }
}

/* 2. Содержимое коллекции */
function gColl(R) {
  for (;;) {
    const kind = R.pick(['list', 'queue', 'queue', 'deque', 'set']);
    const ops = [], v = () => R.int(1, 9);
    let decl, cur = [], ok = true;
    const n = R.int(5, 7);
    if (kind === 'list') {
      decl = 'List list = new ArrayList<>();';
      for (let i = 0; i < n; i++) {
        const k = cur.length < 2 ? 0 : R.pick([0, 0, 1, 2, 3]);
        if (k === 0) { const x = v(); cur.push(x); ops.push('list.add(' + x + ');'); }
        else if (k === 1) { const at = R.int(0, cur.length), x = v(); cur.splice(at, 0, x); ops.push('list.add(' + at + ', ' + x + ');'); }
        else if (k === 2) { const at = R.int(0, cur.length - 1); cur.splice(at, 1); ops.push('list.remove(' + at + ');'); }
        else { const at = R.int(0, cur.length - 1), x = v(); cur[at] = x; ops.push('list.set(' + at + ', ' + x + ');'); }
      }
    } else if (kind === 'queue') {
      const impl = R.pick(['LinkedList', 'ArrayDeque']);
      decl = 'Queue queue = new ' + impl + '<>();';
      for (let i = 0; i < n; i++) {
        if (cur.length < 2 || R.r() < 0.7) { const x = v(); cur.push(x); ops.push('queue.' + R.pick(['add', 'add', 'offer']) + '(' + x + ');'); }
        else { cur.shift(); ops.push('queue.' + R.pick(['remove', 'poll']) + '();'); }
      }
    } else if (kind === 'deque') {
      decl = 'Deque deque = new ArrayDeque<>();';
      for (let i = 0; i < n; i++) {
        const k = cur.length < 2 ? R.int(0, 2) : R.int(0, 5);
        if (k === 0) { const x = v(); cur.unshift(x); ops.push('deque.push(' + x + ');'); }
        else if (k === 1) { const x = v(); cur.unshift(x); ops.push('deque.addFirst(' + x + ');'); }
        else if (k === 2) { const x = v(); cur.push(x); ops.push('deque.addLast(' + x + ');'); }
        else if (k === 3) { cur.shift(); ops.push('deque.pop();'); }
        else if (k === 4) { cur.pop(); ops.push('deque.pollLast();'); }
        else { cur.shift(); ops.push('deque.pollFirst();'); }
      }
    } else {
      const impl = R.pick(['TreeSet', 'LinkedHashSet']);
      decl = 'Set set = new ' + impl + '<>();';
      for (let i = 0; i < n; i++) {
        if (cur.length < 2 || R.r() < 0.75) { const x = v(); if (!cur.includes(x)) cur.push(x); ops.push('set.add(' + x + ');'); }
        else { const x = R.r() < 0.8 ? R.pick(cur) : v(); cur = cur.filter(y => y !== x); ops.push('set.remove(' + x + ');'); }
      }
      if (impl === 'TreeSet') cur.sort((a, b) => a - b);
    }
    if (!ok || cur.length < 3 || cur.length > 6) continue;
    const lines = []; for (let i = 0; i < ops.length; i += 3) lines.push(ops.slice(i, i + 3).join(' '));
    const ex = { list: 'ArrayList хранит элементы в порядке вставки; add(i, x) вставляет по индексу со сдвигом, remove(i) с int-аргументом удаляет элемент ПО ИНДЕКСУ, set(i, x) заменяет.',
      queue: 'Очередь FIFO: add/offer добавляют в конец, remove()/poll() забирают из начала.',
      deque: 'push и addFirst кладут в начало, addLast — в конец; pop и pollFirst забирают из начала, pollLast — с конца. Порядок вывода — от начала к концу.',
      set: decl.includes('Tree') ? 'TreeSet хранит уникальные элементы в отсортированном порядке; повторное добавление ничего не меняет.' : 'LinkedHashSet хранит уникальные элементы в порядке первого добавления; повторное добавление ничего не меняет.' }[kind];
    return { type: 'text', prompt: 'Какие значения элементов и в каком порядке будут находиться в коллекции после выполнения кода? Введите элементы в нужном порядке через запятую без пробелов (например 1,2,3).',
      code: L([decl, ...lines]), answer: cur.join(','), norm: 'nospace', explain: ex + ' Итог: ' + cur.join(','), java: { decl, ops, kind } };
  }
}

/* 3. Функциональный интерфейс */
const FI = ['Function<T, R>', 'BiFunction<T, U, R>', 'BinaryOperator<T>', 'UnaryOperator<T>', 'Predicate<T>', 'ToIntFunction<T>', 'DoubleFunction<R>', 'Consumer<T>', 'Supplier<T>'];
const LAMBDAS = [
  ['(String s) -> s.toLowerCase()', 'UnaryOperator<T>', ['Function<T, R>'], 'UnaryOperator<String>'],
  ['(String s) -> s.trim()', 'UnaryOperator<T>', ['Function<T, R>'], 'UnaryOperator<String>'],
  ['(Integer x) -> x * 2', 'UnaryOperator<T>', ['Function<T, R>'], 'UnaryOperator<Integer>'],
  ['(String s) -> s.hashCode()', 'ToIntFunction<T>', ['Function<T, R>'], 'ToIntFunction<String>'],
  ['(String s) -> s.length()', 'ToIntFunction<T>', ['Function<T, R>'], 'ToIntFunction<String>'],
  ['(String s) -> Integer.parseInt(s)', 'ToIntFunction<T>', ['Function<T, R>'], 'ToIntFunction<String>'],
  ['(String s) -> s.isEmpty()', 'Predicate<T>', ['Function<T, R>'], 'Predicate<String>'],
  ['(LinkedList q) -> q.isEmpty()', 'Predicate<T>', ['Function<T, R>'], 'Predicate<LinkedList>'],
  ['(String s) -> s.length() > 3', 'Predicate<T>', ['Function<T, R>'], 'Predicate<String>'],
  ['() -> LocalDate.now()', 'Supplier<T>', [], 'Supplier<LocalDate>'],
  ['() -> new ArrayList<>()', 'Supplier<T>', [], 'Supplier<ArrayList<String>>'],
  ['() -> Math.random()', 'Supplier<T>', [], 'Supplier<Double>'],
  ['(Integer a, Integer b) -> a + b', 'BinaryOperator<T>', ['BiFunction<T, U, R>'], 'BinaryOperator<Integer>'],
  ['(String a, String b) -> a + b', 'BinaryOperator<T>', ['BiFunction<T, U, R>'], 'BinaryOperator<String>'],
  ['(String s, Integer n) -> s.repeat(n)', 'BiFunction<T, U, R>', [], 'BiFunction<String, Integer, String>'],
  ['(double d) -> "x = " + d', 'DoubleFunction<R>', ['Function<T, R>'], 'DoubleFunction<String>'],
  ['(String s) -> System.out.println(s)', 'Consumer<T>', [], 'Consumer<String>']
];
const FI_WHY = { 'UnaryOperator<T>': 'один аргумент и результат того же типа', 'ToIntFunction<T>': 'один аргумент, результат — примитив int', 'Predicate<T>': 'один аргумент, результат boolean', 'Supplier<T>': 'нет аргументов, есть результат', 'BinaryOperator<T>': 'два аргумента и результат одного и того же типа', 'BiFunction<T, U, R>': 'два аргумента разных типов и результат', 'DoubleFunction<R>': 'аргумент — примитив double, результат — объект', 'Consumer<T>': 'один аргумент, результата нет (void)' };
function gLambda(R) {
  const [lam, ans, excl, jt] = R.pick(LAMBDAS);
  const others = FI.filter(f => f !== ans && !excl.includes(f));
  const pool = R.sample(others.filter(f => f !== 'Consumer<T>'), 5).concat(ans === 'Consumer<T>' ? [] : ['Consumer<T>']);
  const opts = R.shuffle([ans].concat(pool.slice(0, 6)));
  return { type: 'single', prompt: 'Какой функциональный интерфейс соответствует лямбда-выражению?', code: lam, opts, correctIdx: opts.indexOf(ans),
    explain: ans + ': ' + FI_WHY[ans] + '.', java: { lam, jt } };
}

/* 4. JavaFX: недостающий элемент */
function gFX(R) {
  const [ctl, setter, ev] = R.pick([['Button', 'setOnAction', 'ActionEvent'], ['TextField', 'setOnAction', 'ActionEvent'], ['CheckBox', 'setOnAction', 'ActionEvent'], ['RadioButton', 'setOnMouseClicked', 'MouseEvent'],
    ['Label', 'setOnMouseEntered', 'MouseEvent'], ['Button', 'setOnMouseExited', 'MouseEvent'], ['TextField', 'setOnKeyPressed', 'KeyEvent'], ['TextArea', 'setOnKeyTyped', 'KeyEvent'], ['Stage', 'setOnCloseRequest', 'WindowEvent']]);
  const name = R.pick(['myControl', 'myNode', 'myWidget', 'element']), text = R.pick(['"Готово"', '"Нажми меня"', '"Отправить"', '"Поиск"', '"Сохранить"']);
  const color = R.pick(['CYAN', 'MAGENTA', 'WHITE', 'ORANGE', 'GREEN']);
  const decl = ctl === 'Stage' ? 'Stage ' + name + ' = new Stage();' : ctl + ' ' + name + ' = new ' + ctl + '(' + text + ');';
  const blankInGeneric = R.r() < 0.5;
  const code = L([decl, name + '.' + setter + '(new EventHandler<' + (blankInGeneric ? '[ ? ]' : ev) + '>() {', '  public void handle(' + (blankInGeneric ? ev : '[ ? ]') + ' event) {', '    this.setBackground(Color.' + color + ');', '  }', '});']);
  return { type: 'text', prompt: 'Впишите недостающий элемент (на месте [ ? ]) в код обработки события JavaFX.', code, answer: ev, norm: 'nospace',
    explain: setter + ' принимает EventHandler<' + ev + '>, и метод handle получает объект того же типа. ' + ({ ActionEvent: 'ActionEvent — «действие» элемента (нажатие кнопки, Enter в поле).', MouseEvent: 'События мыши (клик, наведение, уход курсора) — MouseEvent.', KeyEvent: 'События клавиатуры — KeyEvent.', WindowEvent: 'Закрытие окна Stage — WindowEvent.' })[ev] };
}

/* 5. ResourceBundle */
function gBundle(R) {
  const [loc, words] = R.pick([['ru', ['привет', 'мир']], ['ru', ['привет', 'мир']], ['de', ['hallo', 'welt']], ['fr', ['bonjour', 'monde']], ['es', ['hola', 'mundo']]]);
  const base = R.pick(['hello', 'messages', 'text']);
  const which = R.int(0, 1), out = which === 0 ? words[0] + ' world' : 'hello ' + words[1];
  const key = which === 0 ? 'hello' : 'world';
  const code = L(['Locale locale = new Locale("' + loc + '");', 'ResourceBundle bundle =', '  ResourceBundle.getBundle("' + base + '", locale);', 'String hello = bundle.getString("hello");', 'String world = bundle.getString("world");', 'System.out.println(hello + " " + world);']);
  return { type: 'text', prompt: 'Какая одна строка должна быть в файле ' + base + '_' + loc + '.properties, чтобы в результате выполнения кода было напечатано \'' + out + '\', при условии, что файл ' + base + '.properties содержит следующий текст:',
    pre: 'hello=hello\nworld=world\nbundle=bundle', code, answer: key + '=' + words[which], norm: 'nospace', note: 'Ответ указывать без пробелов',
    explain: 'Для локали ' + loc + ' сначала ищется ключ в ' + base + '_' + loc + '.properties, а если его там нет — в базовом ' + base + '.properties. Достаточно переопределить один ключ: ' + key + '=' + words[which] + '; второй возьмётся из базового файла.', java: { loc, base, line: key + '=' + words[which], out } };
}

/* 6. Состояния потока */
const THR = [
  ['В какое состояние поток может перейти из состояния Sleeping, когда заканчивается указанное время?', 'Runnable', ['Terminated', 'New', 'Waiting', 'Blocked'], 'Когда время sleep() истекает, поток снова готов к выполнению — Runnable.'],
  ['Из какого состояния поток может перейти в состояние Blocked при попытке зайти в синхронизированный блок, который уже выполняется другим потоком?', 'Runnable', ['New', 'Sleeping', 'Waiting', 'Terminated'], 'В Blocked попадает выполняющийся (Runnable) поток, которому не достался монитор.'],
  ['В какое состояние переходит поток после вызова метода start()?', 'Runnable', ['New', 'Waiting', 'Blocked', 'Terminated'], 'start() переводит поток из New в Runnable — он готов к выполнению.'],
  ['В какое состояние переходит поток, когда его метод run() завершился?', 'Terminated', ['New', 'Runnable', 'Waiting', 'Blocked'], 'После завершения run() поток завершён — Terminated, перезапустить его нельзя.'],
  ['В каком состоянии находится поток, созданный через new Thread(...), для которого ещё не вызван start()?', 'New', ['Runnable', 'Waiting', 'Blocked', 'Terminated'], 'До вызова start() поток находится в состоянии New.'],
  ['В какое состояние переходит поток при вызове метода wait() без таймаута?', 'Waiting', ['Runnable', 'Sleeping', 'Blocked', 'Terminated'], 'wait() без таймаута — бессрочное ожидание уведомления: Waiting.'],
  ['В какое состояние переходит поток при вызове Thread.sleep(1000)?', 'Sleeping', ['Waiting', 'Blocked', 'New', 'Terminated'], 'sleep() с указанным временем — состояние Sleeping (в Java — TIMED_WAITING).'],
  ['В какое состояние переходит заблокированный (Blocked) поток, когда монитор освободился и он его захватил?', 'Runnable', ['New', 'Waiting', 'Sleeping', 'Terminated'], 'Получив монитор, поток продолжает выполнение — Runnable.'],
  ['В какое состояние переходит поток при вызове join() у другого потока без таймаута?', 'Waiting', ['Runnable', 'Blocked', 'Sleeping', 'Terminated'], 'join() без таймаута ждёт завершения другого потока бессрочно — Waiting.']
];
function gThread(R) {
  const [q, ans, wrong, ex] = R.pick(THR);
  const opts = R.shuffle([ans].concat(wrong));
  return { type: 'single', prompt: q, opts, correctIdx: opts.indexOf(ans), explain: ex };
}

/* 7. Сетевые классы */
const NET = [
  ['java.net', 'ожидания запроса соединения от клиента при использовании протокола TCP', 'ServerSocket', 'ServerSocket принимает входящие TCP-соединения методом accept().'],
  ['java.nio.channels', 'ожидания запроса соединения от клиента при использовании протокола TCP', 'ServerSocketChannel', 'ServerSocketChannel — канал, принимающий TCP-соединения (accept()).'],
  ['java.net', 'установления соединения с сервером на стороне клиента при использовании протокола TCP', 'Socket', 'Клиентская сторона TCP — Socket.'],
  ['java.nio.channels', 'установления соединения с сервером на стороне клиента при использовании протокола TCP', 'SocketChannel', 'Клиентский TCP-канал — SocketChannel.'],
  ['java.net', 'получения датаграммы от клиента при использовании протокола UDP', 'DatagramSocket', 'Для приёма и отправки UDP-пакетов используется DatagramSocket (receive/send).'],
  ['java.nio.channels', 'получения датаграммы от клиента при использовании протокола UDP', 'DatagramChannel', 'UDP-канал в NIO — DatagramChannel.'],
  ['java.net', 'представления UDP-пакета (данных датаграммы и адреса)', 'DatagramPacket', 'Сам UDP-пакет — DatagramPacket; передаётся через DatagramSocket.'],
  ['java.net', 'представления IP-адреса', 'InetAddress', 'IP-адрес представляется классом InetAddress.'],
  ['java.nio.channels', 'мультиплексирования — отслеживания готовности нескольких каналов в одном потоке', 'Selector', 'Selector позволяет одному потоку обслуживать несколько каналов.']
];
function gNet(R) {
  const [pkg, what, ans, ex] = R.pick(NET);
  return { type: 'text', prompt: 'Какой класс пакета ' + pkg + ' используется для ' + what + '? Указать только имя класса без имени пакета.', answer: ans, norm: 'nospace', explain: ex };
}

/* 8. Stream с вымышленным методом строки */
const WORDS = [['mega', 'giga', 'tera', 'peta', 'exa', 'zetta', 'yotta'], ['micro', 'nano', 'pico', 'femto', 'atto', 'zepto', 'yocto'], ['july', 'august', 'september', 'october', 'november', 'december'],
  ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse'], ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'], ['red', 'orange', 'yellow', 'green', 'blue', 'violet'], ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta']];
const SOPS = [
  { name: 'del', desc: 'удаляет символы с чётными индексами', min: 2, f: s => [...s].filter((c, i) => i % 2 === 1).join(''), java: 'del_even' },
  { name: 'del', desc: 'удаляет символы с нечётными индексами', min: 2, f: s => [...s].filter((c, i) => i % 2 === 0).join(''), java: 'del_odd' },
  { name: 'del', desc: 'удаляет предпоследний символ', min: 2, f: s => s.slice(0, -2) + s.slice(-1), java: 'del_penult' },
  { name: 'del', desc: 'удаляет первый символ', min: 1, f: s => s.slice(1), java: 'del_first' },
  { name: 'dup', desc: 'удваивает третий символ', min: 3, f: s => s.slice(0, 3) + s[2] + s.slice(3), java: 'dup3' },
  { name: 'dup', desc: 'удваивает первый символ', min: 1, f: s => s[0] + s, java: 'dup1' },
  { name: 'dup', desc: 'удваивает последний символ', min: 1, f: s => s + s.slice(-1), java: 'duplast' },
  { name: 'swap', desc: 'меняет местами первый и третий символы', min: 3, f: s => s[2] + s[1] + s[0] + s.slice(3), java: 'swap13' },
  { name: 'swap', desc: 'меняет местами первый и последний символы', min: 2, f: s => s.slice(-1) + s.slice(1, -1) + s[0], java: 'swap1n' }
];
function gStream(R) {
  for (;;) {
    const words = R.pick(WORDS), op = R.pick(SOPS), cmp = R.pick(['>', '<', '==']), k = R.int(3, 7), lim = R.int(2, 3);
    const pass = words.filter(w => cmp === '>' ? w.length > k : cmp === '<' ? w.length < k : w.length === k);
    if (pass.length < lim || pass.some(w => w.length < op.min)) continue;
    const res = pass.map(op.f).slice(0, lim).sort();
    if (pass.length === lim && R.r() < 0.6) continue;
    const lit = words.map(w => '"' + w + '"');
    const code = L(['Stream.of(' + lit.join(', ') + ')', '  .filter(s -> s.length() ' + cmp + ' ' + k + ')', '  .map(s -> s.' + op.name + '())', '  .limit(' + lim + ')', '  .sorted()', '  .forEachOrdered(System.out::print);']);
    return { type: 'text', prompt: 'Что напечатает фрагмент кода, если метод ' + op.name + '() ' + op.desc + '?', code, answer: res.join(''), norm: 'nospace',
      explain: 'filter оставляет ' + pass.join(', ') + '; map: ' + pass.slice(0, lim).map(w => w + ' → ' + op.f(w)).join(', ') + '; limit(' + lim + ') берёт первые ' + lim + ' (по порядку потока); sorted() сортирует их по алфавиту; print выводит без разделителей.',
      java: { words, cmp, k, lim, op: op.java } };
  }
}

/* 9. Паттерны по категориям */
const PATTERNS = [['Фабричный метод (Factory method)', 0], ['Абстрактная фабрика (Abstract factory)', 0], ['Строитель (Builder)', 0], ['Прототип (Prototype)', 0], ['Одиночка (Singleton)', 0],
  ['Адаптер (Adapter)', 1], ['Мост (Bridge)', 1], ['Компоновщик (Composite)', 1], ['Декоратор (Decorator)', 1], ['Фасад (Facade)', 1], ['Легковес (Flyweight)', 1], ['Заместитель (Proxy)', 1],
  ['Цепочка обязанностей (Chain of responsibility)', 2], ['Команда (Command)', 2], ['Итератор (Iterator)', 2], ['Посредник (Mediator)', 2], ['Хранитель (Memento)', 2], ['Наблюдатель (Observer)', 2], ['Состояние (State)', 2], ['Стратегия (Strategy)', 2], ['Шаблонный метод (Template method)', 2], ['Посетитель (Visitor)', 2], ['Интерпретатор (Interpreter)', 2]];
const CATS = ['Порождающие', 'Структурные', 'Поведенческие'];
function gPatterns(R) {
  for (;;) {
    const items = R.sample(PATTERNS, 4);
    if (new Set(items.map(x => x[1])).size < 2) continue;
    return { type: 'cats', prompt: 'Распределите паттерны по категориям', items: items.map(x => x[0]), cats: ['Поведенческие', 'Порождающие', 'Структурные'], correct: items.map(x => CATS[x[1]]),
      explain: 'Порождающие отвечают за создание объектов, структурные — за составление классов и объектов в структуры, поведенческие — за взаимодействие объектов и распределение обязанностей. ' + items.map(x => x[0].split(' (')[0] + ' — ' + CATS[x[1]].toLowerCase()).join('; ') + '.' };
  }
}

/* 10. Выбор коллекции */
const CHOICE = [
  ['Какой класс следует использовать, если элементы множества должны быть отсортированы?', 'TreeSet', ['LinkedHashSet', 'HashSet', 'OrderedSet'], 'TreeSet хранит элементы в отсортированном порядке (красно-чёрное дерево).'],
  ['Какой класс следует использовать, если элементы множества должны храниться в порядке добавления?', 'LinkedHashSet', ['TreeSet', 'HashSet', 'OrderedSet'], 'LinkedHashSet запоминает порядок вставки.'],
  ['Какой класс следует использовать, если элементы словаря должны быть отсортированы по ключу?', 'TreeMap', ['LinkedHashMap', 'OrderedMap', 'HashMap'], 'TreeMap хранит пары в порядке сортировки ключей.'],
  ['Какой класс следует использовать, если элементы словаря должны храниться в порядке добавления?', 'LinkedHashMap', ['TreeMap', 'OrderedMap', 'HashMap'], 'LinkedHashMap запоминает порядок вставки ключей.'],
  ['Какой класс следует использовать, если элементы в начале и конце списка часто добавляются и удаляются?', 'LinkedList', ['ArrayList', 'SearchList', 'HashList'], 'LinkedList — двусвязный список: добавление и удаление на концах за O(1).'],
  ['Какой класс следует использовать, если нужен быстрый доступ к элементам списка по индексу?', 'ArrayList', ['LinkedList', 'SearchList', 'HashList'], 'ArrayList основан на массиве: get(i) работает за O(1).'],
  ['Какой класс следует использовать для хранения уникальных элементов, если порядок не важен, а нужна максимальная скорость?', 'HashSet', ['TreeSet', 'LinkedHashSet', 'FastSet'], 'HashSet — хеш-таблица без поддержки порядка, операции в среднем O(1).'],
  ['Какой класс следует использовать, если элементы очереди должны извлекаться в порядке приоритета?', 'PriorityQueue', ['ArrayDeque', 'LinkedList', 'SortedQueue'], 'PriorityQueue (куча) всегда отдаёт наименьший по сравнению элемент.']
];
function gChoice(R) {
  const [q, ans, wrong, ex] = R.pick(CHOICE);
  const opts = R.shuffle([ans].concat(wrong));
  return { type: 'single', prompt: q, opts, correctIdx: opts.indexOf(ans), explain: ex };
}

const GENS = [gIO, gColl, gLambda, gFX, gBundle, gThread, gNet, gStream, gPatterns, gChoice];
function build(seed) { const R = mk(seed); return GENS.map(g => Object.assign({ pts: 2 }, g(R))); }
function nospace(s) { return String(s == null ? '' : s).replace(/\s+/g, '').replace(/^"(.*)"$/, '$1'); }
function grade(q, a) {
  if (q.type === 'single') return a === q.correctIdx ? 1 : 0;
  if (q.type === 'text') return a != null && nospace(a) === nospace(q.answer) ? 1 : 0;
  if (q.type === 'cats') { const m = a || {}; return q.correct.filter((c, i) => m[i] === c).length / q.correct.length; }
  const sel = Array.isArray(a) ? a : [], nT = q.correct.filter(Boolean).length;
  const good = sel.filter(i => q.correct[i]).length, bad = sel.length - good;
  return Math.max(0, (good - bad) / nT);
}
return { build, grade, mk, GENS, SOPS, LAMBDAS, IO };
})();
if (typeof module !== 'undefined') module.exports = KR3;

var RK3 = (function () {
  const H = (v, n) => (v >>> 0).toString(16).toUpperCase().padStart(n, '0').slice(-n);
  const h = v => '0x' + v.toString(16);
  const LIMIT = 300000;

  function build(seed) {
    const r = MC.mk(seed ^ 0x5bd1e995), ri = n => Math.floor(r() * n), pick = a => a[ri(a.length)];
    const type = pick(['1A', '1A', '1B', '2A', '2B', '2C']);
    const t = { type, n: 13 + ri(13), s: ri(5), base: 0x6C2 + ri(0x25), res: 0x400 };
    if (type[0] === '1') {
      for (;;) {
        t.k = type === '1A' ? 9 + ri(5) : 12 + ri(4);
        t.a = 9 + ri(7); t.b = 100 + ri(4900);
        const mx = (1 << (t.k - 1)) - 1, mn = -(1 << (t.k - 1));
        const fits = t.a * mx + t.b <= 32767 && t.a * mn + t.b >= -32768;
        if (fits === (type === '1A')) break;
      }
    } else {
      t.k = 17 + ri(9);
      t.sel = pick(['m2', 'm3', 'm4', 'even', 'odd']);
      t.op = type === '2A' ? 'sum' : type === '2B' ? pick(['min', 'max']) : pick(['and', 'xor']);
    }
    t.text = text(t);
    t.tests = [0, 1, 2].map(k => makeTest(t, MC.mk(seed * 7 + k + 1), k));
    t.solution = solution(t);
    return t;
  }
  const SELTXT = { m2: 'с кратными 2-м i-индексами', m3: 'с кратными 3-м i-индексами', m4: 'с кратными 4-м i-индексами', even: 'с четными i-индексами', odd: 'с нечетными i-индексами' };
  const OPTXT = { sum: 'cумму значений', min: 'минимальное значение', max: 'максимальное значение', and: "логическое 'И' значений", xor: "исключающее 'ИЛИ' значений" };
  function text(t) {
    const head = 'Задание №1. Разработать программу для работы с элементами массива M, в которой:\n1. Массив имеет следующие характеристики:\n' +
      ' - адрес начала массива в памяти БЭВМ - ' + h(t.base) + ';\n - число измерений исходного массива - 1;\n - количество элементов исходного массива - ' + t.n + ';\n' +
      ' - каждый элемент является знаковым числом с разрядностью ' + t.k + ' бит;\n - нумерация элементов начинается с ' + t.s + ';\n' +
      ' - элементы хранятся в массиве по границам слов, нет необходимости в плотной упаковке;\n';
    const tail = 'Примечание: все числа представлены в десятичной системе счисления, если явно не указано иное.';
    if (t.type[0] === '1') return head + '2. Для элементов массива необходимо вычислить 32-х битное значение функции:\n - формула функции F(Mi) = ' + t.a + ' * Mi + ' + t.b + ';\n' +
      ' - 32-битный результат необходимо поместить в другой массив по адресу 0x400\n - Результатом является массив 32-х разрядных чисел равным количеству элементов исходного массива.\n' + tail;
    return head + '2. Для элементов массива необходимо вычислить одно значение по правилам:\n - агрегировать необходимо только для элементы массива ' + SELTXT[t.sel] + ';\n' +
      ' - из выбранных элементов необходимо вычислить ' + OPTXT[t.op] + ' и записать результат в память по адресу 0x400.\n - Результатом является одно 32-х разрядное число!\n' + tail;
  }
  const selected = (t, i) => t.sel === 'm2' ? i % 2 === 0 : t.sel === 'm3' ? i % 3 === 0 : t.sel === 'm4' ? i % 4 === 0 : t.sel === 'even' ? i % 2 === 0 : i % 2 === 1;
  // test values: k-bit signed, stored without sign extension (upper bits 0)
  function makeTest(t, r, kind) {
    const mx = Math.pow(2, t.k - 1) - 1, mn = -Math.pow(2, t.k - 1);
    const rnd = () => Math.floor(r() * (mx - mn + 1)) + mn;
    const vals = [];
    for (let j = 0; j < t.n; j++) {
      let v = rnd();
      if (kind === 1) v = [0, 1, -1, mx, mn, 2, -2, mx - 1, mn + 1][j % 9];
      if (kind === 1 && j >= 9) v = rnd();
      if (kind === 2) { const lim = Math.min(300, mx); v = r() < 0.5 ? -Math.floor(r() * lim) : Math.floor(r() * lim); }
      vals.push(v);
    }
    if (kind === 1 && t.sel) { // make sure extremes land on selected indices
      const sel = []; for (let j = 0; j < t.n; j++) if (selected(t, t.s + j)) sel.push(j);
      [mx, mn, -1, 0].forEach((v, q) => { if (sel[q] != null) vals[sel[q]] = v; });
    }
    const data = [];
    vals.forEach((v, j) => {
      if (t.k <= 16) data.push([t.base + j, v & ((1 << t.k) - 1)]);
      else { const u = ((v % 4294967296) + 4294967296) % 4294967296; data.push([t.base + 2 * j, u & 0xFFFF]); data.push([t.base + 2 * j + 1, Math.floor(u / 65536) & ((1 << (t.k - 16)) - 1)]); }
    });
    const u32 = x => ((x % 4294967296) + 4294967296) % 4294967296;
    const expect = [];
    if (t.type[0] === '1') vals.forEach((v, j) => { const f = u32(t.a * v + t.b); expect.push([0x400 + 2 * j, f % 65536], [0x401 + 2 * j, Math.floor(f / 65536)]); });
    else {
      let acc = null;
      vals.forEach((v, j) => {
        if (!selected(t, t.s + j)) return;
        if (acc === null) { acc = v; return; }
        if (t.op === 'sum') acc = acc + v;
        else if (t.op === 'min') acc = Math.min(acc, v);
        else if (t.op === 'max') acc = Math.max(acc, v);
        else { const A = u32(acc), B = u32(v), lo = t.op === 'and' ? (A & 0xFFFF) & (B & 0xFFFF) : (A & 0xFFFF) ^ (B & 0xFFFF), hi = t.op === 'and' ? (Math.floor(A / 65536) & Math.floor(B / 65536)) : (Math.floor(A / 65536) ^ Math.floor(B / 65536)); acc = hi * 65536 + lo; }
      });
      const f = u32(acc); expect.push([0x400, f % 65536], [0x401, Math.floor(f / 65536)]);
    }
    return { vals, data, expect };
  }

  /* ---------- пример решения ---------- */
  function solution(t) {
    const L = [];
    const e = (s, c) => L.push(c ? (s.padEnd(28) + '; ' + c) : s);
    const sel = t.sel, N = sel === 'm3' ? 3 : sel === 'm4' ? 4 : 2, want = sel === 'odd' ? 1 : 0;
    e('; Пример решения (один из возможных вариантов)');
    e('        ORG 0x10');
    if (t.type[0] === '1') {
      const kb = t.k, sign = 1 << (kb - 1), pos = (1 << kb) - 1, neg = 0xFFFF & ~pos;
      e('START:  LD ARR0', 'начальные значения (программу можно запускать повторно)');
      e('        ST PTR');
      e('        LD OUT0');
      e('        ST OUTP');
      e('        LD LEN');
      e('        ST CNT');
      e('NEXT:   LD (PTR)+', 'очередной элемент M[i]');
      e('        ST CURL');
      e('        AND SIGN', 'знаковый разряд ' + kb + '-битного числа');
      e('        BEQ POSV');
      e('        LD CURL', 'отрицательное: дописываем единицы');
      e('        OR NEGM');
      e('        ST CURL');
      e('        LD #-1');
      e('        ST CURH');
      e('        JUMP CALC');
      e('POSV:   LD CURL', 'положительное: обнуляем лишние разряды');
      e('        AND POSM');
      e('        ST CURL');
      e('        CLA');
      e('        ST CURH');
      e('CALC:   LD CURL', 'R = ' + t.a + ' * M[i] (сдвиги и сложения в 32 битах)');
      e('        ST RL');
      e('        LD CURH');
      e('        ST RH');
      const bits = t.a.toString(2).slice(1);
      for (const b of bits) {
        e('        LD RL', 'R = R * 2');
        e('        ASL');
        e('        ST RL');
        e('        LD RH');
        e('        ROL');
        e('        ST RH');
        if (b === '1') {
          e('        LD RL', 'R = R + M[i]');
          e('        ADD CURL');
          e('        ST RL');
          e('        LD RH');
          e('        ADC CURH');
          e('        ST RH');
        }
      }
      e('        LD RL', 'R = R + ' + t.b);
      e('        ADD BCONST');
      e('        ST (OUTP)+', 'младшее слово результата');
      e('        LD RH');
      e('        ADC #0');
      e('        ST (OUTP)+', 'старшее слово результата');
      e('        LOOP CNT');
      e('        JUMP NEXT');
      e('        HLT');
      e('ARR0:   WORD ' + h(t.base), 'адрес исходного массива');
      e('OUT0:   WORD 0x400', 'адрес массива результатов');
      e('LEN:    WORD ' + t.n, 'количество элементов');
      e('SIGN:   WORD ' + h(sign));
      e('POSM:   WORD ' + h(pos));
      e('NEGM:   WORD ' + h(neg));
      e('BCONST: WORD ' + t.b);
      e('PTR:    WORD ?');
      e('OUTP:   WORD ?');
      e('CNT:    WORD ?');
      e('CURL:   WORD ?');
      e('CURH:   WORD ?');
      e('RL:     WORD ?');
      e('RH:     WORD ?');
      return L.join('\n');
    }
    const kh = t.k - 16, sign = 1 << (kh - 1), pos = (1 << kh) - 1, neg = 0xFFFF & ~pos;
    e('START:  LD ARR0', 'начальные значения (программу можно запускать повторно)');
    e('        ST PTR');
    e('        LD LEN');
    e('        ST CNT');
    e('        LD R0', 'R = i mod ' + N + ' для первого элемента (i = ' + t.s + ')');
    e('        ST R');
    if (t.op === 'sum') { e('        CLA', 'сумма = 0'); e('        ST ACCL'); e('        ST ACCH'); }
    else if (t.op === 'and') { e('        LD #-1', "для 'И' начальное значение FFFF FFFF"); e('        ST ACCL'); e('        ST ACCH'); }
    else if (t.op === 'xor') { e('        CLA', "для исключающего 'ИЛИ' начальное значение 0"); e('        ST ACCL'); e('        ST ACCH'); }
    else { e('        LD #1', 'признак: ещё не было выбранных элементов'); e('        ST FIRST'); }
    e('NEXT:   LD (PTR)+', 'младшее слово M[i]');
    e('        ST CURL');
    e('        LD (PTR)+', 'старшее слово M[i]');
    e('        ST CURH');
    e('        LD R');
    e('        CMP #' + want, sel === 'odd' ? 'нечётный индекс?' : sel === 'even' ? 'чётный индекс?' : 'индекс кратен ' + N + '?');
    e('        BNE SKIP');
    e('        CALL EXT', 'расширение знака до 32 бит');
    if (t.op === 'sum') {
      e('        LD ACCL', 'сумма += M[i]');
      e('        ADD CURL');
      e('        ST ACCL');
      e('        LD ACCH');
      e('        ADC CURH');
      e('        ST ACCH');
    } else if (t.op === 'and') {
      e('        LD ACCL'); e('        AND CURL'); e('        ST ACCL'); e('        LD ACCH'); e('        AND CURH'); e('        ST ACCH');
    } else if (t.op === 'xor') {
      e('        LD ACCL', 'A xor B = (A or B) and not(A and B)');
      e('        AND CURL'); e('        NOT'); e('        ST TMP'); e('        LD ACCL'); e('        OR CURL'); e('        AND TMP'); e('        ST ACCL');
      e('        LD ACCH'); e('        AND CURH'); e('        NOT'); e('        ST TMP'); e('        LD ACCH'); e('        OR CURH'); e('        AND TMP'); e('        ST ACCH');
    } else {
      e('        LD FIRST');
      e('        BEQ CMPH');
      e('        CLA', 'первый выбранный элемент берём сразу');
      e('        ST FIRST');
      e('        JUMP TAKE');
      e('CMPH:   LD CURH', 'сравнение старших слов (со знаком)');
      e('        CMP ACCH');
      e('        BEQ CMPL');
      e(t.op === 'min' ? '        BLT TAKE' : '        BGE TAKE');
      e('        JUMP SKIP');
      e('CMPL:   LD CURL', 'старшие равны: сравнение младших (без знака)');
      e('        CMP ACCL');
      if (t.op === 'min') e('        BLO TAKE');
      else { e('        BEQ SKIP'); e('        BHIS TAKE'); }
      e('        JUMP SKIP');
      e('TAKE:   LD CURL');
      e('        ST ACCL');
      e('        LD CURH');
      e('        ST ACCH');
    }
    e('SKIP:   LD R', 'R = (R + 1) mod ' + N);
    e('        INC');
    e('        CMP #' + N);
    e('        BNE SKIP2');
    e('        CLA');
    e('SKIP2:  ST R');
    e('        LOOP CNT');
    e('        JUMP NEXT');
    e('        LD ACCL');
    e('        ST 0x400', 'младшее слово результата');
    e('        LD ACCH');
    e('        ST 0x401', 'старшее слово результата');
    e('        HLT');
    e('EXT:    LD CURH', 'знак ' + t.k + '-битного числа — разряд ' + (kh - 1) + ' старшего слова');
    e('        AND HSIGN');
    e('        BEQ EXTP');
    e('        LD CURH');
    e('        OR HNEG');
    e('        ST CURH');
    e('        RET');
    e('EXTP:   LD CURH');
    e('        AND HPOS');
    e('        ST CURH');
    e('        RET');
    e('ARR0:   WORD ' + h(t.base), 'адрес массива');
    e('LEN:    WORD ' + t.n, 'количество элементов');
    e('R0:     WORD ' + (t.s % N));
    e('HSIGN:  WORD ' + h(sign));
    e('HPOS:   WORD ' + h(pos));
    e('HNEG:   WORD ' + h(neg));
    e('PTR:    WORD ?');
    e('CNT:    WORD ?');
    e('R:      WORD ?');
    e('CURL:   WORD ?');
    e('CURH:   WORD ?');
    e('ACCL:   WORD ?');
    e('ACCH:   WORD ?');
    if (t.op === 'xor') e('TMP:    WORD ?');
    if (t.op === 'min' || t.op === 'max') e('FIRST:  WORD ?');
    return L.join('\n');
  }

  /* ---------- проверка ---------- */
  function check(t, src) {
    let prog;
    try { prog = ASM.assemble(src); } catch (e) { if (e instanceof ASM.AsmError) return { error: e.message, tests: [], passed: 0 }; throw e; }
    const tests = t.tests.map(ts => {
      const s = ASM.machine(prog, ts.data);
      const halted = ASM.run(s, LIMIT);
      const got = ts.expect.map(([a]) => s.mem[a]);
      const ok = halted && ts.expect.every(([a, v], i) => got[i] === v);
      return { ok, halted, cmds: s.cmds, got };
    });
    return { tests, passed: tests.filter(x => x.ok).length };
  }
  // 32-bit values for display
  const pairs = arr => { const o = []; for (let i = 0; i < arr.length; i += 2) o.push(H(arr[i + 1], 4) + ' ' + H(arr[i], 4)); return o; };
  return { build, check, selected, pairs, H, LIMIT };
})();

/* Модель БЭВМ-NG на уровне команд (значения регистров после выполнения команды) и генератор вариантов РК2 */
var BCOMP = (function () {
'use strict';
const M16 = 0xFFFF;
const hx = (v, w) => (v & (w === 3 ? 0x7FF : M16)).toString(16).toUpperCase().padStart(w, '0');

const NOADDR = { CLA: 0x0200, NOT: 0x0280, CLC: 0x0300, CMC: 0x0380, ROL: 0x0400, ROR: 0x0480, ASL: 0x0500, ASR: 0x0580, INC: 0x0700, DEC: 0x0740, NEG: 0x0780, HLT: 0x0100, NOP: 0x0000 };
const ADDR = { AND: 0x2000, OR: 0x3000, ADD: 0x4000, ADC: 0x5000, SUB: 0x6000, CMP: 0x7000, LD: 0xA000, ST: 0xE000 };

function encode(mn, arg) {
  if (mn in NOADDR) return NOADDR[mn];
  return ADDR[mn] | (arg & 0x7FF);
}

/* сложение с флагами: a + b + cin */
function addc(a, b, cin) {
  const s = a + b + cin, r = s & M16;
  const v = ((~(a ^ b) & (a ^ r)) & 0x8000) ? 1 : 0;
  return { r, c: s > M16 ? 1 : 0, v };
}
const nz = r => ({ n: (r >> 15) & 1, z: r === 0 ? 1 : 0 });

/* Выполнить одну команду. st = {mem: Map addr→val, IP, AC, C, N, Z, V, SP} → возвращает строку регистров */
function step(st) {
  const ip = st.IP, cmd = st.mem[ip] || 0;
  let AR = ip, DR = cmd, BR = ip, CR = cmd, IP = (ip + 1) & 0x7FF;
  const op = cmd >> 12;
  let AC = st.AC, f = { N: st.N, Z: st.Z, V: st.V, C: st.C }, wrote = null, halt = false;
  const setNZ = r => { const t = nz(r); f.N = t.n; f.Z = t.z; };
  if (op === 0) {
    switch (cmd) {
      case 0x0000: break;
      case 0x0100: halt = true; break;
      case 0x0200: AC = 0; setNZ(AC); f.V = 0; break;
      case 0x0280: AC = (~AC) & M16; setNZ(AC); f.V = 0; break;
      case 0x0300: f.C = 0; break;
      case 0x0380: f.C ^= 1; break;
      case 0x0400: { const c = (AC >> 15) & 1; AC = ((AC << 1) | f.C) & M16; f.C = c; setNZ(AC); f.V = f.N ^ f.C; break; }
      case 0x0480: { const c = AC & 1; AC = (AC >> 1) | (f.C << 15); f.C = c; setNZ(AC); f.V = f.N ^ f.C; break; }
      case 0x0500: { DR = AC; const c = (AC >> 15) & 1; AC = (AC << 1) & M16; f.C = c; setNZ(AC); f.V = f.N ^ f.C; break; }
      case 0x0580: { const c = AC & 1; AC = (AC >> 1) | (AC & 0x8000); f.C = c; setNZ(AC); f.V = f.N ^ f.C; break; }
      case 0x0700: { const t = addc(AC, 1, 0); AC = t.r; f.C = t.c; f.V = t.v; setNZ(AC); break; }
      case 0x0740: { const t = addc(AC, M16, 0); AC = t.r; f.C = t.c; f.V = t.v; setNZ(AC); break; }
      case 0x0780: { const t = addc((~AC) & M16, 1, 0); AC = t.r; f.C = t.c; f.V = t.v; setNZ(AC); break; }
      default: throw new Error('unsupported ' + cmd.toString(16));
    }
  } else {
    const addr = cmd & 0x7FF; AR = addr;
    const mv = st.mem[addr] || 0;
    switch (op) {
      case 0x2: DR = mv; AC = AC & mv; setNZ(AC); f.V = 0; break;
      case 0x3: DR = mv; AC = AC | mv; BR = (~AC) & M16; setNZ(AC); f.V = 0; break;
      case 0x4: { DR = mv; const t = addc(AC, mv, 0); AC = t.r; f.C = t.c; f.V = t.v; setNZ(AC); break; }
      case 0x5: { DR = mv; const t = addc(AC, mv, f.C); AC = t.r; f.C = t.c; f.V = t.v; setNZ(AC); break; }
      case 0x6: { DR = mv; const t = addc(AC, (~mv) & M16, 1); AC = t.r; f.C = t.c; f.V = t.v; setNZ(AC); break; }
      case 0x7: { DR = mv; const t = addc(AC, (~mv) & M16, 1); f.C = t.c; f.V = t.v; const q = nz(t.r); f.N = q.n; f.Z = q.z; break; }
      case 0xA: DR = mv; AC = mv; setNZ(AC); f.V = 0; break;
      case 0xE: DR = AC; st.mem[addr] = AC; wrote = addr; break;
      default: throw new Error('unsupported ' + cmd.toString(16));
    }
  }
  Object.assign(st, { IP, AC }, f);
  return { IP, CR, AR, DR, SP: st.SP, BR, AC, NZVC: '' + f.N + f.Z + f.V + f.C, wrote, halt };
}

function fmtRow(r) {
  return { IP: hx(r.IP, 3), CR: hx(r.CR, 4), AR: hx(r.AR, 3), DR: hx(r.DR, 4), SP: hx(r.SP, 3), BR: hx(r.BR, 4), AC: hx(r.AC, 4), NZVC: r.NZVC };
}

/* ---------- генерация варианта ---------- */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* AC как линейная форма a·A + b·B + c */
function buildVariant(seed) {
  const r = rng(seed), int = (a, b) => a + Math.floor(r() * (b - a + 1)), pick = a => a[Math.floor(r() * a.length)];
  for (let attempt = 0; attempt < 200; attempt++) {
    const base = 0x00A, aA = base, aB = base + 1, aC = base + 2, start = base + 3;
    const prog = [];
    let lin = { a: 0, b: 0, c: 0 };
    const forms = [];
    const add = (mn, arg) => { prog.push({ mn, arg }); forms.push(null); };
    const snap = () => { forms[forms.length - 1] = linStr(lin); };
    const first = pick(['CLA+ADD', 'CLA+OR', 'LD', 'LD', 'CLA+NOT+AND', 'CLA+NOT+AND', 'CLA+SUB']);
    const v1 = pick(['A', 'B']), addr = x => x === 'A' ? aA : aB;
    if (first === 'LD') { add('LD', addr(v1)); lin[v1.toLowerCase()] = 1; snap(); }
    else if (first === 'CLA+NOT+AND') {
      add('CLA'); snap(); add('NOT'); lin.c = -1; snap();
      add('AND', addr(v1)); lin = { a: 0, b: 0, c: 0 }; lin[v1.toLowerCase()] = 1; snap();
    } else {
      add('CLA'); snap();
      const mn = first.split('+')[1];
      add(mn, addr(v1)); lin[v1.toLowerCase()] = mn === 'SUB' ? -1 : 1; snap();
    }
    const n = int(4, 7);
    const pool = ['ADD A', 'ADD B', 'SUB A', 'SUB B', 'ASL', 'ASL', 'CLC ROL', 'NOT', 'NOT INC', 'INC', 'DEC', 'NEG'];
    let prev = '';
    for (let i = 0; i < n; i++) {
      let o; do { o = pick(pool); } while ((o === prev && o !== 'ASL') || (o === 'INC' && prev === 'DEC') || (o === 'DEC' && prev === 'INC') || (o === 'NEG' && prev === 'NEG') || (o.startsWith('NOT') && prev.startsWith('NOT')));
      prev = o;
      if (o === 'CLC ROL') { add('CLC'); snap(); add('ROL'); lin = { a: lin.a * 2, b: lin.b * 2, c: lin.c * 2 }; snap(); continue; }
      if (o === 'NOT INC') { add('NOT'); lin = { a: -lin.a, b: -lin.b, c: -lin.c - 1 }; snap(); add('INC'); lin.c += 1; snap(); continue; }
      const [mn, v] = o.split(' ');
      if (v) { add(mn, addr(v)); lin[v.toLowerCase()] += mn === 'ADD' ? 1 : -1; snap(); }
      else {
        add(mn);
        if (mn === 'ASL') lin = { a: lin.a * 2, b: lin.b * 2, c: lin.c * 2 };
        else if (mn === 'NOT') lin = { a: -lin.a, b: -lin.b, c: -lin.c - 1 };
        else if (mn === 'NEG') lin = { a: -lin.a, b: -lin.b, c: -lin.c };
        else if (mn === 'INC') lin.c += 1; else if (mn === 'DEC') lin.c -= 1;
        snap();
      }
    }
    add('ST', aC); forms[forms.length - 1] = 'C = ' + linStr(lin); add('HLT');
    if (lin.a === 0 || lin.b === 0 || Math.abs(lin.a) > 8 || Math.abs(lin.b) > 8 || Math.abs(lin.c) > 6) continue;
    const A = int(0, M16), B = int(0, M16), C0 = int(0, M16);
    const mem = {}; mem[aA] = A; mem[aB] = B; mem[aC] = C0;
    prog.forEach((p, i) => { mem[start + i] = encode(p.mn, p.arg); });
    const memInit = Object.assign({}, mem);
    const st = { mem, IP: start, AC: 0, N: 0, Z: 1, V: 0, C: 0, SP: 0 };
    const rows = prog.map(() => step(st));
    // хотя бы один флаг V или C должен «сработать» — иначе вариант слишком простой
    if (!rows.some(x => x.NZVC[2] === '1' || x.NZVC[3] === '1')) continue;
    const formula = fmtLin(lin);
    return { forms, base, aA, aB, aC, start, prog, memInit, rows: rows.map(fmtRow), raw: rows, lin, formula, options: formulaOptions(lin, r), A, B, C0, final: mem[aC] };
  }
  throw new Error('variant');
}

function term(k, name, first) {
  if (k === 0) return '';
  const s = k < 0 ? '−' : '+', a = Math.abs(k), t = (a === 1 ? '' : a + '·') + name;
  return first ? (k < 0 ? '−' : '') + t : ' ' + s + ' ' + t;
}
function linStr(l) {
  let s = term(l.a, 'A', true); s += term(l.b, 'B', !s);
  if (l.c) s += s ? ' ' + (l.c < 0 ? '−' : '+') + ' ' + Math.abs(l.c) : (l.c < 0 ? '−' : '') + Math.abs(l.c);
  return s || '0';
}
function fmtLin(l) { return 'C = ' + linStr(l); }
function formulaOptions(lin, r) {
  const key = l => l.a + ',' + l.b + ',' + l.c, seen = new Set([key(lin)]), out = [lin];
  const muts = [l => ({ a: l.a, b: l.b, c: l.c + 1 }), l => ({ a: l.a, b: l.b, c: l.c - 1 }), l => ({ a: l.b, b: l.a, c: l.c }),
    l => ({ a: -l.a, b: l.b, c: l.c }), l => ({ a: l.a, b: -l.b, c: l.c }), l => ({ a: l.a * 2, b: l.b, c: l.c }), l => ({ a: l.a, b: l.b * 2, c: l.c }),
    l => ({ a: l.a + (l.a > 0 ? -1 : 1), b: l.b, c: l.c }), l => ({ a: -l.a, b: -l.b, c: -l.c })];
  let guard = 0;
  while (out.length < 4 && guard++ < 200) {
    const m = muts[Math.floor(r() * muts.length)](out[Math.floor(r() * out.length)]);
    if (m.a === 0 || m.b === 0 || seen.has(key(m))) continue;
    seen.add(key(m)); out.push(m);
  }
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return { list: out.map(fmtLin), correct: out.findIndex(x => key(x) === key(lin)) };
}

/* ---------- разбор строки ---------- */
const NAMES = { CLC: 'сброс флага переноса', ROL: 'циклический сдвиг влево через C', CLA: 'очистка аккумулятора', NOT: 'инверсия аккумулятора', INC: 'инкремент', DEC: 'декремент', NEG: 'смена знака (дополнение)', ASL: 'арифметический сдвиг влево', ASR: 'арифметический сдвиг вправо', HLT: 'останов', ADD: 'сложение', SUB: 'вычитание', AND: 'логическое И', OR: 'логическое ИЛИ', LD: 'загрузка', ST: 'сохранение' };
function explain(v, i) {
  const p = v.prog[i], r = v.rows[i], addr = hx(v.start + i, 3), prevAC = i === 0 ? '0000' : v.rows[i - 1].AC;
  const L = [];
  const mn = p.mn + (p.arg != null ? ' ' + hx(p.arg, 3) : '');
  L.push(addr + ': ' + mn + ' — ' + (NAMES[p.mn] || '') + ', код ' + r.CR + '.');
  L.push('Выборка команды: CR = ' + r.CR + ', IP = ' + addr + ' + 1 = ' + r.IP + '.');
  if (p.arg == null) {
    L.push('Безадресная команда: AR = адрес самой команды (' + r.AR + '), ' + (p.mn === 'ASL' ? 'DR = прежнее значение AC (' + r.DR + '), т.к. сдвиг идёт через DR' : 'DR = код команды (' + r.DR + ')') + ', BR = ' + r.BR + '.');
  } else if (p.mn === 'ST') {
    L.push('Прямая адресация: AR = ' + r.AR + '. В DR попадает записываемое значение AC = ' + r.DR + ', оно же записывается в ячейку ' + r.AR + '. BR = адрес команды (' + r.BR + '). Флаги не меняются.');
  } else {
    L.push('Прямая адресация: AR = ' + r.AR + ', DR = содержимое ячейки ' + r.AR + ' = ' + r.DR + '.');
    if (p.mn === 'OR') L.push('В БЭВМ-NG OR выполняется как ¬(¬AC & ¬M): промежуточное ¬AC & ¬M остаётся в BR, то есть BR = ¬результат = ' + r.BR + '.');
    else L.push('BR = адрес команды (' + r.BR + ').');
  }
  const ops = { CLA: '0', NOT: '¬' + prevAC, INC: prevAC + ' + 1', DEC: prevAC + ' − 1', NEG: '−' + prevAC + ' (¬AC + 1)', ASL: prevAC + ' << 1', ROL: prevAC + ' << 1, в младший бит — C', CLC: prevAC + ' (не меняется)', ASR: prevAC + ' >> 1',
    ADD: prevAC + ' + ' + r.DR, SUB: prevAC + ' − ' + r.DR + ' (= ' + prevAC + ' + ¬' + r.DR + ' + 1)', OR: prevAC + ' | ' + r.DR, AND: prevAC + ' & ' + r.DR, LD: r.DR };
  if (ops[p.mn] != null) L.push('AC = ' + ops[p.mn] + ' = ' + r.AC + '.');
  const [N, Z, V, C] = r.NZVC.split('').map(Number);
  if (!['ST', 'HLT'].includes(p.mn)) {
    const why = [];
    why.push('N = ' + N + (N ? ' (старший бит результата 1)' : ''));
    why.push('Z = ' + Z + (Z ? ' (результат 0)' : ''));
    if (['ADD', 'SUB', 'INC', 'DEC', 'NEG'].includes(p.mn)) {
      why.push('V = ' + V + (V ? ' (переполнение знакового результата)' : ''));
      why.push('C = ' + C + (p.mn === 'SUB' ? ' (перенос при сложении с ¬M + 1; C = 1, если вычитание без заёма)' : p.mn === 'DEC' ? ' (DEC = AC + FFFF: перенос есть всегда, кроме AC = 0)' : C ? ' (перенос из 15-го разряда)' : ''));
    } else if (p.mn === 'CLC') {
      why.length = 0; why.push('C = 0, остальные флаги не меняются');
    } else if (['ASL', 'ASR', 'ROL'].includes(p.mn)) {
      why.push('C = ' + C + ' (выдвинутый бит)'); why.push('V = N ⊕ C = ' + V);
    } else if (['CLA', 'NOT', 'LD', 'OR', 'AND'].includes(p.mn)) {
      why.push('V = 0, C не меняется (' + C + ')');
    }
    L.push('Флаги: ' + why.join(', ') + ' → NZVC = ' + r.NZVC + '.');
  } else if (p.mn === 'HLT') L.push('Останов: регистры, кроме выборки, не меняются; IP всё равно увеличивается.');
  return L.join(' ');
}

function normHex(s) { const t = String(s || '').trim().toUpperCase().replace(/^0X/, ''); return /^[0-9A-F]{1,4}$/.test(t) ? parseInt(t, 16) : null; }
function normFlags(s) {
  let t = String(s || '').trim().toUpperCase().replace(/\s+/g, '');
  if (/^[01]{4}$/.test(t)) return t;
  if (/^[N\-][Z\-][V\-][C\-]$/.test(t)) return t.split('').map(ch => ch === '-' ? '0' : '1').join('');
  return null;
}
const COLS = ['IP', 'CR', 'AR', 'DR', 'SP', 'BR', 'AC', 'NZVC'];
function checkCell(col, given, exp) {
  if (col === 'NZVC') return normFlags(given) === exp;
  const g = normHex(given); return g != null && g === parseInt(exp, 16);
}
function listing(v) {
  const rows = [];
  [v.aA, v.aB, v.aC].forEach((a, k) => rows.push({ addr: hx(a, 3), text: hx(v.memInit[a], 4), data: true, name: 'ABC'[k] }));
  v.prog.forEach((p, i) => rows.push({ addr: hx(v.start + i, 3), text: (i === 0 ? '+ ' : '') + p.mn + (p.arg != null ? ' ' + hx(p.arg, 3) : ''), code: hx(encode(p.mn, p.arg), 4), data: false, i }));
  return rows;
}

return { step, encode, buildVariant, explain, checkCell, normHex, normFlags, COLS, listing, hx, fmtLin };
})();
if (typeof module !== 'undefined') module.exports = BCOMP;

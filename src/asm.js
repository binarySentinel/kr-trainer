var ASM = (function () {
  const ADDR = { AND: 0x2, OR: 0x3, ADD: 0x4, ADC: 0x5, SUB: 0x6, CMP: 0x7, LOOP: 0x8, LD: 0xA, SWAM: 0xB, JUMP: 0xC, CALL: 0xD, ST: 0xE };
  const NOADDR = { NOP: 0x0000, HLT: 0x0100, CLA: 0x0200, NOT: 0x0280, CLC: 0x0300, CMC: 0x0380, ROL: 0x0400, ROR: 0x0480, ASL: 0x0500, ASR: 0x0580, SXTB: 0x0600, SWAB: 0x0680, INC: 0x0700, DEC: 0x0740, NEG: 0x0780, POP: 0x0800, POPF: 0x0900, RET: 0x0A00, IRET: 0x0B00, PUSH: 0x0C00, PUSHF: 0x0D00, SWAP: 0x0E00, DI: 0x1000, EI: 0x1100 };
  const BRANCH = { BEQ: 0xF0, BNE: 0xF1, BMI: 0xF2, BPL: 0xF3, BCS: 0xF4, BHIS: 0xF4, BCC: 0xF5, BLO: 0xF5, BVS: 0xF6, BVC: 0xF7, BLT: 0xF8, BGE: 0xF9, BR: 0xCE };
  const IO = { IN: 0x1200, OUT: 0x1300, INT: 0x1800 };
  const KW = new Set([...Object.keys(ADDR), ...Object.keys(NOADDR), ...Object.keys(BRANCH), ...Object.keys(IO), 'ORG', 'WORD', 'DUP', 'END', 'SP', 'IP']);
  const NAME = /^[A-Za-z_Ѐ-ӿ][A-Za-z0-9_Ѐ-ӿ]*$/;
  function num(t) {
    const m = /^(-?)(0[xX][0-9a-fA-F]+|\d[0-9a-fA-F]*)$/.exec(t);
    if (!m) return null;
    const x = m[2].toLowerCase(), v = x.startsWith('0x') ? parseInt(x.slice(2), 16) : /[a-f]/.test(x) ? parseInt(x, 16) : parseInt(x, 10);
    return m[1] ? -v : v;
  }
  class AsmError extends Error { constructor(line, msg) { super('Строка ' + line + ': ' + msg); this.line = line; } }

  // returns { mem: Map addr->value, start, lines: Map addr->line, labels } or throws AsmError
  function assemble(src) {
    const lines = src.replace(/\r/g, '').split('\n');
    const items = []; // {line, addr, kind, ...}
    const labels = {};
    let pc = 0x10, hasOrg = false, any = false;
    lines.forEach((raw, li) => {
      const ln = li + 1;
      let s = raw.replace(/;.*$/, '').trim();
      if (!s) return;
      let m = /^([^\s:]+)\s*:\s*(.*)$/.exec(s);
      if (m) {
        const lb = m[1];
        if (!NAME.test(lb) || KW.has(lb.toUpperCase())) throw new AsmError(ln, 'недопустимое имя метки «' + lb + '»');
        if (lb in labels) throw new AsmError(ln, 'метка «' + lb + '» уже определена');
        labels[lb] = { addr: pc, line: ln };
        s = m[2].trim();
        if (/^[^\s:]+\s*:/.test(s)) throw new AsmError(ln, 'две метки в одной строке');
        if (!s) { items.push({ line: ln, kind: 'label', lb }); return; }
      }
      const sp = s.search(/\s/), op = (sp < 0 ? s : s.slice(0, sp)).toUpperCase(), arg = sp < 0 ? '' : s.slice(sp).trim();
      if ((op === 'ORG' || op === 'END') && m) throw new AsmError(ln, 'метка перед ' + op + ' недопустима');
      if (op === 'ORG') {
        const v = num(arg); if (v == null || v < 0 || v > 0xFFFF) throw new AsmError(ln, 'ORG: ожидается адрес');
        pc = v; hasOrg = true;
        return;
      }
      if (op === 'END') { if (arg) throw new AsmError(ln, 'лишние символы после END'); return; }
      if (op === 'WORD') {
        if (!arg) throw new AsmError(ln, 'WORD: нет значения');
        const parts = arg.split(',').map(x => x.trim());
        for (const p of parts) {
          let d = /^(.+?)\s+DUP\s*\(\s*(.*?)\s*\)$/i.exec(p);
          if (d) {
            const n = num(d[1]); if (n == null || n < 2) throw new AsmError(ln, 'DUP: количество должно быть не меньше 2');
            const v = d[2] === '?' ? 0 : num(d[2]); if (v == null) throw new AsmError(ln, 'DUP: неверное значение');
            for (let k = 0; k < n; k++) items.push({ line: ln, addr: pc++, kind: 'word', v: v & 0xFFFF });
          } else if (p === '?') items.push({ line: ln, addr: pc++, kind: 'word', v: 0 });
          else if (/^\$\s*\S+$/.test(p) && NAME.test(p.slice(1).trim())) items.push({ line: ln, addr: pc++, kind: 'wref', name: p.slice(1).trim() });
          else { const v = num(p); if (v == null) throw new AsmError(ln, 'WORD: неверное значение «' + p + '»'); items.push({ line: ln, addr: pc++, kind: 'word', v: v & 0xFFFF }); }
        }
        any = true; return;
      }
      const it = { line: ln, addr: pc, op, arg, kind: 'ins' };
      if (op in NOADDR) { if (arg) throw new AsmError(ln, op + ' не имеет операнда'); }
      else if (op in ADDR || op in BRANCH || op in IO) { if (!arg) throw new AsmError(ln, op + ': нет операнда'); }
      else throw new AsmError(ln, 'неизвестная команда «' + s.split(/\s/)[0] + '»');
      encode(Object.assign({ syntaxOnly: true }, it), () => it.addr + 1);
      items.push(it); pc++; any = true;
    });
    if (!any) throw new AsmError(1, 'нет ни одной команды');
    const L = name => { if (!(name in labels)) return null; return labels[name].addr; };
    const mem = new Map(), lmap = new Map(), last = new Map();
    for (const it of items) if (it.kind !== 'label') last.set(it.addr, it);
    for (const it of last.values()) {
      let v;
      if (it.kind === 'word') v = it.v;
      else if (it.kind === 'wref') { v = L(it.name); if (v == null) throw new AsmError(it.line, 'метка «' + it.name + '» не определена'); }
      else v = encode(it, L);
      mem.set(it.addr, v & 0xFFFF); lmap.set(it.addr, it.line);
    }
    const addrs = [...mem.keys()];
    let start = Math.min(...addrs);
    if ('START' in labels) start = labels.START.addr;
    return { mem, start, lines: lmap, labels };
  }
  function rel(it, target) {
    if (target == null) throw new AsmError(it.line, 'метка не определена: «' + it.argName + '»');
    const off = target - (it.addr + 1);
    if (off < -128 || off > 127) throw new AsmError(it.line, 'метка «' + it.argName + '» слишком далеко для относительной адресации (смещение ' + off + ')');
    return off & 0xFF;
  }
  function encode(it, L) {
    const { op, arg, line } = it, so = it.syntaxOnly;
    if (op in NOADDR) return NOADDR[op];
    if (op in IO) { const v = num(arg); if (v == null || (!so && (v < 0 || v > (op === 'INT' ? 7 : 255)))) throw new AsmError(line, op + ': ожидается номер устройства'); return IO[op] | v; }
    if (op in BRANCH) {
      if (!NAME.test(arg)) throw new AsmError(line, op + ': ожидается метка');
      it.argName = arg; return (BRANCH[op] << 8) | rel(it, L(arg));
    }
    const c = ADDR[op] << 12;
    let m;
    if ((m = /^#\s*(\S+)$/.exec(arg))) { const v = num(m[1]); if (v == null || (!so && (v < -128 || v > 255))) throw new AsmError(line, 'прямая загрузка: значение вне диапазона'); return c | 0xF00 | (v & 0xFF); }
    if ((m = /^\(\s*([^\s()]+)\s*\)\s*\+$/.exec(arg))) { if (!NAME.test(m[1])) throw new AsmError(line, 'ожидается метка'); it.argName = m[1]; return c | 0xA00 | rel(it, L(m[1])); }
    if ((m = /^-\s*\(\s*([^\s()]+)\s*\)$/.exec(arg))) { if (!NAME.test(m[1])) throw new AsmError(line, 'ожидается метка'); it.argName = m[1]; return c | 0xB00 | rel(it, L(m[1])); }
    if ((m = /^\(\s*([^\s()]+)\s*\)$/.exec(arg))) { if (!NAME.test(m[1])) throw new AsmError(line, 'ожидается метка'); it.argName = m[1]; return c | 0x800 | rel(it, L(m[1])); }
    if ((m = /^&\s*(\S+)$/.exec(arg))) { const v = num(m[1]); if (v == null || (!so && (v < -128 || v > 127))) throw new AsmError(line, 'смещение относительно SP вне диапазона'); return c | 0xC00 | (v & 0xFF); }
    if ((m = /^\$\s*(\S+)$/.exec(arg))) { if (!NAME.test(m[1])) throw new AsmError(line, 'ожидается метка'); const a = L(m[1]); if (a == null) throw new AsmError(line, 'метка не определена: «' + m[1] + '»'); if (!so && a > 0x7FF) throw new AsmError(line, 'адрес метки вне памяти'); return c | (a & 0x7FF); }
    const v = num(arg);
    if (v != null) { if (!so && (v < 0 || v > 0x7FF)) throw new AsmError(line, 'адрес вне диапазона'); return c | v; }
    if (NAME.test(arg)) { it.argName = arg; return c | 0xE00 | rel(it, L(arg)); }
    throw new AsmError(line, 'неверный операнд «' + arg + '»');
  }

  /* ---------- машина: исполнение через микропрограмму ---------- */
  function machine(prog, extra) {
    const mem = new Array(2048).fill(0);
    if (prog) for (const [a, v] of prog.mem) mem[a & 0x7FF] = v;
    if (extra) for (const [a, v] of extra) mem[a & 0x7FF] = v & 0xFFFF;
    return { IP: prog ? prog.start & 0x7FF : 0, CR: 0, AR: 0, DR: 0, SP: 0, BR: 0, AC: 0, PS: 0x80, IR: 0, MP: 1, MR: '', mem, halted: false, cmds: 0 };
  }
  // one command; returns false if halted
  function stepCmd(s) {
    if (s.halted) return false;
    s.MP = 1;
    for (let k = 0; k < 200; k++) {
      MC.step(s);
      if (s.MR === '4000000000') { s.halted = true; s.cmds++; return false; }
      if (s.MP === 1) { s.cmds++; return true; }
    }
    s.halted = true; return false;
  }
  function run(s, limit) {
    let n = 0;
    while (n < limit && stepCmd(s)) n++;
    return s.halted;
  }
  return { assemble, machine, stepCmd, run, AsmError, num };
})();

const B = require('../src/bcomp.js'), hx = B.hx;
const cases = {
  346: { data: [0x135B, 0x5172, 0x4DC6], prog: [['LD',0xA],['CLC'],['ROL'],['ASL'],['ADD',0xA],['NOT'],['INC'],['SUB',0xB],['DEC'],['ST',0xC],['HLT']],
    exp: `00E A00A 00A 135B 000 000D 135B 0000|00F 0300 00E 0300 000 000E 135B 0000|010 0400 00F 0400 000 000F 26B6 0000|011 0500 010 26B6 000 0010 4D6C 0000|012 400A 00A 135B 000 0011 60C7 0000|013 0280 012 0280 000 0012 9F38 1000|014 0700 013 0700 000 0013 9F39 1000|015 600B 00B 5172 000 0014 4DC7 0011|016 0740 015 0740 000 0015 4DC6 0001|017 E00C 00C 4DC6 000 0016 4DC6 0001|018 0100 017 0100 000 0017 4DC6 0001` },
  1000: { data: [0x1184, 0xC2BC, 0x6B29], prog: [['CLA'],['NOT'],['AND',0xA],['CLC'],['ROL'],['ASL'],['ADD',0xA],['NOT'],['INC'],['ADD',0xB],['INC'],['ST',0xC],['HLT']],
    exp: `00E 0200 00D 0200 000 000D 0000 0100|00F 0280 00E 0280 000 000E FFFF 1000|010 200A 00A 1184 000 000F 1184 0000|011 0300 010 0300 000 0010 1184 0000|012 0400 011 0400 000 0011 2308 0000|013 0500 012 2308 000 0012 4610 0000|014 400A 00A 1184 000 0013 5794 0000|015 0280 014 0280 000 0014 A86B 1000|016 0700 015 0700 000 0015 A86C 1000|017 400B 00B C2BC 000 0016 6B28 0011|018 0700 017 0700 000 0017 6B29 0000|019 E00C 00C 6B29 000 0018 6B29 0000|01A 0100 019 0100 000 0019 6B29 0000` },
  234: { data: [0x2A9E, 0x3861, 0x4778], prog: [['CLA'],['NOT'],['AND',0xA],['ASL'],['ADD',0xA],['SUB',0xB],['DEC'],['ST',0xC],['HLT']],
    exp: `00E 0200 00D 0200 000 000D 0000 0100|00F 0280 00E 0280 000 000E FFFF 1000|010 200A 00A 2A9E 000 000F 2A9E 0000|011 0500 010 2A9E 000 0010 553C 0000|012 400A 00A 2A9E 000 0011 7FDA 0000|013 600B 00B 3861 000 0012 4779 0001|014 0740 013 0740 000 0013 4778 0001|015 E00C 00C 4778 000 0014 4778 0001|016 0100 015 0100 000 0015 4778 0001` }
};
for (const [k, c] of Object.entries(cases)) {
  const mem = { 0xA: c.data[0], 0xB: c.data[1], 0xC: c.data[2] };
  c.prog.forEach((p, i) => mem[0xD + i] = B.encode(p[0], p[1]));
  const st = { mem, IP: 0xD, AC: 0, N: 0, Z: 1, V: 0, C: 0, SP: 0 };
  const got = c.prog.map(() => { const r = B.step(st); return [hx(r.IP,3),hx(r.CR,4),hx(r.AR,3),hx(r.DR,4),hx(r.SP,3),hx(r.BR,4),hx(r.AC,4),r.NZVC].join(' '); });
  const exp = c.exp.split('|'); let bad = 0;
  got.forEach((g, i) => { if (g !== exp[i]) { bad++; console.log(k, 'row', i, '\n  site:', g, '\n  scr :', exp[i]); } });
  console.log('variant', k, ':', exp.length, 'rows,', bad, 'differences');
}

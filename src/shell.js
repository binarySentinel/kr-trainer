/* Упрощённый Unix-терминал с проверкой прав (пользователь — владелец всех файлов) */
var SHELL = (function () {
'use strict';
const HOME = '/home/student';
const ERR = { ENOENT: 'No such file or directory', EACCES: 'Permission denied', ENOTDIR: 'Not a directory', EEXIST: 'File exists', EISDIR: 'Is a directory', ENOTEMPTY: 'Directory not empty' };

function newFs() { return { t: 'd', m: 0o755, c: { home: { t: 'd', m: 0o755, c: { student: { t: 'd', m: 0o755, c: {} } } } } }; }
function newState() { return { fs: newFs(), cwd: HOME }; }
const can = (n, bit) => ((n.m >> 6) & bit) !== 0; // 4 r, 2 w, 1 x
function modeStr(n) { let s = n.t === 'd' ? 'd' : '-'; for (let sh = 6; sh >= 0; sh -= 3) { const d = (n.m >> sh) & 7; s += (d & 4 ? 'r' : '-') + (d & 2 ? 'w' : '-') + (d & 1 ? 'x' : '-'); } return s; }
function bytes(s) { let b = 0; for (const ch of s) { const c = ch.codePointAt(0); b += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4; } return b; }

function parseLine(line) {
  const cmds = []; let cur = { argv: [], redir: [] }, tok = null, quoted = false, pend = null, i = 0;
  const push = () => {
    if (tok === null) return;
    let t = tok; if (!quoted && (t === '~' || t.startsWith('~/'))) t = HOME + t.slice(1);
    if (pend) { cur.redir.push({ op: pend, file: t }); pend = null; } else cur.argv.push(t);
    tok = null; quoted = false;
  };
  const end = sep => { push(); if (pend) return false; cur.sep = sep; cmds.push(cur); cur = { argv: [], redir: [] }; return true; };
  while (i < line.length) {
    const ch = line[i];
    if (ch === '"' || ch === "'") {
      if (tok === null) quoted = true;
      let j = i + 1, s = '';
      while (j < line.length && line[j] !== ch) {
        if (ch === '"' && line[j] === '\\' && j + 1 < line.length && '"\\$`'.includes(line[j + 1])) { s += line[j + 1]; j += 2; continue; }
        s += line[j]; j++;
      }
      if (j >= line.length) return { error: 'незакрытая кавычка ' + ch };
      tok = (tok || '') + s; i = j + 1; continue;
    }
    if (ch === '\\') { tok = (tok || '') + (line[i + 1] || ''); i += 2; continue; }
    if (ch === ' ' || ch === '\t') { push(); i++; continue; }
    if (ch === '#' && tok === null) break;
    if (ch === '>') { push(); if (line[i + 1] === '>') { pend = '>>'; i += 2; } else { pend = '>'; i++; } continue; }
    if (ch === ';') { if (!end(';')) return { error: "syntax error near unexpected token `;'" }; i++; continue; }
    if (ch === '&' && line[i + 1] === '&') { if (!end('&&')) return { error: "syntax error near unexpected token `&&'" }; i += 2; continue; }
    if (ch === '|' || ch === '<' || ch === '*' || ch === '?') return { error: 'символ ' + ch + ' (конвейеры, перенаправление ввода, шаблоны) в тренажёре не поддерживается — пишите команды по одной' };
    tok = (tok || '') + ch; i++;
  }
  push();
  if (pend) return { error: "syntax error near unexpected token `newline'" };
  cmds.push(cur);
  return { cmds: cmds.filter(c => c.argv.length || c.redir.length) };
}

function Shell(st) { this.st = st; }
Shell.prototype.comps = function (p) {
  if (p === '~' || p.startsWith('~/')) p = HOME + p.slice(1);
  const base = p.startsWith('/') ? [] : this.st.cwd.split('/').filter(Boolean);
  p.split('/').forEach(seg => { if (!seg || seg === '.') return; if (seg === '..') base.pop(); else base.push(seg); });
  return base;
};
Shell.prototype.walk = function (cs) { // x needed on every directory we pass through
  let n = this.st.fs;
  for (let i = 0; i < cs.length; i++) {
    if (n.t !== 'd') return { err: 'ENOTDIR' };
    if (!can(n, 1)) return { err: 'EACCES' };
    const ch = n.c[cs[i]]; if (!ch) return { err: 'ENOENT', at: i };
    n = ch;
  }
  return { node: n };
};
Shell.prototype.parent = function (cs) {
  if (!cs.length) return { err: 'EEXIST' };
  const r = this.walk(cs.slice(0, -1)); if (r.err) return r;
  if (r.node.t !== 'd') return { err: 'ENOTDIR' };
  return { node: r.node, name: cs[cs.length - 1] };
};
Shell.prototype.lookup = function (rel) { // without permission checks (for grading)
  let n = this.st.fs; for (const s of (HOME + '/' + rel).split('/').filter(Boolean)) { if (!n || n.t !== 'd') return null; n = n.c[s]; } return n || null;
};
Shell.prototype.create = function (cs, node) {
  const p = this.parent(cs); if (p.err) return p.err;
  if (!can(p.node, 1)) return 'EACCES';
  if (p.node.c[p.name]) return 'EEXIST';
  if (!can(p.node, 2)) return 'EACCES';
  p.node.c[p.name] = node; return null;
};
Shell.prototype.write = function (path, text, append) {
  const cs = this.comps(path), r = this.walk(cs);
  if (r.node) {
    if (r.node.t === 'd') return 'bash: ' + path + ': ' + ERR.EISDIR;
    if (!can(r.node, 2)) return 'bash: ' + path + ': ' + ERR.EACCES;
    r.node.d = append ? r.node.d + text : text; return null;
  }
  if (r.err === 'ENOENT' && r.at === cs.length - 1) { const e = this.create(cs, { t: 'f', m: 0o644, d: text }); return e ? 'bash: ' + path + ': ' + ERR[e] : null; }
  return 'bash: ' + path + ': ' + ERR[r.err];
};

function flags(argv, allowed) {
  const f = {}, rest = []; let bad = null, stop = false;
  argv.forEach(a => {
    if (!stop && a === '--') { stop = true; return; }
    if (!stop && a.length > 1 && a[0] === '-' && !/^-[0-7]+$/.test(a)) { for (const ch of a.slice(1)) { if (allowed.includes(ch)) f[ch] = true; else bad = ch; } }
    else rest.push(a);
  });
  return { f, rest, bad };
}

Shell.prototype.exec = function (argv) {
  const cmd = argv[0], args = argv.slice(1), out = [], err = [];
  const fn = this['c_' + cmd];
  if (!fn) return { out: '', err: [cmd + ': command not found (наберите help)'], code: 127 };
  const code = fn.call(this, args, out, err);
  return { out: out.join(''), err, code: code || (err.length ? 1 : 0) };
};

Shell.prototype.c_pwd = function (a, out) { out.push(this.st.cwd + '\n'); };
Shell.prototype.c_whoami = function (a, out) { out.push('student\n'); };
Shell.prototype.c_cd = function (a, out, err) {
  const p = a[0] || '~', cs = this.comps(p), r = this.walk(cs);
  if (r.err) { err.push('bash: cd: ' + p + ': ' + ERR[r.err]); return; }
  if (r.node.t !== 'd') { err.push('bash: cd: ' + p + ': ' + ERR.ENOTDIR); return; }
  if (!can(r.node, 1)) { err.push('bash: cd: ' + p + ': ' + ERR.EACCES); return; }
  this.st.cwd = '/' + cs.join('/');
};
Shell.prototype.c_mkdir = function (a, out, err) {
  const { f, rest, bad } = flags(a, 'p'); if (bad) { err.push("mkdir: invalid option -- '" + bad + "'"); return; }
  if (!rest.length) { err.push('mkdir: missing operand'); return; }
  rest.forEach(p => {
    const cs = this.comps(p);
    if (f.p) {
      for (let k = 1; k <= cs.length; k++) {
        const r = this.walk(cs.slice(0, k));
        if (r.node) { if (r.node.t !== 'd') { err.push("mkdir: cannot create directory '" + p + "': " + ERR.EEXIST); return; } continue; }
        if (r.err !== 'ENOENT') { err.push("mkdir: cannot create directory '" + p + "': " + ERR[r.err]); return; }
        const e = this.create(cs.slice(0, k), { t: 'd', m: 0o755, c: {} }); if (e) { err.push("mkdir: cannot create directory '" + p + "': " + ERR[e]); return; }
      }
    } else { const e = this.create(cs, { t: 'd', m: 0o755, c: {} }); if (e) err.push("mkdir: cannot create directory '" + p + "': " + ERR[e]); }
  });
};
Shell.prototype.c_touch = function (a, out, err) {
  if (!a.length) { err.push('touch: missing file operand'); return; }
  a.forEach(p => {
    const cs = this.comps(p), r = this.walk(cs); if (r.node) return;
    if (r.err === 'ENOENT' && r.at === cs.length - 1) { const e = this.create(cs, { t: 'f', m: 0o644, d: '' }); if (e) err.push("touch: cannot touch '" + p + "': " + ERR[e]); }
    else err.push("touch: cannot touch '" + p + "': " + ERR[r.err]);
  });
};
Shell.prototype.c_echo = function (a, out) {
  let n = false, e = false, i = 0;
  while (i < a.length && /^-[neE]+$/.test(a[i])) { if (a[i].includes('n')) n = true; if (a[i].includes('e')) e = true; i++; }
  let s = a.slice(i).join(' ');
  if (e) s = s.replace(/\\(n|t|\\)/g, (m, c) => c === 'n' ? '\n' : c === 't' ? '\t' : '\\');
  out.push(s + (n ? '' : '\n'));
};
Shell.prototype.c_cat = function (a, out, err) {
  if (!a.length) { err.push('cat: в тренажёре нужно указать файл (ввод с клавиатуры не поддерживается)'); return; }
  a.forEach(p => {
    const r = this.walk(this.comps(p));
    if (r.err) { err.push('cat: ' + p + ': ' + ERR[r.err]); return; }
    if (r.node.t === 'd') { err.push('cat: ' + p + ': ' + ERR.EISDIR); return; }
    if (!can(r.node, 4)) { err.push('cat: ' + p + ': ' + ERR.EACCES); return; }
    out.push(r.node.d);
  });
};
Shell.prototype.longLine = function (n, name) {
  return modeStr(n) + ' ' + (n.t === 'd' ? 2 + Object.values(n.c).filter(x => x.t === 'd').length : 1) + ' student studs ' + String(n.t === 'd' ? 4096 : bytes(n.d)).padStart(5) + ' ' + name;
};
Shell.prototype.c_ls = function (a, out, err) {
  const { f, rest, bad } = flags(a, 'laRd1'); if (bad) { err.push("ls: invalid option -- '" + bad + "'"); return; }
  const paths = rest.length ? rest : ['.'];
  const show = (n, label, header) => {
    if (n.t !== 'd' || f.d) { out.push((f.l ? this.longLine(n, label) : label) + '\n'); return; }
    if (header) out.push(label + ':\n');
    if (!can(n, 4)) { err.push("ls: cannot open directory '" + label + "': " + ERR.EACCES); return; }
    const names = Object.keys(n.c).sort();
    const list = (f.a ? ['.', '..'] : []).concat(names);
    if (f.l) {
      if (!can(n, 1)) { list.forEach(nm => out.push('?????????? ? ?       ?     ? ' + nm + '\n')); err.push("ls: cannot access entries of '" + label + "': " + ERR.EACCES); }
      else { out.push('total ' + names.length * 4 + '\n'); list.forEach(nm => out.push(this.longLine(nm === '.' || nm === '..' ? n : n.c[nm], nm) + '\n')); }
    } else if (list.length) out.push(list.join('  ') + '\n');
    if (f.R && can(n, 1)) names.filter(nm => n.c[nm].t === 'd').forEach(nm => { out.push('\n'); show(n.c[nm], label.replace(/\/$/, '') + '/' + nm, true); });
  };
  paths.forEach((p, k) => {
    const r = this.walk(this.comps(p));
    if (r.err) { err.push("ls: cannot access '" + p + "': " + ERR[r.err]); return; }
    if (k > 0) out.push('\n');
    show(r.node, p, paths.length > 1 || f.R);
  });
};
Shell.prototype.c_chmod = function (a, out, err) {
  // режим может начинаться с '-' (например, -w), поэтому разбираем вручную
  const args = a.slice(); let R = false;
  while (args.length && args[0] === '-R') { R = true; args.shift(); }
  if (args.length < 2) { err.push('chmod: missing operand'); return; }
  const mode = args[0], files = args.slice(1);
  let apply;
  if (/^[0-7]{1,4}$/.test(mode)) { const v = parseInt(mode, 8) & 511; apply = () => v; }
  else if (/^[ugoa]*[-+=][rwx]*(,[ugoa]*[-+=][rwx]*)*$/.test(mode)) {
    apply = m => {
      mode.split(',').forEach(part => {
        const mm = /^([ugoa]*)([-+=])([rwx]*)$/.exec(part); let who = mm[1] || 'a'; if (who.includes('a')) who = 'ugo';
        let bits = 0; if (mm[3].includes('r')) bits |= 4; if (mm[3].includes('w')) bits |= 2; if (mm[3].includes('x')) bits |= 1;
        for (const w of who) { const sh = w === 'u' ? 6 : w === 'g' ? 3 : 0; if (mm[2] === '+') m |= bits << sh; else if (mm[2] === '-') m &= ~(bits << sh); else m = (m & ~(7 << sh)) | (bits << sh); }
      });
      return m & 511;
    };
  } else { err.push("chmod: invalid mode: '" + mode + "'"); return; }
  const rec = n => { n.m = apply(n.m); if (R && n.t === 'd') Object.values(n.c).forEach(rec); };
  files.forEach(p => { const r = this.walk(this.comps(p)); if (r.err) err.push("chmod: cannot access '" + p + "': " + ERR[r.err]); else rec(r.node); });
};
Shell.prototype.c_rmdir = function (a, out, err) {
  if (!a.length) { err.push('rmdir: missing operand'); return; }
  a.forEach(p => {
    const cs = this.comps(p), r = this.walk(cs);
    if (r.err) { err.push("rmdir: failed to remove '" + p + "': " + ERR[r.err]); return; }
    if (r.node.t !== 'd') { err.push("rmdir: failed to remove '" + p + "': " + ERR.ENOTDIR); return; }
    if (Object.keys(r.node.c).length) { err.push("rmdir: failed to remove '" + p + "': " + ERR.ENOTEMPTY); return; }
    const par = this.parent(cs); if (!can(par.node, 2) || !can(par.node, 1)) { err.push("rmdir: failed to remove '" + p + "': " + ERR.EACCES); return; }
    delete par.node.c[par.name];
  });
};
Shell.prototype.c_rm = function (a, out, err) {
  const { f, rest, bad } = flags(a, 'rRfi'); if (bad) { err.push("rm: invalid option -- '" + bad + "'"); return; }
  if (!rest.length) { err.push('rm: missing operand'); return; }
  const rec = f.r || f.R;
  const removable = n => n.t !== 'd' || !Object.keys(n.c).length || (can(n, 4) && can(n, 2) && can(n, 1) && Object.values(n.c).every(removable));
  rest.forEach(p => {
    const cs = this.comps(p), r = this.walk(cs);
    if (r.err) { if (!f.f) err.push("rm: cannot remove '" + p + "': " + ERR[r.err]); return; }
    if (r.node.t === 'd' && !rec) { err.push("rm: cannot remove '" + p + "': " + ERR.EISDIR); return; }
    const par = this.parent(cs);
    if (par.err || !can(par.node, 2) || !can(par.node, 1) || !removable(r.node)) { err.push("rm: cannot remove '" + p + "': " + ERR.EACCES); return; }
    delete par.node.c[par.name];
  });
};
Shell.prototype.c_tree = function (a, out, err) {
  const p = a.filter(x => x[0] !== '-')[0] || '.';
  let n = this.st.fs; for (const s of this.comps(p)) { n = n && n.t === 'd' ? n.c[s] : null; }
  if (!n) { err.push(p + ' [error opening dir]'); return; }
  out.push('[' + modeStr(n) + ']  ' + p + '\n');
  let nd = 0, nf = 0;
  const go = (node, pre) => { const ks = Object.keys(node.c).sort(); ks.forEach((k, i) => { const ch = node.c[k], last = i === ks.length - 1; if (ch.t === 'd') nd++; else nf++; out.push(pre + (last ? '└── ' : '├── ') + '[' + modeStr(ch) + ']  ' + k + '\n'); if (ch.t === 'd') go(ch, pre + (last ? '    ' : '│   ')); }); };
  if (n.t === 'd') go(n, '');
  out.push('\n' + nd + ' directories, ' + nf + ' files\n');
};
Shell.prototype.c_help = function (a, out) {
  out.push([
    'Команды тренажёра:',
    '  mkdir [-p] DIR...        создать каталог(и)',
    '  echo [-e] [-n] ТЕКСТ > FILE   записать текст в файл (>> — дописать)',
    '  touch FILE               создать пустой файл',
    '  cat FILE...              показать содержимое',
    '  ls [-l] [-a] [-R] [-d]   список файлов',
    '  cd DIR, pwd              переход и текущий каталог',
    '  chmod [-R] MODE FILE...  права: 750, u=rwx,g=rx,o=, g+w, a-x …',
    '  rm [-r] [-f], rmdir      удаление',
    '  tree [DIR]               дерево с правами (подсказка тренажёра,',
    '                           игнорирует права; на Helios её может не быть)',
    '  clear                    очистить экран',
    'Несколько команд: через ; или &&, либо вставьте сразу несколько строк.',
    'Вы — владелец всех файлов, права владельца проверяются как в настоящей системе.',
    ''
  ].join('\n'));
};

Shell.prototype.run = function (line) { // → [{k:'out'|'err', t}], special clear
  const res = []; const p = parseLine(line);
  if (p.error) return [{ k: 'err', t: 'bash: ' + p.error }];
  let last = 0;
  for (const c of p.cmds) {
    if (c.prevSep === '&&' && last !== 0) break;
    if (c.argv[0] === 'clear') { res.push({ k: 'clear' }); last = 0; }
    else {
      const r = c.argv.length ? this.exec(c.argv) : { out: '', err: [], code: 0 };
      if (c.redir.length) {
        const rd = c.redir[c.redir.length - 1]; const e = this.write(rd.file, r.out, rd.op === '>>');
        if (e) { r.err.push(e); r.code = 1; }
      } else if (r.out) res.push({ k: 'out', t: r.out.replace(/\n$/, '') });
      r.err.forEach(t => res.push({ k: 'err', t }));
      last = r.code;
    }
    c.next = c.sep;
    const idx = p.cmds.indexOf(c); if (p.cmds[idx + 1]) p.cmds[idx + 1].prevSep = c.sep;
  }
  return res;
};

return { Shell, newState, parseLine, HOME, modeStr };
})();
if (typeof module !== 'undefined') module.exports = SHELL;

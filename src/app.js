{
/* ===== Настройки сайта: меняйте здесь ===== */
const CFG = {
  donateUrl: '',            // ссылка на Boosty / CloudTips; пусто — кнопка скрыта
  donateText: 'Поддержать проект',
  progMinutes: 30,
  opdMinutes: 60
};

const main = document.getElementById('app');
const bar = document.getElementById('bar');
const modal = document.getElementById('modal');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } }
};
const COURSES = {
  prog: { title: 'Программирование', name: 'Контрольная работа №1', min: CFG.progMinutes },
  opd: { title: 'ОПД', name: 'Рубежный контроль №1', min: CFG.opdMinutes }
};
let exam = store.get('krt.exam', null);
let data = null, dataKey = '', timerId = null, shell = null;

function getData() {
  const key = exam.course + ':' + exam.seed;
  if (key !== dataKey) { data = exam.course === 'prog' ? GEN.buildProg(exam.seed) : GEN.buildOpd(exam.seed); dataKey = key; }
  return data;
}
function save() { store.set('krt.exam', exam); }
const fmtTime = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const pct = x => Math.round(x * 100) + '%';
const dateStr = t => new Date(t).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/* ---------- модальное окно ---------- */
function ask(html, buttons) {
  modal.innerHTML = '<div class="dlg" role="dialog" aria-modal="true"><div class="dlg-body">' + html + '</div><div class="dlg-btns">' +
    buttons.map((b, i) => '<button class="btn ' + (b.cls || '') + '" data-i="' + i + '">' + esc(b.label) + '</button>').join('') + '</div></div>';
  modal.hidden = false;
  modal.querySelectorAll('button').forEach(btn => btn.onclick = () => { modal.hidden = true; const f = buttons[+btn.dataset.i].fn; if (f) f(); });
  const first = modal.querySelector('.btn'); if (first) first.focus();
}

/* ---------- главная ---------- */
const varOpts = () => '<option value="r">Случайный вариант</option>' + Array.from({ length: 20 }, (_, i) => '<option value="' + (i + 1) + '">Вариант ' + (i + 1) + '</option>').join('');
function renderHome() {
  stopTimer(); bar.hidden = true; document.body.className = '';
  const hist = store.get('krt.hist', []);
  main.innerHTML = `
  <section class="band">
    <h1>Подготовка к контрольным работам</h1>
    <p class="lede">Тренировочные варианты для 1 курса ФПИиКТ. Работа выполняется на время, после сдачи показываются баллы и разбор каждого задания.</p>
    <div class="course">
      <div class="c-info"><h2>Программирование. Контрольная работа №1</h2>
        <p>Основы Java: ветвления, циклы, switch, строки, массивы, методы.</p>
        <p class="meta">20 вопросов · ${CFG.progMinutes} минут · максимум 1.00 балла</p></div>
      <div class="c-start"><label class="sr" for="vp">Вариант</label><select id="vp">${varOpts()}</select><button class="btn primary" data-start="prog">Начать попытку</button></div>
    </div>
    <div class="course">
      <div class="c-info"><h2>ОПД. Рубежный контроль №1</h2>
        <p>Задание 1: дерево каталогов, содержимое файлов и права доступа (в терминале).<br>Задание 2: перевод в 16-ю систему, сложение в 16-разрядном дополнительном коде, флаги C и V.</p>
        <p class="meta">2 задания · ${CFG.opdMinutes} минут</p></div>
      <div class="c-start"><label class="sr" for="vo">Вариант</label><select id="vo">${varOpts()}</select><button class="btn primary" data-start="opd">Начать попытку</button></div>
    </div>
    <p class="note">Варианты 1–20 всегда одинаковые, их удобно решать всей группой. Случайный вариант собирается заново при каждом запуске. Если время закончится, ответы сохранятся и работа будет сдана автоматически.</p>
  </section>
  <section class="band">
    <h2>Мои попытки</h2>
    ${hist.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>Дата</th><th>Работа</th><th>Вариант</th><th class="num">Результат</th></tr></thead><tbody>
      ${hist.slice().reverse().map(h => `<tr><td>${esc(dateStr(h.when))}</td><td>${esc(COURSES[h.course].title)}</td><td>${esc(h.label)}</td><td class="num"><b>${esc(h.score)}</b>${h.timeout ? ' <span class="muted">(время вышло)</span>' : ''}</td></tr>`).join('')}
      </tbody></table></div><button class="link" id="clearHist">Очистить историю</button>` : '<p class="muted">Попыток пока нет. История хранится только в этом браузере.</p>'}
  </section>`;
  main.querySelectorAll('[data-start]').forEach(b => b.onclick = () => {
    const c = b.dataset.start, v = document.getElementById(c === 'prog' ? 'vp' : 'vo').value;
    startExam(c, v);
  });
  const ch = document.getElementById('clearHist');
  if (ch) ch.onclick = () => ask('<p>Удалить историю попыток в этом браузере?</p>', [{ label: 'Удалить', cls: 'danger', fn: () => { store.del('krt.hist'); renderHome(); } }, { label: 'Отмена' }]);
  window.scrollTo(0, 0);
}

function startExam(course, v) {
  const seed = v === 'r' ? (Math.floor(Math.random() * 4294967296) >>> 0) : GEN.hash(course + '-v' + v);
  exam = { course, v, seed, label: v === 'r' ? 'Случайный вариант ' + seed.toString(36).toUpperCase() : 'Вариант ' + v, startedAt: Date.now(), dur: COURSES[course].min * 60000, answers: {}, term: [], sh: course === 'opd' ? SHELL.newState() : null };
  save(); renderExam();
}

/* ---------- таймер и шапка ---------- */
function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }
function tick() {
  const left = exam.startedAt + exam.dur - Date.now();
  const t = document.getElementById('timer');
  if (t) { t.textContent = fmtTime(left); t.classList.toggle('warn', left < 5 * 60000); }
  if (left <= 0) finish(true);
}
function renderBar() {
  bar.hidden = false; document.body.className = 'in-exam mode-' + exam.course;
  bar.innerHTML = `<div class="bar-in"><div class="bar-title">${esc(COURSES[exam.course].title)}. ${esc(COURSES[exam.course].name)}<span class="muted">${esc(exam.label)}</span></div>
    <div class="bar-time">Осталось <b class="timer" id="timer">--:--</b></div>
    <div class="bar-prog" id="progress"></div>
    <button class="btn finish" id="finishBtn">Завершить</button><button class="link" id="quitBtn">Прервать попытку</button></div>`;
  document.getElementById('finishBtn').onclick = confirmFinish;
  document.getElementById('quitBtn').onclick = () => ask('<p>Прервать попытку? Ответы не сохранятся и в историю не попадут.</p>', [{ label: 'Прервать', cls: 'danger', fn: () => { exam = null; store.del('krt.exam'); renderHome(); } }, { label: 'Продолжить' }]);
  stopTimer(); tick(); timerId = setInterval(tick, 500);
}
function confirmFinish() {
  const un = unanswered();
  ask('<h3>Завершить попытку?</h3><p>' + (un ? 'Без ответа: <b>' + un + '</b>. ' : 'Все ответы заполнены. ') + 'После завершения изменить ответы будет нельзя.</p>', [{ label: 'Завершить', cls: 'primary', fn: () => finish(false) }, { label: 'Вернуться к ответам' }]);
}
function unanswered() {
  const a = exam.answers;
  if (exam.course === 'prog') return getData().filter((q, i) => { const x = a[i]; return x == null || x === '' || (Array.isArray(x) && !x.length); }).length;
  return ['a', 'b', 's', 'C', 'V'].filter(k => a[k] == null || a[k] === '').length;
}

/* ---------- экзамен: программирование ---------- */
function renderProg() {
  const qs = getData(), a = exam.answers;
  main.innerHTML = '<section class="band exam"><div class="sheet"><ol class="qlist">' + qs.map((q, i) => {
    let inp = '';
    if (q.type === 'text') inp = `<input class="ans" data-q="${i}" value="${esc(a[i] || '')}" placeholder="Введите строку" autocomplete="off" spellcheck="false" aria-label="Ответ на вопрос ${i + 1}">`;
    else if (q.type === 'single') inp = '<div class="opts">' + q.opts.map((o, j) => `<label class="opt"><input type="radio" name="q${i}" data-q="${i}" value="${j}" ${a[i] === j ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('') + '</div>';
    else inp = '<div class="opts">' + q.opts.map((o, j) => `<label class="opt"><input type="checkbox" data-q="${i}" value="${j}" ${(a[i] || []).includes(j) ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('') + '</div>';
    return `<li class="q" id="q${i}"><h3><span class="qn">${i + 1}.</span> ${esc(q.prompt)}</h3>
      ${q.code ? `<pre class="code">${esc(q.code)}</pre>` : ''}${q.call ? `<p class="call">${esc(q.call)}</p>` : ''}
      ${q.type === 'multi' ? '<details class="howto"><summary>Как оценивается?</summary><p>Балл = (верно отмеченные − неверно отмеченные) / число верных утверждений, но не меньше нуля.</p></details>' : ''}
      <p class="pts">Баллы за вопрос: ${q.pts.toFixed(2)}</p>${inp}</li>`;
  }).join('') + '</ol><div class="endrow"><button class="btn primary" id="finish2">Завершить попытку</button></div></div></section>';
  main.oninput = main.onchange = e => {
    const el = e.target; if (!el.dataset || el.dataset.q == null) return;
    const i = +el.dataset.q;
    if (el.type === 'radio') exam.answers[i] = +el.value;
    else if (el.type === 'checkbox') exam.answers[i] = [...main.querySelectorAll('input[type=checkbox][data-q="' + i + '"]:checked')].map(x => +x.value);
    else exam.answers[i] = el.value;
    save(); updProgress();
  };
  document.getElementById('finish2').onclick = confirmFinish;
  updProgress();
}
function updProgress() {
  const p = document.getElementById('progress'); if (!p) return;
  const total = exam.course === 'prog' ? getData().length : 5, done = total - unanswered();
  p.textContent = 'Отвечено ' + done + ' из ' + total;
}

/* ---------- экзамен: ОПД ---------- */
function treeText(nodes) {
  const root = { c: {} };
  nodes.forEach(n => { let cur = root; n.path.split('/').forEach(s => { cur.c[s] = cur.c[s] || { c: {}, n: null }; cur = cur.c[s]; }); cur.n = n; });
  const lines = [];
  const go = (node, pre) => { const ks = Object.keys(node.c).sort(); ks.forEach((k, i) => { const ch = node.c[k], last = i === ks.length - 1; lines.push(pre + (last ? '└── ' : '├── ') + k + (ch.n && ch.n.type === 'd' ? '/' : '')); go(ch, pre + (last ? '    ' : '│   ')); }); };
  lines.push('lab0/'); go(root.c.lab0, '');
  return lines.join('\n');
}
function renderOpd() {
  const d = getData(), a = exam.answers;
  shell = new SHELL.Shell(exam.sh);
  const nodes = d.nodes.filter(n => n.path !== 'lab0');
  const content = nodes.filter(n => n.type === 'f').map(n => `<tr><td class="path">${esc(n.path)}</td><td class="content">${esc(n.content).replace(/\n/g, '<br>')}</td></tr>`).join('');
  const perms = nodes.map(n => `<tr><td class="path">${esc(n.path)}${n.type === 'd' ? '/' : ''}</td><td>${esc(GEN.permText(n))}</td></tr>`).join('');
  main.innerHTML = `<section class="band exam opd">
  <div class="opd-grid">
    <div class="sheet task">
      <h2>Задание 1</h2>
      <p>В домашнем каталоге создайте приведённое ниже дерево каталогов и файлов, запишите в файлы указанное содержимое и установите права доступа.</p>
      <h3>1) Дерево каталогов</h3>
      <pre class="tree">${esc(treeText(d.nodes))}</pre>
      <h3>2) Содержимое файлов</h3>
      <div class="scroll"><table class="tbl spec"><thead><tr><th>Файл</th><th>Содержимое</th></tr></thead><tbody>${content}</tbody></table></div>
      <h3>3) Права доступа</h3>
      <div class="scroll"><table class="tbl spec"><thead><tr><th>Объект</th><th>Права</th></tr></thead><tbody>${perms}</tbody></table></div>
      <p class="hint">Многострочное содержимое: <code>echo -e "строка1\\nстрока2" &gt; файл</code></p>
    </div>
    <div class="termwrap">
      <div class="term-title">student@helios: ~</div>
      <div class="term" id="term"><div class="term-out" id="tout"></div>
      <div class="term-line"><span class="ps1" id="ps1"></span><input id="tin" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Команда терминала"></div></div>
      <div class="term-tools"><span class="muted">help — список команд, ↑↓ — история</span><button class="link" id="resetFs">Сбросить файловую систему</button></div>
    </div>
  </div>
  <div class="sheet task t2">
    <h2>Задание 2</h2>
    <p>Процессор 16-разрядный, числа представлены в дополнительном коде. Переведите числа <b>A = ${d.A}</b> и <b>B = ${d.B}</b> в шестнадцатеричную систему счисления, выполните сложение <b>A + B</b> и определите значения флагов <b>C</b> (перенос) и <b>V</b> (переполнение).</p>
    <div class="fields">
      ${[['a', 'A (16)'], ['b', 'B (16)'], ['s', 'A + B (16)']].map(([k, l]) => `<label class="fld"><span>${l}</span><input class="hexin" data-k="${k}" value="${esc(a[k] || '')}" maxlength="8" placeholder="0000" autocomplete="off" spellcheck="false"></label>`).join('')}
      ${['C', 'V'].map(k => `<label class="fld"><span>${k}</span><select data-k="${k}"><option value="">—</option><option value="0" ${a[k] === '0' ? 'selected' : ''}>0</option><option value="1" ${a[k] === '1' ? 'selected' : ''}>1</option></select></label>`).join('')}
    </div>
  </div>
  <div class="endrow"><button class="btn primary" id="finish2">Завершить попытку</button></div>
  </section>`;
  main.oninput = main.onchange = e => { const k = e.target.dataset && e.target.dataset.k; if (!k) return; exam.answers[k] = e.target.value; save(); updProgress(); };
  document.getElementById('finish2').onclick = confirmFinish;
  document.getElementById('resetFs').onclick = () => ask('<p>Удалить всё, что создано в терминале, и начать задание 1 заново? Таймер не сбрасывается.</p>', [{ label: 'Сбросить', cls: 'danger', fn: () => { exam.sh = SHELL.newState(); exam.term = []; save(); renderOpd(); } }, { label: 'Отмена' }]);
  setupTerm(); updProgress();
}

let histIdx = -1;
function setupTerm() {
  const out = document.getElementById('tout'), inp = document.getElementById('tin'), ps1 = document.getElementById('ps1');
  const prompt = () => 'student@helios:' + exam.sh.cwd.replace(SHELL.HOME, '~') + '$';
  const draw = () => {
    out.innerHTML = exam.term.map(l => '<div class="tl ' + l.k + '">' + (l.k === 'cmd' ? '<span class="ps1">' + esc(l.p) + '</span> ' : '') + esc(l.t) + '</div>').join('');
    ps1.textContent = prompt();
    const box = document.getElementById('term'); box.scrollTop = box.scrollHeight;
  };
  const runLine = line => {
    exam.term.push({ k: 'cmd', p: prompt(), t: line });
    if (line.trim()) {
      const res = shell.run(line);
      res.forEach(r => { if (r.k === 'clear') exam.term = []; else exam.term.push(r); });
    }
    if (exam.term.length > 400) exam.term = exam.term.slice(-400);
  };
  const cmds = () => exam.term.filter(l => l.k === 'cmd' && l.t.trim()).map(l => l.t);
  inp.onkeydown = e => {
    if (e.key === 'Enter') { e.preventDefault(); runLine(inp.value); inp.value = ''; histIdx = -1; save(); draw(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const h = cmds(); if (!h.length) return; e.preventDefault();
      histIdx = e.key === 'ArrowUp' ? (histIdx < 0 ? h.length - 1 : Math.max(0, histIdx - 1)) : (histIdx < 0 ? -1 : histIdx + 1);
      if (histIdx >= h.length) histIdx = -1;
      inp.value = histIdx < 0 ? '' : h[histIdx];
    } else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); exam.term = []; save(); draw(); }
  };
  inp.onpaste = e => {
    const t = (e.clipboardData || window.clipboardData).getData('text');
    if (!t || !/\n/.test(t)) return;
    e.preventDefault();
    const lines = (inp.value + t).replace(/\r/g, '').split('\n');
    const lastPart = lines.pop();
    lines.forEach(runLine); inp.value = lastPart; save(); draw();
  };
  document.getElementById('term').onclick = () => { if (!window.getSelection().toString()) inp.focus(); };
  if (!exam.term.length) exam.term.push({ k: 'out', t: 'Вы в домашнем каталоге. Список доступных команд: help' });
  draw();
}

function renderExam() {
  if (exam.finishedAt) return renderResult();
  renderBar();
  if (exam.course === 'prog') renderProg(); else renderOpd();
  window.scrollTo(0, 0);
}

/* ---------- сдача и результаты ---------- */
function gradeOpd() {
  const d = getData(), a = exam.answers, sh = new SHELL.Shell(exam.sh);
  const items = GEN.gradeTree(p => sh.lookup(p), d.nodes);
  const t1 = items.filter(i => i.ok).length / items.length;
  const f = GEN.flagsOf(d.A, d.B);
  const fx = [['a', 'A₁₆', f.a], ['b', 'B₁₆', f.b], ['s', '(A + B)₁₆', f.s]].map(([k, l, exp]) => { const v = GEN.parseHex(a[k]); return { l, exp, got: a[k] || '', ok: v != null && v === parseInt(exp, 16) }; })
    .concat(['C', 'V'].map(k => ({ l: k, exp: String(f[k]), got: a[k] || '', ok: a[k] === String(f[k]) })));
  const t2 = fx.filter(x => x.ok).length / fx.length;
  return { items, t1, fx, t2, total: 0.6 * t1 + 0.4 * t2, f };
}
function gradeProg() {
  const qs = getData();
  const per = qs.map((q, i) => GEN.gradeProgQ(q, exam.answers[i]));
  const score = per.reduce((s, g, i) => s + g * qs[i].pts, 0), max = qs.reduce((s, q) => s + q.pts, 0);
  return { per, score, max };
}
function finish(timeout) {
  if (!exam || exam.finishedAt) return;
  stopTimer();
  exam.finishedAt = Math.min(Date.now(), exam.startedAt + exam.dur); exam.timeout = !!timeout; save();
  let score;
  if (exam.course === 'prog') { const g = gradeProg(); score = g.score.toFixed(2) + ' / ' + g.max.toFixed(2); }
  else score = pct(gradeOpd().total);
  const hist = store.get('krt.hist', []); hist.push({ course: exam.course, label: exam.label, score, when: exam.finishedAt, timeout: exam.timeout });
  store.set('krt.hist', hist.slice(-50));
  renderResult();
}
function resultHead(big, sub) {
  const used = exam.finishedAt - exam.startedAt;
  return `<div class="res-head"><div><p class="muted">${esc(COURSES[exam.course].title)}. ${esc(COURSES[exam.course].name)}, ${esc(exam.label.toLowerCase())}</p>
   <p class="score">${big}</p><p>${sub}</p>
   <p class="muted">Затрачено времени: ${fmtTime(used)} из ${fmtTime(exam.dur)}${exam.timeout ? '. Время вышло, ответы сданы автоматически' : ''}</p></div>
   <div class="res-btns"><button class="btn primary" id="again">Новая попытка</button><button class="btn" id="home">На главную</button></div></div>`;
}
function renderResult() {
  stopTimer(); bar.hidden = true; document.body.className = '';
  let html = '';
  if (exam.course === 'prog') {
    const qs = getData(), g = gradeProg(), a = exam.answers;
    const nOk = g.per.filter(x => x === 1).length, nPart = g.per.filter(x => x > 0 && x < 1).length;
    html = resultHead(g.score.toFixed(2) + '<small> из ' + g.max.toFixed(2) + '</small>', 'Верно: <b>' + nOk + '</b>, частично: <b>' + nPart + '</b>, неверно или без ответа: <b>' + (qs.length - nOk - nPart) + '</b> (' + pct(g.score / g.max) + ')') +
      '<div class="sheet"><ol class="qlist review">' + qs.map((q, i) => {
        const gr = g.per[i], cls = gr === 1 ? 'ok' : gr > 0 ? 'part' : 'bad', x = a[i];
        let body = '';
        if (q.type === 'text') body = `<p>Ваш ответ: <code class="ua">${x ? esc(x) : '—'}</code></p>${gr === 1 ? '' : `<p>Правильный ответ: <code class="ra">${esc(q.answer)}</code></p>`}`;
        else if (q.type === 'single') body = '<ul class="olist">' + q.opts.map((o, j) => `<li class="${j === q.correctIdx ? 'right' : ''} ${x === j ? 'chosen' : ''}">${esc(o)}${x === j ? ' <span class="mk">ваш выбор</span>' : ''}</li>`).join('') + '</ul>';
        else body = '<ul class="olist">' + q.opts.map((o, j) => `<li class="${q.correct[j] ? 'right' : ''} ${(x || []).includes(j) ? 'chosen' : ''}">${esc(o)}${(x || []).includes(j) ? ' <span class="mk">отмечено</span>' : ''}${q.notes[j] && !q.correct[j] ? '<br><span class="muted">' + esc(q.notes[j]) + '</span>' : ''}</li>`).join('') + '</ul>';
        return `<li class="q ${cls}"><h3><span class="qn">${i + 1}.</span> ${esc(q.prompt)}</h3>
          ${q.code ? `<pre class="code">${esc(q.code)}</pre>` : ''}${q.call ? `<p class="call">${esc(q.call)}</p>` : ''}<p class="pts got">Полученные баллы за вопрос ${(gr * q.pts).toFixed(2)}/${q.pts.toFixed(2)}</p>${body}
          ${q.explain ? `<p class="explain">${esc(q.explain)}</p>` : ''}</li>`;
      }).join('') + '</ol></div>';
  } else {
    const d = getData(), g = gradeOpd();
    const bad = g.items.filter(i => !i.ok);
    html = resultHead(pct(g.total), 'Задание 1: <b>' + pct(g.t1) + '</b> (' + (g.items.length - bad.length) + ' из ' + g.items.length + ' пунктов), задание 2: <b>' + pct(g.t2) + '</b>') +
      `<div class="sheet task"><h2>Задание 1</h2>
       <label class="chk"><input type="checkbox" id="onlyBad" checked> Показывать только ошибки</label>
       <div class="scroll"><table class="tbl stack check" id="chkTbl"><thead><tr><th>Путь</th><th>Проверка</th><th>Ожидалось</th><th>У вас</th><th></th></tr></thead><tbody>
       ${g.items.map(i => `<tr class="${i.ok ? 'ok' : 'bad'}"><td class="path">${esc(i.path)}</td><td>${esc(i.what)}</td><td>${esc(i.exp).replace(/\n/g, '<br>')}</td><td>${esc(i.got).replace(/\n/g, '<br>')}</td><td>${i.ok ? '✓' : '✗'}</td></tr>`).join('')}
       </tbody></table></div>${bad.length ? '' : '<p class="okmsg">Дерево, содержимое и права полностью совпадают с заданием.</p>'}
       <h3>Возможное решение</h3><div class="copyrow"><button class="btn" id="copySol">Скопировать</button></div><pre class="code sol" id="sol">${esc(GEN.refSolution(d.nodes))}</pre></div>
       <div class="sheet task"><h2>Задание 2: A = ${d.A}, B = ${d.B}</h2>
       <div class="scroll"><table class="tbl"><thead><tr><th>Поле</th><th>Ожидалось</th><th>У вас</th><th></th></tr></thead><tbody>
       ${g.fx.map(x => `<tr class="${x.ok ? 'ok' : 'bad'}"><td>${x.l}</td><td><code>${esc(x.exp)}</code></td><td><code>${esc(x.got || '—')}</code></td><td>${x.ok ? '✓' : '✗'}</td></tr>`).join('')}
       </tbody></table></div><h3>Разбор</h3><pre class="code">${esc(GEN.explainFlags(d.A, d.B))}</pre></div>`;
  }
  main.innerHTML = '<section class="band result' + (exam.course === 'opd' ? ' opd-res' : '') + '">' + html + '</section>';
  document.getElementById('home').onclick = () => { exam = null; store.del('krt.exam'); renderHome(); };
  document.getElementById('again').onclick = () => startExam(exam.course, 'r');
  const ob = document.getElementById('onlyBad');
  if (ob) { const tb = document.getElementById('chkTbl'); const f = () => tb.classList.toggle('only-bad', ob.checked); ob.onchange = f; f(); }
  const cs = document.getElementById('copySol');
  if (cs) cs.onclick = () => { try { navigator.clipboard.writeText(document.getElementById('sol').textContent).then(() => cs.textContent = 'Скопировано', () => cs.textContent = 'Не удалось — выделите вручную'); } catch (e) { cs.textContent = 'Не удалось — выделите вручную'; } };
  window.scrollTo(0, 0);
}

/* ---------- старт ---------- */
const don = document.getElementById('donate');
if (CFG.donateUrl) { don.href = CFG.donateUrl; don.textContent = CFG.donateText; don.hidden = false; }
document.getElementById('logo').onclick = e => { e.preventDefault(); if (exam && !exam.finishedAt) return; exam = null; store.del('krt.exam'); renderHome(); };
if (exam && !exam.finishedAt && Date.now() >= exam.startedAt + exam.dur) finish(true);
else if (exam) renderExam();
else renderHome();
}

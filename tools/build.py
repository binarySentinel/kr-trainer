import pathlib, sys
# Works listed in UNPUBLISHED are kept in the repository but left out of the site.
# To publish them, remove them from this set and rebuild. `python3 tools/build.py --all` builds everything (for local tests).
UNPUBLISHED = {'opd3', 'opd4'}
ENGINE = {'opd3': ['mc.js', 'asm.js', 'rk3.js'], 'opd4': ['mc.js']}
hide = set() if '--all' in sys.argv else UNPUBLISHED
skip = {f for w in hide for f in ENGINE[w]} - {f for w in set(ENGINE) - hide for f in ENGINE[w]}
s = pathlib.Path(__file__).resolve().parent.parent / 'src'
h = (s / 'index.html').read_text()
for k, f in [('/*GEN*/','gen.js'),('/*SHELL*/','shell.js'),('/*BCOMP*/','bcomp.js'),('/*KR2CODE*/','kr2code.js'),('/*KR2*/','kr2.js'),('/*KR3*/','kr3.js'),('/*MC*/','mc.js'),('/*ASM*/','asm.js'),('/*RK3*/','rk3.js'),('/*APP*/','app.js')]:
    h = h.replace(k, '' if f in skip else (s / f).read_text())
h = h.replace('/*HIDDEN*/', 'const HIDDEN = ' + repr(sorted(hide)).replace("'", '"') + ';')
(pathlib.Path(__file__).resolve().parent.parent / 'index.html').write_text(h)
print(len(h), 'hidden:', sorted(hide))

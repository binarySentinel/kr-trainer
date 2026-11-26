import pathlib
s=pathlib.Path(__file__).resolve().parent.parent / 'src'
h=(s/'index.html').read_text()
for k,f in [('/*GEN*/','gen.js'),('/*SHELL*/','shell.js'),('/*BCOMP*/','bcomp.js'),('/*KR2*/','kr2.js'),('/*APP*/','app.js')]:
    h=h.replace(k,(s/f).read_text())

(pathlib.Path(__file__).resolve().parent.parent / 'index.html').write_text(h)
print(len(h))

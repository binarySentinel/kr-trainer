import pathlib
s=pathlib.Path(__file__).resolve().parent.parent / 'src'
h=(s/'index.html').read_text()
for k,f in [('/*GEN*/','gen.js'),('/*SHELL*/','shell.js'),('/*BCOMP*/','bcomp.js'),('/*KR2CODE*/','kr2code.js'),('/*KR2*/','kr2.js'),('/*KR3*/','kr3.js'),('/*MC*/','mc.js'),('/*ASM*/','asm.js'),('/*RK3*/','rk3.js'),('/*APP*/','app.js')]:
    h=h.replace(k,(s/f).read_text())

(pathlib.Path(__file__).resolve().parent.parent / 'index.html').write_text(h)
print(len(h))

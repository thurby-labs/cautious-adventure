# Assemble open-grass.html from the page template and its scripts.
src = open('app.src.html').read()
engine = open('plays.js').read() + '\n' + open('engine.js').read()
out = src.replace('/*__ENGINE__*/', engine).replace('/*__STUDIO__*/', open('studio.js').read())
open('open-grass.html', 'w').write(out)
print('built', len(out), 'bytes')

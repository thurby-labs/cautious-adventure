# Assemble index.html (the static page GitHub Pages serves) from the page template and its scripts.
import re, sys

src = open('app.src.html').read()
engine = open('plays.js').read() + '\n' + open('engine.js').read()
studio = open('ai.js').read() + '\n' + open('studio.js').read()
out = src.replace('/*__ENGINE__*/', engine).replace('/*__STUDIO__*/', studio)

# The site must run with no Claude Artifact runtime: fail the build if anything depends on it again.
bad = re.findall(r'window\.claude|claude\.ai/artifact|\bcap\([\'"]', out)
if bad:
    sys.exit('build failed: Claude Artifact runtime reference(s) found: ' + ', '.join(sorted(set(bad))))

open('index.html', 'w').write(out)
print('built', len(out), 'bytes')

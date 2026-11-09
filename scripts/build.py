# NOF DİJİTAL – tek dosya build (token → base64/inline svg)
import re, json, os, glob

ROOT = '/home/z/my-project'
SRC = f'{ROOT}/scripts/src'
ASSETS = f'{ROOT}/assets'
OUT = f'{ROOT}/download/nof-dijital-demo.html'

def read(p): return open(p, encoding='utf-8').read()

head = read(f'{SRC}/head.html')
css  = read(f'{SRC}/styles.css')
body = read(f'{SRC}/body.html')
data = read(f'{SRC}/data.js')
app  = read(f'{SRC}/app.js')

# ---------- İkonlar ----------
icons = {}
for p in glob.glob(f'{ASSETS}/icons/*.svg'):
    name = os.path.basename(p)[:-4]
    svg = read(p)
    svg = re.sub(r'<!--.*?-->', '', svg, flags=re.S)
    svg = re.sub(r'\sclass="[^"]*"', '', svg)
    svg = re.sub(r'\s(width|height)="[^"]*"', '', svg, count=2) if 'lucide' in svg else svg
    svg = re.sub(r'\s+', ' ', svg).replace('> <', '><').strip()
    # simple-icons (fill yok) → currentColor
    if 'fill=' not in svg.split('>')[0]:
        svg = svg.replace('<svg ', '<svg fill="currentColor" ', 1)
    if 'aria-hidden' not in svg:
        svg = svg.replace('<svg ', '<svg aria-hidden="true" ', 1)
    icons[name] = svg

# ---------- Görseller ----------
imgs = json.load(open(f'{ASSETS}/logo-manifest.json'))
imgs.update(json.load(open(f'{ASSETS}/img-manifest.json')))

def subst(text, where):
    missing = set()
    def icon_rep(m):
        n = m.group(1)
        if n in icons: return icons[n]
        missing.add('ICON:' + n); return ''
    def img_rep(m):
        n = m.group(1)
        if n in imgs: return imgs[n]
        missing.add('IMG:' + n); return ''
    text = re.sub(r'__ICON:([a-z0-9\-]+)__', icon_rep, text)
    text = re.sub(r'__IMG:([a-z0-9\-]+)__', img_rep, text)
    if missing:
        print(f'  !! eksik token ({where}):', ', '.join(sorted(missing)))
    return text

css   = subst(css, 'css')
head  = subst(head, 'head')
body  = subst(body, 'body')
data  = subst(data, 'data')
app   = subst(app, 'app')

imgjs = 'window.__NOF_IMG__ = ' + json.dumps(imgs, ensure_ascii=False) + ';'

html = (
    head
    + '\n<style>\n' + css + '\n</style>\n</head>\n<body>\n'
    + body
    + '\n<script>\n' + imgjs + '\n' + data + '\n' + app + '\n</script>\n</body>\n</html>\n'
)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(html)
print(f'OK → {OUT}  ({os.path.getsize(OUT)/1024/1024:.2f} MB)')
left = re.findall(r'__(?:ICON|IMG):[a-z0-9\-]+__', html)
print('kalan token:', len(left), left[:5])

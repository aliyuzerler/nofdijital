#!/bin/bash
# Faz 0 baseline: referans HTML viewport ekran görüntüleri
set -e
OUT=/home/z/my-project/tests/visual/baseline
REF=/home/z/my-project/pack/NOF-DIGITAL-ZCODE-PACK/reference
mkdir -p "$OUT"
cd "$REF"
python3 -m http.server 8777 >/dev/null 2>&1 &
SRV=$!
sleep 1
trap "kill $SRV 2>/dev/null" EXIT

shot() { # $1 vp "WxH" $2 name $3 scrollYorHash(optional)
  local wh=$1 name=$2 extra=$3
  agent-browser set viewport ${wh%x*} ${wh#*x} >/dev/null
  agent-browser open "http://localhost:8777/nof_digital.html" >/dev/null
  agent-browser wait --load networkidle >/dev/null
  agent-browser wait 1200 >/dev/null
  if [ -n "$extra" ]; then
    agent-browser eval "window.__go=()=>{location.hash='$extra'};window.__go()" >/dev/null 2>&1
    agent-browser wait 1800 >/dev/null
  fi
  agent-browser screenshot "$OUT/ref-${name}.png" >/dev/null
  echo "shot ref-${name} @${wh}"
}

shot 1440x900  hero-1440
shot 1366x768  hero-1366
shot 1024x768  hero-1024
shot 768x1024  hero-768
shot 390x844   hero-390
shot 360x800   hero-360

# scrolled states (desktop + mobile)
shot 1440x900 gallery-1440 "#calismalar"
shot 1440x900 services-1440 "#hizmetler"
shot 1440x900 process-1440 "#surec"
shot 1440x900 contact-1440 "#iletisim"
shot 1440x900 blog-1440 "#/blog"
shot 390x844  gallery-390 "#calismalar"
shot 390x844  contact-390 "#iletisim"
shot 390x844  blog-390 "#/blog"

# gallery mid-scroll state (canvas + scenes)
agent-browser set viewport 1440 900 >/dev/null
agent-browser open "http://localhost:8777/nof_digital.html" >/dev/null
agent-browser wait --load networkidle >/dev/null
agent-browser eval "const s=document.getElementById('calismalar');window.scrollTo({top:s.offsetTop+1400})" >/dev/null
agent-browser wait 1500 >/dev/null
agent-browser screenshot "$OUT/ref-galeriescroll-1440.png" >/dev/null
echo "shot ref-galeriescroll-1440"
agent-browser close >/dev/null 2>&1
ls -la "$OUT"

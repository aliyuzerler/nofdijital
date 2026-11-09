#!/bin/bash
# Faz 2: uygulama ekran görüntüleri (parite karşılaştırması için baseline ile aynı set)
set -e
OUT=/home/z/my-project/tests/visual/parity
mkdir -p "$OUT"
URL=${1:-http://localhost:3000}

shot() { # $1 vp "WxH" $2 name $3 path(optional query/hash)
  local wh=$1 name=$2 path=$3
  agent-browser set viewport ${wh%x*} ${wh#*x} >/dev/null
  agent-browser open "$URL$path" >/dev/null
  agent-browser wait --load networkidle >/dev/null 2>&1
  agent-browser wait 1500 >/dev/null
  agent-browser screenshot "$OUT/app-${name}.png" >/dev/null
  echo "shot app-${name} @${wh}"
}

shot 1440x900 hero-1440 "/"
shot 1366x768 hero-1366 "/"
shot 1024x768 hero-1024 "/"
shot 768x1024 hero-768 "/"
shot 390x844 hero-390 "/"
shot 360x800 hero-360 "/"

# scrolled states
agent-browser set viewport 1440 900 >/dev/null
agent-browser open "$URL/" >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1
agent-browser eval "document.getElementById('hizmetler').scrollIntoView()" >/dev/null; agent-browser wait 1600 >/dev/null
agent-browser screenshot "$OUT/app-services-1440.png" >/dev/null; echo shot services
agent-browser eval "const s=document.getElementById('calismalar');window.scrollTo({top:s.offsetTop+1400})" >/dev/null; agent-browser wait 1500 >/dev/null
agent-browser screenshot "$OUT/app-galeriescroll-1440.png" >/dev/null; echo shot galleries
agent-browser eval "document.getElementById('surec').scrollIntoView()" >/dev/null; agent-browser wait 1600 >/dev/null
agent-browser screenshot "$OUT/app-process-1440.png" >/dev/null; echo shot process
agent-browser eval "document.getElementById('iletisim').scrollIntoView()" >/dev/null; agent-browser wait 1600 >/dev/null
agent-browser screenshot "$OUT/app-contact-1440.png" >/dev/null; echo shot contact
shot 1440x900 blog-1440 "/blog"
shot 390x844 gallery-390 "/"
shot 390x844 blog-390 "/blog"
agent-browser close >/dev/null 2>&1
ls "$OUT"

#!/bin/bash
# Storybook test-runner koşumu — tek komutta başlat/poll/koş/kapat.
cd /home/z/my-project || exit 1

bunx storybook dev -p 6006 --ci --quiet > /tmp/sb-dev.log 2>&1 &
SB_PID=$!

# /index.json hazır olana dek bekle (max 120s)
READY=0
for i in $(seq 1 60); do
  if curl -sf -o /dev/null http://localhost:6006/index.json; then READY=1; break; fi
  sleep 2
done
if [ "$READY" != "1" ]; then
  echo "FAIL: storybook index.json timeout"
  kill $SB_PID 2>/dev/null
  tail -20 /tmp/sb-dev.log
  exit 1
fi

bunx test-storybook --url http://localhost:6006 --index-json 2>&1 | tail -8
CODE=${PIPESTATUS[0]}
kill $SB_PID 2>/dev/null
exit $CODE

#!/bin/bash
STATUS=$(playerctl status 2>/dev/null)
if [ "$STATUS" = "Playing" ]; then
    echo '{"text": "", "class": "playing"}'
else
    echo '{"text": "", "class": "paused"}'
fi

#!/bin/bash
PLAYER=$(playerctl -l 2>/dev/null | grep firefox | head -1)
if [ -z "$PLAYER" ]; then
    echo "| Spotify - Music"
    exit
fi

TITLE=$(playerctl -p "$PLAYER" metadata title 2>/dev/null)
STATUS=$(playerctl -p "$PLAYER" status 2>/dev/null)

if [ -z "$TITLE" ] || [ "$STATUS" = "Stopped" ]; then
    echo "| Spotify - Music"
else
    if [ ${#TITLE} -gt 30 ]; then
        TITLE="${TITLE:0:30}..."
    fi
    echo "| $TITLE"
fi

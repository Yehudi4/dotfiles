#!/bin/bash
MUTE=$(pactl get-sink-mute @DEFAULT_SINK@ | awk '{print $2}')
VOL=$(pactl get-sink-volume @DEFAULT_SINK@ | grep -o '[0-9]*%' | head -1 | tr -d '%')

if [ "$MUTE" = "yes" ] || [ "$VOL" = "0" ]; then
    echo "{\"text\":\"\uf026\",\"class\":\"off\"}"
else
    echo "{\"text\":\"\uf028\",\"class\":\"on\"}"
fi

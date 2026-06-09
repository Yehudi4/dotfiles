#!/bin/bash
# Validador de estado asíncrono

if pgrep -x "waybar" > /dev/null; then
    killall waybar
    ags toggle wallpaper-manager >/dev/null 2>&1 &
else
    ags toggle wallpaper-manager >/dev/null 2>&1 &
    sleep 0.2
    hyprctl dispatch exec waybar
fi

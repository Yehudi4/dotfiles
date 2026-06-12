#!/bin/bash
WALL=$(cat ~/.config/current_wallpaper)
awww-daemon &
sleep 1
awww img "$WALL"
wal -i "$WALL" -s -t
sleep 1

COLOR=$(sed -n '2p' ~/.cache/wal/colors)
BG=$(sed -n '1p' ~/.cache/wal/colors)

~/.config/rofi/generate_theme.sh
python3 ~/.config/waybar/scripts/make_icons.py
killall waybar
sleep 0.5
waybar > /dev/null 2>&1 & disown

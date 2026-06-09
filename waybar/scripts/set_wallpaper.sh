#!/bin/bash
if [ -z "$1" ]; then
    echo "Uso: set_wallpaper.sh /ruta/imagen"
    exit 1
fi
echo "$1" > ~/.config/current_wallpaper
~/.config/hypr/startup.sh

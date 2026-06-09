#!/bin/bash

# $1 es el parámetro que recibe la ruta exacta del video
VIDEO_PATH="$1"
# Ruta temporal donde guardaremos la foto extraída
FRAME_PATH="/tmp/current_video_frame.jpg"

# 1. Extraemos 1 fotograma (-vframes 1) en el segundo 1 (-ss 00:00:01) 
# Lo hacemos en el segundo 1 para evitar que extraiga una pantalla negra si el video empieza a oscuras.
ffmpeg -y -i "$VIDEO_PATH" -ss 00:00:01.000 -vframes 1 "$FRAME_PATH" -loglevel quiet

# 2. Le pasamos la imagen a Pywal. 
# Usamos -n para decirle que NO intente poner la imagen como fondo (Hidamari ya se encarga del fondo).
wal -i "$FRAME_PATH" -n -q

# 3. Matamos la Waybar actual y le decimos a Hyprland que la vuelva a lanzar
killall waybar
hyprctl dispatch exec waybar

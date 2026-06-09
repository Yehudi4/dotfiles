#!/bin/bash
# Script Universal para Fondos (Videos e Imágenes) + Pywal + Waybar

FULL_PATH="$1"
# Extraemos la extensión del archivo (ej: mp4, jpg)
EXT="${FULL_PATH##*.}"
# Convertimos la extensión a minúsculas por si acaso (ej: JPG -> jpg)
EXT=$(echo "$EXT" | tr '[:upper:]' '[:lower:]')

# 1. Silenciamos las notificaciones molestas de pywal
mkdir -p /tmp/fakebin
ln -sf /usr/bin/true /tmp/fakebin/notify-send
export PATH="/tmp/fakebin:$PATH"

# 2. Matamos CUALQUIER gestor de fondos anterior para evitar peleas (adiós hyprpaper azul)
killall -9 mpvpaper hyprpaper swaybg swww swww-daemon 2>/dev/null
sleep 0.1

# 3. Lógica Condicional: ¿Es Video o Imagen?
if [[ "$EXT" =~ ^(mp4|mkv|webm|gif)$ ]]; then
    # === ES UN VIDEO ===
    nohup mpvpaper -o "loop no-audio" "*" "$FULL_PATH" >/dev/null 2>&1 &
    # Extraemos foto en el segundo 1.0 (esto arregla el fallo con videos cortos como Pochita)
    ffmpeg -y -i "$FULL_PATH" -ss 00:00:01.000 -vframes 1 /tmp/live_wall_frame.jpg -loglevel quiet
    wal -n -q -i /tmp/live_wall_frame.jpg >/dev/null 2>&1

elif [[ "$EXT" =~ ^(jpg|jpeg|png)$ ]]; then
    # === ES UNA IMAGEN ===
    # Usamos swaybg (muy estándar y ligero) para colocar la imagen
    nohup swaybg -i "$FULL_PATH" -m fill >/dev/null 2>&1 &
    # Pywal lee los colores directamente de la imagen
    wal -n -q -i "$FULL_PATH" >/dev/null 2>&1
fi

# 4. Sincronización perfecta: Esperamos a Pywal y reiniciamos Waybar
sleep 0.5
killall waybar
sleep 0.2
hyprctl dispatch exec waybar

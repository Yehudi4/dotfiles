#!/bin/bash
# Script Universal de Fondos y Sincronización CSS

FULL_PATH="$1"
EXT="${FULL_PATH##*.}"
EXT=$(echo "$EXT" | tr '[:upper:]' '[:lower:]')

# Variables de entorno esenciales
export PATH="$HOME/.local/bin:/usr/bin:/bin:/usr/local/bin:$PATH"

# 1. Limpiamos cualquier gestor de fondos previo
killall -9 mpvpaper hyprpaper swaybg swww swww-daemon 2>/dev/null
sleeo 0.2

# 2. Aplicamos el fondo y definimos la ruta de la imagen
if [[ "$EXT" =~ ^(mp4|mkv|webm|gif)$ ]]; then
    # ES UN VIDEO
    BASENAME=$(basename "$FULL_PATH")
    IMG_PATH="/tmp/${BASENAME}.jpg"
    
    ffmpeg -y -i "$FULL_PATH" -ss 00:00:01.000 -vframes 1 "$IMG_PATH" -loglevel quiet
    
    # Ejecución blindada y directa. Linux puro, sin pasar por hyprctl
    nohup mpvpaper -o "loop no-audio" "*" "$FULL_PATH" >/dev/null 2>&1 & disown
else
    # ES UNA IMAGEN
    IMG_PATH="$FULL_PATH"
    
    # Ejecución blindada y directa
    nohup swaybg -i "$FULL_PATH" -m fill >/dev/null 2>&1 & disown
fi

# 3. Hilo Secundario Secuencial (Libera AGS de inmediato)
(
    # A. Pywal extrae el color de forma síncrona (SIN el símbolo & al final)
    # El script NO avanzará a la siguiente línea hasta que esto termine al 100%
    wal -q -n -s -t -e -i "$IMG_PATH"
    
    # B. Tiempo de seguridad para asegurar la escritura del archivo CSS en el disco
    sleep 0.8
    
    # C. Limpiamos la caché de Waybar
    killall waybar
    sleep 0.3
    
    # D. Levantamos Waybar con la nueva paleta garantizada
    hyprctl dispatch exec waybar
) >/dev/null 2>&1 &
disown

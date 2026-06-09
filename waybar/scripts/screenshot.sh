#!/bin/bash

# Directorio para guardar las capturas
DIR="/home/yehudi/Capturas"
mkdir -p "$DIR"

# Nombre de archivo con timestamp
NAME="${DIR}/Screenshot_$(date +%Y%m%d-%H%M%S).png"

# Notificación de inicio (opcional, si tienes un notificador)
# notify-send -i camera-photo-symbolic "Captura de Pantalla" "Haz clic y arrastra para seleccionar el área"

# Capturar área con grim y slurp, guardar en archivo
grim -g "$(slurp)" "$NAME"

# Notificación de éxito
if [ $? -eq 0 ]; then
    notify-send -i "$NAME" "Captura Guardada" "Se ha guardado en: $(basename "$NAME")"
else
    notify-send -i error "Error de Captura" "La captura fue cancelada o falló."
fi

#!/bin/bash

COLOR=$(sed -n '2p' ~/.cache/wal/colors 2>/dev/null || echo "#ff0000")
BG=$(sed -n '1p' ~/.cache/wal/colors 2>/dev/null || echo "#1a1b26")

# Valores
cpu=$(grep "cpu " /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print int(usage)}')
ram=$(free | awk '/Mem:/ {print int($3*100/$2)}')
disco=$(df / | awk 'NR==2 {print int($5)}')
temp=$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null | awk '{print int($1/1000)}')
bat=$(cat /sys/class/power_supply/BAT0/capacity 2>/dev/null || echo "100")

# Circunferencia del círculo (radio 10, circunferencia = 2*pi*10 ≈ 62.83)
CIRC=62.83

make_svg() {
    local value=$1
    local icon=$2
    local name=$3
    local fill=$(echo "$value $CIRC" | awk '{printf "%.2f", ($1/100)*$2}')
    local empty=$(echo "$fill $CIRC" | awk '{printf "%.2f", $2-$1}')
    cat > /tmp/waybar_icons/${name}.svg << SVGEOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="28" height="28">
  <!-- Fondo del círculo -->
  <circle cx="18" cy="18" r="10" fill="none" stroke="${BG}" stroke-width="2.5" opacity="0.6"/>
  <!-- Arco de llenado (pie chart) -->
  <circle cx="18" cy="18" r="10" fill="none"
    stroke="${COLOR}" stroke-width="2.5"
    stroke-dasharray="${fill} ${empty}"
    stroke-dashoffset="15.71"
    stroke-linecap="round"/>
  <!-- Icono central -->
  <text x="18" y="22" text-anchor="middle" font-size="10" fill="${COLOR}" font-family="JetBrainsMono Nerd Font">${icon}</text>
</svg>
SVGEOF
}

mkdir -p /tmp/waybar_icons
make_svg $cpu "" "cpu"
make_svg $ram "" "ram"
make_svg $disco "" "disco"
make_svg $((temp > 100 ? 100 : temp*100/90)) "" "temp"
make_svg $bat "" "bat"

# Output JSON para waybar
echo "{\"cpu\":$cpu,\"ram\":$ram,\"disco\":$disco,\"temp\":$temp,\"bat\":$bat}"

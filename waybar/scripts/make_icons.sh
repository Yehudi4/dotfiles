#!/bin/bash

COLOR=$(sed -n '2p' ~/.cache/wal/colors 2>/dev/null || echo "#ff0000")
BG=$(sed -n '1p' ~/.cache/wal/colors 2>/dev/null || echo "#1a1b26")
CIRC=62.83
ICONS=~/.config/waybar/icons
mkdir -p /tmp/waybar_icons

make_icon() {
    local value=$1
    local name=$2
    local icon_file=$3
    local fill=$(awk "BEGIN {printf \"%.2f\", ($value/100)*$CIRC}")
    local empty=$(awk "BEGIN {printf \"%.2f\", $CIRC-$fill}")
    local icon_content=$(sed 's/<svg[^>]*>//;s/<\/svg>//' "$icon_file" \
        | sed "s/fill=\"[^\"]*\"/fill=\"${COLOR}\"/g" \
        | sed "s/stroke=\"[^\"]*\"/stroke=\"${COLOR}\"/g" \
        | sed '/fill="none"/!s/fill="/fill="${COLOR}"/g')

    cat > /tmp/waybar_icons/${name}.svg << SVGEOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
  <circle cx="18" cy="18" r="15" fill="${BG}" opacity="0.6"/>
  <circle cx="18" cy="18" r="15" fill="none"
    stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
  <circle cx="18" cy="18" r="15" fill="none"
    stroke="${COLOR}" stroke-width="2.5"
    stroke-dasharray="${fill} ${empty}"
    stroke-dashoffset="23.56"
    stroke-linecap="round"/>
  <g transform="translate(9,9) scale(0.5)">
    ${icon_content}
  </g>
</svg>
SVGEOF
    rsvg-convert -w 36 -h 36 /tmp/waybar_icons/${name}.svg \
        -o /tmp/waybar_icons/${name}.png
}

cpu=$(grep "cpu " /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print int(usage)}')
ram=$(free | awk '/Mem:/ {print int($3*100/$2)}')
disco=$(df / | awk 'NR==2 {print int($5)}')
temp=$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null | awk '{print int($1/1000)}')
temp_pct=$(awk "BEGIN {print ($temp > 90 ? 100 : int($temp*100/90))}")
bat=$(cat /sys/class/power_supply/BAT0/capacity 2>/dev/null || echo "100")

make_icon $cpu      "cpu"   "${ICONS}/cpu.svg"
make_icon $ram      "ram"   "${ICONS}/ram.svg"
make_icon $disco    "disco" "${ICONS}/disco.svg"
make_icon $temp_pct "temp"  "${ICONS}/temp.svg"
make_icon $bat      "bat"   "${ICONS}/bat.svg"

echo "{\"cpu\":$cpu,\"ram\":$ram,\"disco\":$disco,\"temp\":$temp,\"bat\":$bat}"

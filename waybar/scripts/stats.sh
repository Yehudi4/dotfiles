#!/bin/bash

COLOR=$(sed -n '2p' ~/.cache/wal/colors 2>/dev/null || echo "#ff0000")

cpu=$(grep "cpu " /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print int(usage)}')
ram=$(free | awk '/Mem:/ {print int($3*100/$2)}')
disco=$(df / | awk 'NR==2 {print int($5)}')
temp=$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null | awk '{print int($1/1000)}')
bat=$(cat /sys/class/power_supply/BAT0/capacity 2>/dev/null || echo "100")

case $1 in
    cpu)   echo "{\"text\":\" ${cpu}%\",\"percentage\":${cpu}}" ;;
    ram)   echo "{\"text\":\" ${ram}%\",\"percentage\":${ram}}" ;;
    disco) echo "{\"text\":\" ${disco}%\",\"percentage\":${disco}}" ;;
    temp)  echo "{\"text\":\" ${temp}°\",\"percentage\":$((temp>90?100:temp*100/90))}" ;;
    bat)   echo "{\"text\":\" ${bat}%\",\"percentage\":${bat}}" ;;
esac

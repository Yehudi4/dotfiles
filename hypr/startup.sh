#!/bin/bash
WALL=$(cat ~/.config/current_wallpaper)
awww-daemon &
sleep 1
awww img "$WALL"
wal -i "$WALL" -s -t
sleep 1

COLOR=$(sed -n '2p' ~/.cache/wal/colors)
BG=$(sed -n '1p' ~/.cache/wal/colors)

cat > ~/.config/waybar/style.css << CSSEOF
* {
    font-family: "JetBrainsMono Nerd Font", sans-serif;
    font-size: 13px;
    font-weight: bold;
    border: none;
    color: #ffffff;
}

window#waybar {
    background-color: rgba(10,10,15,0.25);
    border: none;
}

#custom-cpu, #custom-ram, #custom-disco, #custom-temp, #custom-bat {
    color: #ffffff;
    padding: 0 4px 0 0;
    margin: 0;
    font-size: 12px;
}

image {
    margin: 4px 0 4px 4px;
}

#custom-media {
    color: #ffffff;
    padding: 0 0 0 16px;
    font-size: 12px;
    opacity: 0.85;
}

#workspaces {
    background: transparent;
    margin: 0;
    padding: 0;
}

#workspaces button {
    color: rgba(255,255,255,0.5);
    background: transparent;
    border: none;
    padding: 0 6px;
    margin: 0 1px;
    font-size: 12px;
}

#workspaces button.active {
    color: ${BG};
    background-color: ${COLOR};
    border-radius: 50%;
    padding: 4px 4px;
    margin: 4px 3px;
    min-width: 22px;
    min-height: 22px;
    font-size: 11px;
}

#workspaces button:hover {
    color: #ffffff;
    background: transparent;
}

#clock {
    color: #ffffff;
    padding: 0 12px 0 8px;
    margin: 0;
    font-size: 12px;
}

image#firefox, image#steam, image#discord, image#telegram {
    margin: 0 6px;
}

#custom-notif, #custom-volume, #custom-mic, #custom-bluetooth, #custom-wifi {
    font-size: 14px;
    padding: 0 8px;
    margin: 0 3px;
}

#custom-sep {
    color: rgba(255,255,255,0.3);
    padding: 0 0 0 12px;
}

#custom-wifi {
    margin-right: 12px;
}

#custom-notif.on, #custom-volume.on, #custom-mic.on, #custom-bluetooth.on, #custom-wifi.on {
    color: ${COLOR};
}

#custom-notif.off, #custom-volume.off, #custom-mic.off, #custom-bluetooth.off, #custom-wifi.off {
    color: #ffffff;
}
CSSEOF

~/.config/rofi/generate_theme.sh
python3 ~/.config/waybar/scripts/make_icons.py
killall waybar
sleep 0.5
waybar > /dev/null 2>&1 & disown

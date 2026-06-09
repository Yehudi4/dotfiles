#!/bin/bash
COLOR=$(sed -n '2p' ~/.cache/wal/colors)
BG=$(sed -n '1p' ~/.cache/wal/colors)

cat > ~/.config/rofi/theme.rasi << EOF
* {
    background-color: transparent;
    text-color:       #ffffff;
}

window {
    background-color: ${BG}40;
    border-radius:    10px;
    border-color:     ${COLOR};
    border:           1px;
    width:            500px;
    padding:          12px;
}

mainbox {
    background-color: transparent;
    children:         [ inputbar, listview ];
    spacing:          8px;
}

inputbar {
    background-color: transparent;
    spacing:          8px;
    children:         [ prompt, entry ];
}

prompt {
    background-color: ${COLOR};
    text-color:       #ffffff;
    font:             "JetBrainsMono Nerd Font 14";
    border-radius:    50%;
    padding:          12px 12px 12px 10px;
    vertical-align:   0.5;
}

entry {
    background-color: ${BG};
    text-color:        #ffffff;
    placeholder:       "Buscar aplicación...";
    placeholder-color: #888888;
    font:              "JetBrainsMono Nerd Font 13";
    border-radius:    8px;
    padding:          8px 12px;
    expand:           true;
    vertical-align:   0.5;
}

listview {
    background-color: transparent;
    columns:          1;
    lines:            6;
    spacing:          4px;
    scrollbar:        false;
}

element {
    background-color: transparent;
    border-radius:    8px;
    padding:          8px 12px;
    spacing:          10px;
    children:         [ element-icon, element-text ];
}

element selected {
    background-color: ${COLOR};
}

element-icon {
    size: 28px;
}

element-text {
    text-color:     #ffffff;
    font:           "JetBrainsMono Nerd Font 13";
    vertical-align: 0.5;
}
EOF

#!/bin/bash

case $1 in
    wifi)
        STATE=$(nmcli radio wifi)
        if [ "$STATE" = "enabled" ]; then
            echo "{\"text\":\"\uf1eb\",\"class\":\"on\"}"
        else
            echo "{\"text\":\"\uf1eb\",\"class\":\"off\"}"
        fi
        ;;
    bluetooth)
        STATE=$(bluetoothctl show | grep "Powered: yes")
        if [ -n "$STATE" ]; then
            echo "{\"text\":\"\uf293\",\"class\":\"on\"}"
        else
            echo "{\"text\":\"\uf293\",\"class\":\"off\"}"
        fi
        ;;
    mic)
        STATE=$(pactl get-source-mute @DEFAULT_SOURCE@ | grep "Mute: no")
        if [ -n "$STATE" ]; then
            echo "{\"text\":\"\uf130\",\"class\":\"on\"}"
        else
            echo "{\"text\":\"\uf130\",\"class\":\"off\"}"
        fi
        ;;
    notif)
        STATE=$(dunstctl is-paused)
        if [ "$STATE" = "false" ]; then
            echo "{\"text\":\"\uf0f3\",\"class\":\"on\"}"
        else
            echo "{\"text\":\"\uf0f3\",\"class\":\"off\"}"
        fi
        ;;
esac

#!/usr/bin/env python3
from PIL import Image, ImageDraw
import os, json, shutil

def read_wal_color(line_num):
    try:
        with open(os.path.expanduser('~/.cache/wal/colors')) as f:
            lines = f.readlines()
            hex_color = lines[line_num].strip().lstrip('#')
            r = int(hex_color[0:2], 16)
            g = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
            return (r, g, b)
    except:
        return (98, 90, 98)

fill_rgb = read_wal_color(1)
bg_rgb   = read_wal_color(0)

SIZE = 64
CENTER = SIZE // 2
ICONS_DIR = os.path.expanduser('~/.config/waybar/icons')
OUT_DIR = '/tmp/waybar_icons'
os.makedirs(OUT_DIR, exist_ok=True)

def make_icon(value_pct, icon_name, out_name):
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([3, 3, SIZE-3, SIZE-3], fill=(*bg_rgb, 180))
    if value_pct > 0:
        angle = 360 * value_pct / 100
        draw.pieslice([3, 3, SIZE-3, SIZE-3], start=-90, end=-90+angle, fill=(*fill_rgb, 210))
   # draw.ellipse([3, 3, SIZE-3, SIZE-3], outline=(255, 255, 255, 50), width=2)
    icon_path = os.path.join(ICONS_DIR, f'{icon_name}_white.png')
    if os.path.exists(icon_path):
        icon = Image.open(icon_path).convert('RGBA')
        icon_size = int(SIZE * 0.55)
        icon = icon.resize((icon_size, icon_size), Image.LANCZOS)
        offset = (CENTER - icon_size // 2, CENTER - icon_size // 2)
        img.paste(icon, offset, icon)
    img.save(os.path.join(OUT_DIR, f'{out_name}.png'))

def get_cpu():
    with open('/proc/stat') as f:
        parts = f.readline().split()
    idle = int(parts[4])
    total = sum(int(x) for x in parts[1:])
    return max(0, min(100, int((1 - idle/total) * 100)))

def get_ram():
    with open('/proc/meminfo') as f:
        lines = {l.split(':')[0]: int(l.split()[1]) for l in f if ':' in l}
    return int((lines['MemTotal'] - lines['MemAvailable']) / lines['MemTotal'] * 100)

def get_disco():
    usage = shutil.disk_usage('/')
    return int(usage.used / usage.total * 100)

def get_temp():
    try:
        with open('/sys/class/thermal/thermal_zone6/temp') as f:
            t = int(f.read()) // 1000
        return min(100, int(t * 100 / 90))
    except:
        return 0

def get_bat():
    try:
        with open('/sys/class/power_supply/BAT0/capacity') as f:
            return int(f.read().strip())
    except:
        return 100

cpu   = get_cpu()
ram   = get_ram()
disco = get_disco()
temp  = get_temp()
bat   = get_bat()

make_icon(cpu,   'cpu',   'cpu')
make_icon(ram,   'ram',   'ram')
make_icon(disco, 'disco', 'disco')
make_icon(temp,  'temp',  'temp')
make_icon(bat,   'bat',   'bat')

print(json.dumps({'cpu': cpu, 'ram': ram, 'disco': disco, 'temp': temp, 'bat': bat}))

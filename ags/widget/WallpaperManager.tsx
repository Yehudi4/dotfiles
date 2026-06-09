import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { exec, execAsync } from "ags/process"
import GLib from "gi://GLib"

export default function WallpaperManager(gdkmonitor: Gdk.Monitor) {
    const { TOP, RIGHT, BOTTOM, LEFT } = Astal.WindowAnchor

    const wallpapersDir = "/home/yehudi/Wallpapers-Live/"
    let allVideos: string[] = []
    try {
        const out = exec(`ls ${wallpapersDir}`)
        allVideos = out.split("\n").filter(f => f.match(/\.(mp4|mkv|webm|jpg|jpeg|png|gif)$/i))
    } catch (e) {
        console.log("No se pudo leer la carpeta")
    }

    let searchQuery = ""
    let activeIndex = 0
    
    // Almacenamos el elemento, su caja y su "Revealer" (el animador)
    type CarouselItem = { file: string, revealer: Gtk.Revealer, box: Gtk.Box }
    let allItems: CarouselItem[] = []
    let visibleItems: CarouselItem[] = []

    const counterLabel = new Gtk.Label({ label: `1 / ${allVideos.length}`, cssClasses: ["wm-counter"], valign: Gtk.Align.CENTER })
    const carouselContainer = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 25, halign: Gtk.Align.CENTER })
    
    const scrolledWindow = new Gtk.ScrolledWindow({
        hscrollbarPolicy: Gtk.PolicyType.AUTOMATIC, 
        vscrollbarPolicy: Gtk.PolicyType.NEVER,
        cssClasses: ["wm-carousel-scroll"],
        hexpand: true
    })
    scrolledWindow.set_child(carouselContainer)

    // ==========================================
    // MOTOR DE DESLIZAMIENTO SUAVE
    // ==========================================
    let scrollTimeout: number | null = null;
    const smoothScroll = (targetX: number) => {
        const adjustment = scrolledWindow.get_hadjustment()
        if (!adjustment) return;
        
        const startX = adjustment.get_value();
        const distance = targetX - startX;
        if (Math.abs(distance) < 1) return; 

        if (scrollTimeout !== null) {
            GLib.source_remove(scrollTimeout);
            scrollTimeout = null;
        }

        let step = 0;
        const totalSteps = 15;

        scrollTimeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, () => {
            step++;
            const progress = step / totalSteps;
            const ease = 1 - Math.pow(1 - progress, 3);
            adjustment.set_value(startX + (distance * ease));
            
            if (step < totalSteps) return true;
            
            adjustment.set_value(targetX);
            scrollTimeout = null;
            return false;
        });
    }

    // ==========================================
    // LÓGICA DE CENTRADO Y ZOOM
    // ==========================================
    const updateSelection = () => {
        if (visibleItems.length === 0) return;
        if (activeIndex >= visibleItems.length) activeIndex = visibleItems.length - 1;
        if (activeIndex < 0) activeIndex = 0;

        counterLabel.set_label(`${activeIndex + 1} / ${visibleItems.length}`)

        // Actualizar zoom
        visibleItems.forEach((item, i) => {
            if (i === activeIndex) {
                item.box.set_css_classes(["wm-carousel-item", "active"])
            } else {
                item.box.set_css_classes(["wm-carousel-item"])
            }
        })

        // La matemática aplica solo a los elementos que están visibles
        const targetX = activeIndex * 185;
        smoothScroll(Math.max(0, targetX));
    }

    // ==========================================
    // CONSTRUCTOR INICIAL (Con Revealer Animado)
    // ==========================================
    const initItems = () => {
        carouselContainer.append(new Gtk.Box({ cssClasses: ["wm-pad"] }))

        allVideos.forEach((file) => {
            // El componente mágico que colapsa y expande con fluidez
            const revealer = new Gtk.Revealer({
                transitionType: Gtk.RevealerTransitionType.SLIDE_LEFT,
                transitionDuration: 350, // Velocidad de la animación en milisegundos
                revealChild: true
            })

            const itemBox = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
                cssClasses: ["wm-carousel-item"],
                valign: Gtk.Align.CENTER
            })

            const previewBox = new Gtk.Box({ cssClasses: ["wm-item-preview"], valign: Gtk.Align.CENTER, halign: Gtk.Align.CENTER })
            previewBox.append(new Gtk.Label({ label: "Miniatura", cssClasses: ["wm-temp-icon"] }))

            const nameLabel = new Gtk.Label({
                label: file.length > 15 ? file.substring(0, 15) + "..." : file,
                cssClasses: ["wm-item-label"]
            })

            itemBox.append(previewBox)
            itemBox.append(nameLabel)
            
            revealer.set_child(itemBox)
            carouselContainer.append(revealer)

            allItems.push({ file, revealer, box: itemBox })
            visibleItems.push({ file, revealer, box: itemBox })
        })

        carouselContainer.append(new Gtk.Box({ cssClasses: ["wm-pad"] }))
        updateSelection()
    }

    // ==========================================
    // BUSCADOR FLUIDO EN TIEMPO REAL
    // ==========================================
    const filterItems = () => {
        visibleItems = []
        allItems.forEach(item => {
            const matches = item.file.toLowerCase().includes(searchQuery.toLowerCase())
            
            // Activa la animación GTK nativa para ocultar/mostrar
            item.revealer.set_reveal_child(matches) 
            
            if (matches) visibleItems.push(item)
        })

        if (visibleItems.length === 0) {
            counterLabel.set_label(`0 / ${allVideos.length}`)
        } else {
            activeIndex = 0
            // Pequeño retraso para que la animación del Revealer empiece antes de calcular el scroll
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10, () => {
                updateSelection()
                return false
            })
        }
    }

    // Arrancamos todo
    initItems()

    const win = new Astal.Window({
        visible: false,
        name: "wallpaper-manager",
        gdkmonitor: gdkmonitor,
        anchor: TOP | RIGHT | BOTTOM | LEFT,
        application: app,
        cssClasses: ["WallpaperWindow"],
        exclusivity: Astal.Exclusivity.IGNORE,
        keymode: Astal.Keymode.ON_DEMAND
    })

    const keyController = new Gtk.EventControllerKey()
    keyController.connect("key-pressed", (self, keyval) => {
        if (visibleItems.length === 0) return false

        if (keyval === Gdk.KEY_Left) {
            if (activeIndex > 0) { activeIndex--; updateSelection(); }
            return true 
        }
        if (keyval === Gdk.KEY_Right) {
            if (activeIndex < visibleItems.length - 1) { activeIndex++; updateSelection(); }
            return true
        }

// ¡APLICAR EL FONDO CON ENTER!
        if (keyval === Gdk.KEY_Return || keyval === Gdk.KEY_KP_Enter) {
            const selected = visibleItems[activeIndex];
            if (selected) {
                const fullPath = `${wallpapersDir}${selected.file}`;
                
                // La magia: mpvpaper + ffmpeg foto + pywal + reiniciar waybar
                const applyCmd = `bash /home/yehudi/.config/ags/apply_wallpaper.sh "${fullPath}"`;
                execAsync(applyCmd).catch(print);
                win.visible = false; 
            }
            return true;
        }
        return false
    })
    win.add_controller(keyController)

    const mainBox = new Gtk.Box({ cssClasses: ["WallpaperContainer"], hexpand: true, vexpand: true, orientation: Gtk.Orientation.VERTICAL })
    
    const topPill = new Gtk.Box({ cssClasses: ["wm-top-pill"], halign: Gtk.Align.CENTER, valign: Gtk.Align.START })
    const typePill = new Gtk.Box({ cssClasses: ["wm-type-pill"], valign: Gtk.Align.CENTER })
    typePill.append(new Gtk.Label({ label: "Video" }))
    topPill.append(typePill)
    topPill.append(counterLabel)
    topPill.append(new Gtk.Label({ label: "Hidamari", cssClasses: ["wm-engine"], valign: Gtk.Align.CENTER }))
    mainBox.append(topPill)

    const previewBox = new Gtk.Box({ hexpand: true, vexpand: true, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER, cssClasses: ["wm-preview-box"] })
    previewBox.append(new Gtk.Label({ label: "[Aquí flotará el Wallpaper Seleccionado]", cssClasses: ["temp-text"] }))
    mainBox.append(previewBox)

    const carouselOuterBox = new Gtk.Box({ cssClasses: ["wm-carousel-box"], halign: Gtk.Align.CENTER, valign: Gtk.Align.END, widthRequest: 750 })
    carouselOuterBox.append(scrolledWindow)
    mainBox.append(carouselOuterBox)

    const searchBox = new Gtk.Box({ cssClasses: ["wm-search-box"], halign: Gtk.Align.CENTER, valign: Gtk.Align.END, orientation: Gtk.Orientation.HORIZONTAL })
    searchBox.append(new Gtk.Label({ label: "← →", cssClasses: ["wm-search-icons"] }))
    searchBox.append(new Gtk.Label({ label: "Hidamari", cssClasses: ["wm-search-icons", "accent"] }))
    searchBox.append(new Gtk.Label({ label: "⤢", cssClasses: ["wm-search-icons"] }))
    
    const searchEntry = new Gtk.Entry({ placeholder_text: 'Hit "/" to search', cssClasses: ["wm-search-entry"], valign: Gtk.Align.CENTER })
    searchEntry.connect("changed", (self) => {
        searchQuery = self.get_text() || ""
        filterItems() // Ahora llama a la función fluida en lugar de destruir todo
    })
    
// Aplicar con Enter desde el buscador
    searchEntry.connect("activate", () => {
        if (visibleItems.length > 0) {
            const fullPath = `${wallpapersDir}${visibleItems[activeIndex].file}`;
            const applyCmd = `bash /home/yehudi/.config/ags/apply_wallpaper.sh "${fullPath}"`;            
            execAsync(applyCmd).catch(print);
            win.visible = false; 
        }
    })
    
    searchBox.append(searchEntry)
    searchBox.append(new Gtk.Label({ label: "Enter Apply", cssClasses: ["wm-search-icons"] }))
    searchBox.append(new Gtk.Label({ label: "Esc Close", cssClasses: ["wm-search-icons"] }))
    mainBox.append(searchBox)

    win.set_child(mainBox)
    return win
}

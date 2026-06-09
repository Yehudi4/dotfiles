import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"
import Wp from "gi://AstalWp"
import Notifd from "gi://AstalNotifd" // <-- Importamos el motor de notificaciones

export default function Bar(gdkmonitor: Gdk.Monitor) {
    const { TOP, RIGHT, BOTTOM } = Astal.WindowAnchor
    const profileImagePath = "/home/yehudi/.config/ags/assets/profile.png"
    
    // --- DATOS BÁSICOS ---
    const uptime = createPoll("", 60000, `sh -c "uptime -p | sed 's/up //'"` )
    
    // --- ESTADOS DE RED ---
    const wifiStatus = createPoll("enabled", 2000, `sh -c "nmcli radio wifi"`)
    const btStatus = createPoll("enabled", 2000, `sh -c "bluetoothctl show | grep 'Powered: yes' >/dev/null && echo 'enabled' || echo 'disabled'"`)
    const currentWifi = createPoll("Desconectado", 2000, `sh -c 'res=$(nmcli -t -f TYPE,NAME connection show --active | grep -E "wireless|wifi" | cut -d":" -f2); echo "\${res:-Desconectado}"'`)
    const currentBt = createPoll("Desconectado", 2000, `sh -c 'res=\$(bluetoothctl devices Connected | head -n 1 | cut -d" " -f3-); echo "\${res:-Desconectado}"'`)

    const audio = Wp.get_default()?.audio

    // --- LÓGICA DE LISTA WI-FI ---
    let isWifiListOpen = false;
    const wifiListContainer = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, visible: false, css_classes: ["wifi-list"] });

    const toggleWifiList = async () => {
        isWifiListOpen = !isWifiListOpen;
        wifiListContainer.set_visible(isWifiListOpen);
        if (isWifiListOpen) {
            let child = wifiListContainer.get_first_child();
            while (child) { wifiListContainer.remove(child); child = wifiListContainer.get_first_child(); }
            wifiListContainer.append(new Gtk.Label({ label: "Escaneando redes...", css_classes: ["wifi-loading"] }));

            try {
                const output = await execAsync("nmcli -t -f SSID,SIGNAL dev wifi");
                const lines = output.split("\n").filter(l => l.trim() !== "");
                const seen = new Set();
                const networks = [];
                for (const line of lines) {
                    const [ssid, signal] = line.split(":");
                    if (ssid && ssid !== "--" && !seen.has(ssid)) { seen.add(ssid); networks.push({ ssid, signal }); }
                }

                child = wifiListContainer.get_first_child();
                while (child) { wifiListContainer.remove(child); child = wifiListContainer.get_first_child(); }

                for (const net of networks.slice(0, 5)) {
                    const rowBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, css_classes: ["wifi-item"] });
                    const nameBtn = new Gtk.Button({ label: `${net.ssid} (${net.signal}%)`, halign: Gtk.Align.FILL, css_classes: ["wifi-name-btn"] });
                    
                    const passBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, visible: false, css_classes: ["wifi-pass-box"] });
                    const passEntry = new Gtk.Entry({ placeholder_text: "Contraseña...", hexpand: true, visibility: false }); 
                    const connectBtn = new Gtk.Button({ label: "Conectar", css_classes: ["wifi-connect-btn"] });

                    connectBtn.connect("clicked", () => {
                        const pass = passEntry.get_text();
                        connectBtn.set_label("...");
                        execAsync(`nmcli dev wifi connect "${net.ssid}" password "${pass}"`).then(() => { connectBtn.set_label("¡Listo!"); passBox.set_visible(false); }).catch(() => connectBtn.set_label("Error"));
                    });

                    passBox.append(passEntry); passBox.append(connectBtn);
                    
                    nameBtn.connect("clicked", async () => {
                        nameBtn.set_label(`Conectando a ${net.ssid}...`);
                        try {
                            await execAsync(`nmcli dev wifi connect "${net.ssid}"`);
                            nameBtn.set_label(`${net.ssid} (¡Conectado!)`);
                        } catch (err) {
                            nameBtn.set_label(`${net.ssid} (Requiere clave)`);
                            passBox.set_visible(true);
                        }
                    });

                    rowBox.append(nameBtn); rowBox.append(passBox);
                    wifiListContainer.append(rowBox);
                }
            } catch (e) {}
        }
    };

    // --- LÓGICA DE LISTA BLUETOOTH ---
    let isBtListOpen = false;
    const btListContainer = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, visible: false, css_classes: ["wifi-list"] });

    const toggleBtList = async () => {
        isBtListOpen = !isBtListOpen;
        btListContainer.set_visible(isBtListOpen);
        if (isBtListOpen) {
            let child = btListContainer.get_first_child();
            while (child) { btListContainer.remove(child); child = btListContainer.get_first_child(); }
            btListContainer.append(new Gtk.Label({ label: "Buscando dispositivos...", css_classes: ["wifi-loading"] }));

            try {
                const output = await execAsync("bluetoothctl devices");
                const lines = output.split("\n").filter(l => l.startsWith("Device "));
                
                child = btListContainer.get_first_child();
                while (child) { btListContainer.remove(child); child = btListContainer.get_first_child(); }

                for (const line of lines.slice(0, 5)) {
                    const parts = line.split(" ");
                    const mac = parts[1];
                    const name = parts.slice(2).join(" ");
                    
                    const rowBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, css_classes: ["wifi-item"] });
                    const nameBtn = new Gtk.Button({ label: name, halign: Gtk.Align.FILL, css_classes: ["wifi-name-btn"] });
                    
                    nameBtn.connect("clicked", () => {
                        nameBtn.set_label("Conectando...");
                        execAsync(`bluetoothctl connect ${mac}`).then(() => nameBtn.set_label(`${name} (Listo)`)).catch(() => nameBtn.set_label(`${name} (Error)`));
                    });

                    rowBox.append(nameBtn);
                    btListContainer.append(rowBox);
                }
            } catch (e) {}
        }
    };

    // --- PANELES MULTIMEDIA ---
    const audioSlider = new Gtk.Scale({ orientation: Gtk.Orientation.HORIZONTAL, draw_value: false, hexpand: true, css_classes: ["main-slider"] });
    if (audio && audio.defaultSpeaker) {
        audioSlider.set_range(0, 1); audioSlider.set_value(audio.defaultSpeaker.volume);
        audio.defaultSpeaker.connect("notify::volume", () => audioSlider.set_value(audio.defaultSpeaker.volume));
        audioSlider.connect("value-changed", () => { audio.defaultSpeaker.volume = audioSlider.get_value(); });
    }

    const brightnessSlider = new Gtk.Scale({ orientation: Gtk.Orientation.HORIZONTAL, draw_value: false, hexpand: true, css_classes: ["main-slider"] });
    brightnessSlider.set_range(0, 1);
    execAsync("sh -c 'echo $(($(brightnessctl get) * 100 / $(brightnessctl max)))'").then(val => brightnessSlider.set_value(Number(val) / 100)).catch(() => {});
    brightnessSlider.connect("value-changed", () => execAsync(`brightnessctl s ${Math.floor(brightnessSlider.get_value() * 100)}%`).catch(() => {}));

    const streamsContainer = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, css_classes: ["streams-list"] });
    if (audio) {
        const updateStreams = () => {
            let child = streamsContainer.get_first_child();
            while (child) { streamsContainer.remove(child); child = streamsContainer.get_first_child(); }
            for (const stream of audio.get_streams()) {
                const streamBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, css_classes: ["stream-item"] });
                const label = new Gtk.Label({ label: stream.name || "Aplicación", halign: Gtk.Align.START, css_classes: ["stream-label"] });
                const slider = new Gtk.Scale({ orientation: Gtk.Orientation.HORIZONTAL, draw_value: false, hexpand: true });
                slider.set_range(0, 1); slider.set_value(stream.volume);
                stream.connect("notify::volume", () => slider.set_value(stream.volume));
                slider.connect("value-changed", () => { stream.volume = slider.get_value(); });
                streamBox.append(label); streamBox.append(slider); streamsContainer.append(streamBox);
            }
        };
        updateStreams();
        audio.connect("notify::streams", updateStreams);
    }

    // --- PANEL 4: NOTIFICACIONES ---
    const notifd = Notifd.get_default();
    const notifContainer = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, css_classes: ["notif-list"] });

    if (notifd) {
        const updateNotifs = () => {
            let child = notifContainer.get_first_child();
            while (child) { notifContainer.remove(child); child = notifContainer.get_first_child(); }

            const notifs = notifd.get_notifications();
            
            if (notifs.length === 0) {
                notifContainer.append(new Gtk.Label({ label: "No tienes notificaciones nuevas.", halign: Gtk.Align.CENTER, css_classes: ["notif-empty"] }));
                return;
            }

            for (const notif of notifs) {
                const notifBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, css_classes: ["notif-item"] });
                
                const textBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, hexpand: true, valign: Gtk.Align.CENTER });
                
                // Forzamos el límite de caracteres para que las notificaciones muy largas no ensanchen el panel
                textBox.append(new Gtk.Label({ label: notif.summary || "Notificación", halign: Gtk.Align.START, css_classes: ["notif-title"], wrap: true, maxWidthChars: 30 }));
                textBox.append(new Gtk.Label({ label: notif.body || "", halign: Gtk.Align.START, css_classes: ["notif-body"], wrap: true, maxWidthChars: 30 }));

                const closeBtn = new Gtk.Button({ label: "X", valign: Gtk.Align.CENTER, css_classes: ["notif-close-btn"] });
                closeBtn.connect("clicked", () => notif.dismiss());

                notifBox.append(textBox);
                notifBox.append(closeBtn);
                notifContainer.append(notifBox);
            }
        };
        updateNotifs();
        // Escucha si llega o se cierra una notificación para actualizar la lista en tiempo real
        notifd.connect("notified", updateNotifs);
        notifd.connect("resolved", updateNotifs);
    }

    // ==========================================
    // RENDERIZADO VISUAL
    // ==========================================
    return (
        <window 
            visible={false} 
            name="sidebar" 
            gdkmonitor={gdkmonitor} 
            exclusivity={Astal.Exclusivity.NORMAL} 
            keymode={Astal.Keymode.ON_DEMAND} 
            anchor={TOP | RIGHT | BOTTOM} 
            application={app} 
            cssClasses={["SidebarWindow"]}
        >
            <box orientation={Gtk.Orientation.VERTICAL} cssClasses={["SidebarContainer"]}>
                
                {/* --- PANEL 1: PERFIL --- */}
                <centerbox cssClasses={["panel", "panel-1"]}>
                    <box $type="start" orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["profile-info"]}>
                        <image cssClasses={["avatar"]} file={profileImagePath} pixelSize={64} />
                        <box orientation={Gtk.Orientation.VERTICAL} cssClasses={["user-text"]} valign={Gtk.Align.CENTER}>
                            <label halign={Gtk.Align.START} label="$YAM$" cssClasses={["username"]} />
                            <label halign={Gtk.Align.START} label={uptime.as(u => `Uptime: ${u || "Cargando..."}`)} cssClasses={["uptime"]} />
                        </box>
                    </box>
                    <box $type="center" />
                    <box $type="end" orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["power-buttons"]} valign={Gtk.Align.CENTER}>
                        <button cssClasses={["circular-btn"]} onClicked={() => execAsync("systemctl reboot")}><image iconName="system-reboot-symbolic" /></button>
                        <button cssClasses={["circular-btn"]} onClicked={() => execAsync("systemctl suspend")}><image iconName="weather-clear-night-symbolic" /></button>
                        <button cssClasses={["circular-btn"]} onClicked={() => execAsync("systemctl poweroff")}><image iconName="system-shutdown-symbolic" /></button>
                    </box>
                </centerbox>

                {/* --- PANEL 2: REDES --- */}
                <box orientation={Gtk.Orientation.VERTICAL} cssClasses={["panel", "panel-2"]}>
                    <box orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["comms-row"]}>
                        
                        <box orientation={Gtk.Orientation.HORIZONTAL} hexpand cssClasses={["comm-box"]}>
                            <button 
                                cssClasses={wifiStatus.as(s => s === "enabled" ? ["comm-icon-btn"] : ["comm-icon-btn", "disabled"])}
                                onClicked={() => execAsync(`sh -c "nmcli radio wifi ${wifiStatus.get() === 'enabled' ? 'off' : 'on'}"`)}
                            >
                                <image iconName="network-wireless-symbolic" />
                            </button>
                            <box orientation={Gtk.Orientation.VERTICAL} hexpand valign={Gtk.Align.CENTER} cssClasses={["comm-texts"]}>
                                <label label="Wi-Fi" halign={Gtk.Align.START} cssClasses={["comm-title"]} />
                                <label label={currentWifi.as(v => v.trim())} halign={Gtk.Align.START} cssClasses={["comm-subtitle"]} />
                            </box>
                            <button cssClasses={["comm-arrow-btn"]} onClicked={toggleWifiList}><label label=">" /></button>
                        </box>

                        <box widthRequest={15} />

                        <box orientation={Gtk.Orientation.HORIZONTAL} hexpand cssClasses={["comm-box"]}>
                            <button 
                                cssClasses={btStatus.as(s => s === "enabled" ? ["comm-icon-btn"] : ["comm-icon-btn", "disabled"])}
                                onClicked={() => execAsync(`sh -c "bluetoothctl power ${btStatus.get() === 'enabled' ? 'off' : 'on'}"`)}
                            >
                                <image iconName="bluetooth-active-symbolic" />
                            </button>
                            <box orientation={Gtk.Orientation.VERTICAL} hexpand valign={Gtk.Align.CENTER} cssClasses={["comm-texts"]}>
                                <label label="Bluetooth" halign={Gtk.Align.START} cssClasses={["comm-title"]} />
                                <label label={currentBt.as(v => v.trim())} halign={Gtk.Align.START} cssClasses={["comm-subtitle"]} />
                            </box>
                            <button cssClasses={["comm-arrow-btn"]} onClicked={toggleBtList}><label label=">" /></button>
                        </box>
                    </box>

                    {wifiListContainer}
                    {btListContainer}
                </box>

                {/* --- PANEL 3: MULTIMEDIA --- */}
                <box orientation={Gtk.Orientation.VERTICAL} cssClasses={["panel", "panel-3"]}>
                    <box orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["sliders-row"]}>
                        <box orientation={Gtk.Orientation.VERTICAL} hexpand cssClasses={["slider-col"]}>
                            <label label="Audio" halign={Gtk.Align.START} cssClasses={["slider-label"]} />
                            {audioSlider}
                        </box>
                        <box widthRequest={20} />
                        <box orientation={Gtk.Orientation.VERTICAL} hexpand cssClasses={["slider-col"]}>
                            <label label="Brillo" halign={Gtk.Align.START} cssClasses={["slider-label"]} />
                            {brightnessSlider}
                        </box>
                    </box>
                    {streamsContainer}
                </box>

                {/* --- PANEL 4: NOTIFICACIONES --- */}
                <box orientation={Gtk.Orientation.VERTICAL} cssClasses={["panel", "panel-4"]}>
                    <label label="Notificaciones" halign={Gtk.Align.START} cssClasses={["notif-header"]} />
                    {notifContainer}
                </box>

                <box vexpand cssClasses={["placeholder-content"]} />
            </box>
        </window>
    )
}

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

let sock;

async function startRobot(phone) {
    // Gunakan folder baru agar tidak bentrok dengan data lama yang error
    const { state, saveCreds } = await useMultiFileAuthState('session_baru');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on("creds.update", saveCreds);

    // MINTA KODE INSTAN (Hanya menunggu 3 detik)
    await new Promise(res => setTimeout(res, 3000));
    
    try {
        console.log("MENGIRIM KODE UNTUK: " + phone);
        let code = await sock.requestPairingCode(phone);
        console.log("KODE BERHASIL: " + code);
        return code;
    } catch (err) {
        console.log("ULANGI LAGI: " + err);
        return "GAGAL_COBA_LAGI";
    }
}

app.get("/pair", async (req, res) => {
    let p = req.query.phone;
    if (!p) return res.json({ code: "ISI NOMOR!" });
    
    // Langsung tembak kode tanpa basa-basi
    let code = await startRobot(p.replace(/[^0-9]/g, ""));
    res.json({ code: code });
});

app.get("/status", (req, res) => res.json({ status: "Aktif" }));

app.post("/send", async (req, res) => {
    try {
        await sock.sendMessage(req.body.phone + "@s.whatsapp.net", { text: req.body.message });
        res.json({ status: "success" });
    } catch (e) { res.json({ status: "error" }); }
});

app.listen(3000, () => { console.log("TURBO AKTIF - PORT 3000"); });

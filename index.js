const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const app = express();
app.use(express.json());

let sock;

async function startWA(phone = null) {
    const { state, saveCreds } = await useMultiFileAuthState('mohan_session');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
    });

    sock.ev.on("creds.update", saveCreds);

    if (phone) {
        // Tunggu 5 detik agar koneksi siap
        await new Promise(resolve => setTimeout(resolve, 5000));
        try {
            let code = await sock.requestPairingCode(phone);
            return code;
        } catch (err) {
            console.error(err);
            return "ERROR";
        }
    }
}

app.get("/pair", async (req, res) => {
    const num = req.query.phone;
    if (!num) return res.json({ code: "NOMOR KOSONG" });
    const pairingCode = await startWA(num);
    res.json({ code: pairingCode });
});

app.post("/send", async (req, res) => {
    const { phone, message } = req.body;
    try {
        await sock.sendMessage(phone + "@s.whatsapp.net", { text: message });
        res.json({ status: "success" });
    } catch (e) {
        res.json({ status: "error" });
    }
});

app.get("/", (req, res) => res.send("Robot Mohan v8 Online!"));

app.listen(3000, () => {
    console.log("SERVER AKTIF DI PORT 3000");
    startWA(); 
});

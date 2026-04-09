const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

let sock;
let statusRobot = "Mati";

async function startWA(phone = null) {
    const { state, saveCreds } = await useMultiFileAuthState('mohan_session');
    const { version } = await fetchLatestBaileysVersion();
    
    sock = makeWASocket({ 
        version, 
        auth: state, 
        printQRInTerminal: false, 
        logger: pino({ level: "silent" }),
        browser: ["Mohan CRM", "Chrome", "1.0.0"]
    });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", (up) => {
        if(up.connection === "open") statusRobot = "Aktif";
        if(up.connection === "close") statusRobot = "Mati";
    });

    if (phone) {
        await new Promise(res => setTimeout(res, 5000));
        return await sock.requestPairingCode(phone);
    }
}

app.get("/status", (req, res) => res.json({ status: statusRobot }));

app.get("/pair", async (req, res) => {
    const code = await startWA(req.query.phone);
    res.json({ code: code });
});

app.post("/send", async (req, res) => {
    try {
        await sock.sendMessage(req.body.phone + "@s.whatsapp.net", { text: req.body.message });
        res.json({ status: "success" });
    } catch (e) { res.json({ status: "error" }); }
});

app.listen(3000, () => { 
    console.log("SERVER UPGRADE AKTIF"); 
    startWA(); 
});

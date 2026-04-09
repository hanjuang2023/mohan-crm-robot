const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const app = express();
app.use(express.json());

let sock;

async function connectToWA(phone = null) {
    const { state, saveCreds } = await useMultiFileAuthState('mohan_session');
    const { version } = await fetchLatestBaileysVersion();
    sock = makeWASocket({ version, auth: state, printQRInTerminal: false, logger: pino({ level: "silent" }) });
    sock.ev.on("creds.update", saveCreds);

    if (phone) {
        await new Promise(res => setTimeout(res, 5000));
        return await sock.requestPairingCode(phone);
    }
}

app.get("/pair", async (req, res) => {
    const code = await connectToWA(req.query.phone);
    res.json({ code: code });
});

app.post("/send", async (req, res) => {
    try {
        await sock.sendMessage(req.body.phone + "@s.whatsapp.net", { text: req.body.message });
        res.json({ status: "success" });
    } catch (e) { res.json({ status: "error" }); }
});

app.listen(3000, () => { console.log("ROBOT_MOHAN_AKTIF"); connectToWA(); });

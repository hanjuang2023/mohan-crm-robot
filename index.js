const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const express = require("express");
const app = express();
app.use(express.json());

let sock;

async function startRobot(phone = null) {
    const { state, saveCreds } = await useMultiFileAuthState('session_mohan');
    sock = makeWASocket({ auth: state, printQRInTerminal: false });
    sock.ev.on('creds.update', saveCreds);

    if (phone) {
        await new Promise(r => setTimeout(r, 7000)); // Tunggu koneksi
        return await sock.requestPairingCode(phone);
    }
}

app.get("/pair", async (req, res) => {
    let code = await startRobot(req.query.phone);
    res.json({ code: code });
});

app.post("/send", async (req, res) => {
    const { target, message } = req.body;
    try {
        await sock.sendMessage(target + "@s.whatsapp.net", { text: message });
        res.json({ status: "success" });
    } catch (e) { res.json({ status: "error" }); }
});

app.get("/", (req, res) => res.send("Robot Mohan Aktif!"));
app.listen(3000, () => { startRobot(); });

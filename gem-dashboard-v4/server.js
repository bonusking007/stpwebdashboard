import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const API_KEY = process.env.GEM_API_KEY || "gemkey";
const ONLINE_THRESHOLD = 30;

let db = {};

app.post("/api/update", (req, res) => {
    const key = req.headers["x-api-key"] || "";
    if (key !== API_KEY) return res.status(401).json({ error: "Unauthorized" });

    const { username, gems, ts } = req.body;
    if (!username) return res.status(400).json({ error: "Missing username" });

    if (!db[username]) db[username] = { username, history: [] };
    db[username].gems = typeof gems === "number" ? gems : 0;
    db[username].ts = ts || Math.floor(Date.now() / 1000);
    db[username].updated_at = new Date().toISOString();
    db[username].history = [...(db[username].history || []).slice(-19), { ts: db[username].ts, gems }];

    res.json({ ok: true });
});

app.get("/api/players", (req, res) => {
    const now = Math.floor(Date.now() / 1000);
    const players = Object.values(db).map(p => ({
        ...p,
        online: (now - (p.ts || 0)) < ONLINE_THRESHOLD
    }));
    res.json({ ok: true, players });
});

// DELETE /api/players/:username — ลบ player
app.delete("/api/players/:username", (req, res) => {
    const { username } = req.params;
    if (db[username]) {
        delete db[username];
        res.json({ ok: true });
    } else {
        res.status(404).json({ error: "Not found" });
    }
});

app.listen(process.env.PORT || 3000, () => console.log("Server running"));

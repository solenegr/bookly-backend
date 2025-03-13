const express = require("express");
const router = express.Router();
const Pusher = require("pusher");

// Configuration de Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: false, // ✅ Activer TLS pour la production
});

// Route d’authentification pour Pusher
router.post("/auth", (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;

  console.log(
    "📡 Authentification demandée pour :",
    channel,
    "socket:",
    socketId
  );

  const auth = pusher.authenticate(socketId, channel);
  console.log("✅ Auth envoyée à Pusher :", auth); // 🔥 Vérifie que Pusher reçoit bien l'authentification
  res.send(auth);
});

module.exports = router;

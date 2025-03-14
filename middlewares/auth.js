const User = require("../models/users");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("authHeader", authHeader)
    // 1️⃣ Vérifie si le header Authorization est présent
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        result: false,
        error: "Accès refusé. Token manquant ou invalide.",
      });
    }
    const token = authHeader.split(" ")[1];

    // 2️⃣ Vérifier si un utilisateur avec ce token existe
    const user = await User.findOne({ token });
console.log("token auth", user)
    if (!user) {
      return res.status(403).json({
        result: false,
        error: "Token invalide ou utilisateur non autorisé.",
      });
    }

    // 3️⃣ Ajouter l'utilisateur dans req.user pour l'utiliser dans les routes
    req.user = user;
    next();
  } catch (error) {
    console.error("Erreur d'authentification :", error);
    res.status(500).json({
      result: false,
      error: "Erreur serveur lors de l'authentification.",
    });
  }
};

module.exports = authMiddleware;

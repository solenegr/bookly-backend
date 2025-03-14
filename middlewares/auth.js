const User = require("../models/users");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Headers reçus :", req.headers);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        result: false,
        error: "Accès refusé. Token manquant ou invalide.",
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("Token extrait :", token);

    // Cherche l'utilisateur par token dans MongoDB
    const user = await User.findOne({ token });
    console.log("Utilisateur trouvé :", user);

    if (!user) {
      return res.status(403).json({
        result: false,
        error: "Token invalide ou utilisateur non autorisé.",
      });
    }

    req.user = user; // Ajoute l'utilisateur au req
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

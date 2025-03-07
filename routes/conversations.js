const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Conversation = require('../models/conversations'); 
const Challenge = require('../models/challenges'); 
const Pusher = require('pusher');
const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

  

  // Ajouter un utilisateur à une conversation
router.put("/:conversationId/add-user/:userId", async (req, res) => {
    const { conversationId,userId } = req.params;
    
    // const conversationObjectId = new mongoose.Types.ObjectId(conversationId);
    // Vérifier si l'ID est valide

    if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "IDs invalides" });
    }

    try {
        // Vérifier si la conversation existe
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: "Conversation non trouvée" });
        }

        // Vérifier si l'utilisateur est déjà dans la conversation
        if (conversation.users.includes(userId)) {
            return res.status(400).json({ error: "L'utilisateur est déjà dans la conversation" });
        }

        // Ajouter l'utilisateur et sauvegarder
        conversation.users.push(userId);
        pusher.trigger('chat', 'join', {
             username: req.params.username,
            });
        await conversation.save();

        res.status(200).json({ result: true, message: "Utilisateur ajouté", conversation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:conversationId/remove-user/:userId', async (req, res) => {
    const { userId, conversationId } = req.params; // Récupérer userId et conversationId depuis les paramètres

    try {
        // Trouver la conversation par son ID
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation non trouvée' });
        }

        // Vérifier si l'utilisateur fait partie de la conversation
        const index = conversation.users.indexOf(userId);
        if (index === -1) {
            return res.status(400).json({ error: 'L\'utilisateur n\'est pas dans cette conversation' });
        }

        // Supprimer l'utilisateur de la conversation
        conversation.users.splice(index, 1); // Retirer l'utilisateur du tableau
        await conversation.save(); // Sauvegarder les modifications
        pusher.trigger('chat', 'leave', {
            username: req.params.username,
          });

        return res.status(200).json({ message: 'Utilisateur supprimé de la conversation' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});


// Créer une nouvelle conversation

router.post('/', async (req, res) => {
    const { users, challengeId } = req.body;
    
    
    if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({ error: 'La liste des utilisateurs doit être un tableau et ne peut pas être vide' });
    }

    if (challengeId && !/^[0-9a-fA-F]{24}$/.test(challengeId)) {
        return res.status(400).json({ error: 'Le challengeId doit être un ID valide' });
    }

    try {
        const newChallenge = new Challenge({
            title: "challenge3" ,
                description: "4 livres par mois",
                books: ["67cabe7ef1c7bf8bcacc5c51"],
                duration: "1 mois",
        })
        newChallenge.save().then(async (data) =>{
        const newConversation = new Conversation({
            users,
            challenge: data._id,
        });
        await newConversation.save();
        res.status(201).json({ result: true, conversation: newConversation });
    }
    )
        
      
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour une conversation
router.put('/:conversationId', async (req, res) => {
    const { conversationId } = req.params;
    const { users, challengeId } = req.body;

    // Validation manuelle
    if (users && (!Array.isArray(users) || users.length === 0)) {
        return res.status(400).json({ error: 'La liste des utilisateurs doit être un tableau et ne peut pas être vide' });
    }

    if (challengeId && !/^[0-9a-fA-F]{24}$/.test(challengeId)) {
        return res.status(400).json({ error: 'Le challengeId doit être un ID valide' });
    }

    try {
        const updatedConversation = await Conversation.findByIdAndUpdate(
            conversationId,
            { users, challenge: challengeId },
            { new: true }
        );

        if (!updatedConversation) {
            return res.status(404).json({ result: false, message: 'Conversation non trouvée' });
        }

        res.status(200).json({ result: true, conversation: updatedConversation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Récupérer toutes les conversations pour un challenge donné
router.get('/challenge/:challengeId', async (req, res) => {
    const { challengeId } = req.params;
    const challengeObjectId = new mongoose.Types.ObjectId( challengeId);
    
    if (!/^[0-9a-fA-F]{24}$/.test(challengeId)) {
        return res.status(400).json({ error: 'Le challengeId doit être un ID valide' });
    }

    try {
        // Trouver toutes les conversations liées à un challenge spécifique
        const conversations = await Conversation.find({ challenge: challengeObjectId })
            .populate('users', 'username') // Peupler le champ 'users' avec le nom d'utilisateur
            .populate('challenge', 'title'); // Peupler le champ 'challengeId' avec le titre du challenge

        if (!conversations || conversations.length === 0) {
            return res.status(404).json({ result: false, message: 'Aucune conversation trouvée pour ce challenge' });
        }

        res.status(200).json({ result: true, conversations });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Récupérer tous les participants d'une conversation
router.get('/:conversationId/participants', async (req, res) => {
    const conversationId = req.params.conversationId;
    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);
    console.log("conversationId:", conversationObjectId);
    // Validation manuelle de l'ID de la conversation
    if (!/^[0-9a-fA-F]{24}$/.test(conversationId)) {
        return res.status(400).json({ error: 'Le conversationId doit être un ID valide' });
    }
  
    
    try {
        // Trouver la conversation par ID et peupler les utilisateurs
        const conversation = await Conversation.findById({ _id: conversationObjectId })
            .populate('users', 'username') // Peupler le champ 'users' avec le nom d'utilisateur
            .select('users'); // Sélectionner uniquement les utilisateurs

        if (!conversation) {
            return res.status(404).json({ result: false, message: 'Conversation non trouvée' });
        }

        // Extraire les utilisateurs
        const participants = conversation.users;
        res.status(200).json({ result: true, participants });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Récupérer tous les participants d'un challenge
router.get('/challenge/:challengeId/participants', async (req, res) => {
    const { challengeId } = req.params;

    // Validation manuelle de l'ID du challenge
    if (!/^[0-9a-fA-F]{24}$/.test(challengeId)) {
        return res.status(400).json({ error: 'Le challengeId doit être un ID valide' });
    }

    try {
        // Trouver toutes les conversations liées à ce challenge
        const conversations = await Conversation.find({ challenge: challengeId })
            .populate('users', 'username') // Peupler les utilisateurs des conversations
            .select('users'); // Sélectionner uniquement les utilisateurs des conversations
            console.log("cccc",conversations);
        if (!conversations || conversations.length === 0) {
            return res.status(404).json({ result: false, message: 'Aucune conversation trouvée pour ce challenge' });
        }

        // Extraire tous les utilisateurs uniques des conversations
        const participants = new Set();
        conversations.forEach(conversation => {
            conversation.users.forEach(user => {
                participants.add(user.username); // Ajouter l'utilisateur au set pour éviter les doublons
            });
        });

        // Convertir le Set en tableau
        const participantsList = Array.from(participants);

        res.status(200).json({ result: true, participants: participantsList });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.delete('/:conversationId', async (req, res) => {
    const { conversationId } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(conversationId)) {
        return res.status(400).json({ error: 'L\'ID de la conversation est invalide' });
    }

    try {
        const deletedConversation = await Conversation.findByIdAndDelete(conversationId);

        if (!deletedConversation) {
            return res.status(404).json({ result: false, message: 'Conversation non trouvée' });
        }

        res.status(200).json({ result: true, message: 'Conversation supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

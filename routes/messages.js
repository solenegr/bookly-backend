var express = require('express');
var router = express.Router();

require('../models/connection');
const Conversation = require('../models/conversations');
const Message = require('../models/messages');
const Pusher = require('pusher');
const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});


// Send message, il ajoute un msg a une coversation donné
router.post('/message', (req, res) => {
  console.log(req.body);
  pusher.trigger('chat', 'message', req.body);

  res.json({ result: true });
});



// Créer un message qui appartient a une conversation

router.post('/:conversationId', async (req, res) => {
  const { content, user } = req.body;
  const { conversationId } = req.params;

  try {
      
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
          return res.status(404).json({ error: 'Conversation non trouvée' });
      }

      
      const newMessage = new Message({
          content,
          user,
          conversation: conversationId,
      });

      
      await newMessage.save();

      
      res.status(201).json({ result: true, message: newMessage });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Obtenir tous les messages d'une conversation

router.get('/:conversationId', async (req, res) => {
  const { conversationId } = req.params;

  try {
      // Récupérer tous les messages d'une conversation
      const messages = await Message.find({ conversation: conversationId })
          .populate('user', 'username') //Peupler avec les informations de l'utilisateur, ici, on ne garde que le champ username
          .populate('conversation', 'title')
          .sort({ createdAt: 1 }); // Trier par date croissante (premier message d'abord)

      res.status(200).json({ result: true, messages });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Supprimer un message
router.delete('/:messageId', async (req, res) => {
  const { messageId } = req.params;

  try {
      
      const message = await Message.findByIdAndDelete(messageId);

      if (!message) {
          return res.status(404).json({ error: 'Message non trouvé' });
      }

      res.status(200).json({ result: true, message: 'Message supprimé avec succès' });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});




module.exports = router;

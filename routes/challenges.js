var express = require('express');
var router = express.Router();

require('../models/connection');
const Challenge = require('../models/challenges');
//Ajouter un nouveau challenge
router.post('/', async (req, res) => {
    const { title, description, duration, books} = req.body;
    try {
        const challenge = new Challenge({ title,description, duration,books});
        await challenge.save();
        res.status(201).json({result: true, challenge: challenge});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//Récupérer tous les Challenges
router.get('/', async (req, res) => {
    try {
        const challenges = await Challenge.find().populate("books");
        res.status(201).json({result: true,challenges: challenges});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//Récupérer un Challenge par ID
router.get('/:challengeId', async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.challengeId).populate("books");
        if (!challenge) {
            return res.status(404).json({ message: "Challenge non trouvé" });
        }
        res.json({result: true, challenge:challenge});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//Modifier un challenge 
router.put('/:challengeId', async (req, res) => {
    const { title, description,duration, books } = req.body;

    try {
        const challenge = await Challenge.findByIdAndUpdate(
            req.params.challengeId,
            { title, description,duration, books },
            { new: true }
        );

        if (!challenge) {
            return res.status(404).json({ message: "Challenge non trouvé" });
        }

        res.json({result: true, challenge:challenge});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//Supprimer un challenge
router.delete('/:challengeId', async (req, res) => {
    try {
        const challenge = await Challenge.findByIdAndDelete(req.params.challengeId);

        if (!challenge) {
            return res.status(404).json({ message: "Challenge non trouvé" });
        }

        res.json({ message: "Challenge supprimé avec succès !" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//Ajouter un Livre à un Challenge
router.post('/:challengeId/add-book', async (req, res) => {
    const { bookId } = req.body;

    try {
        const challenge = await Challenge.findById(req.params.challengeId);
        if (!challenge) {
            return res.status(404).json({ message: "Challenge non trouvé" });
        }

        if (!challenge.books.includes(bookId)) {
            challenge.books.push(bookId);
            await challenge.save();
        }

        res.json({result: true, challenge:challenge});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//Supprimer un Livre à un Challenge
router.post('/:challengeId/remove-book', async (req, res) => {
    const { bookId } = req.body;

    try {
        const challenge = await Challenge.findById(req.params.challengeId);
        if (!challenge) {
            return res.status(404).json({ message: "Challenge non trouvé" });
        }
        challenge.books = challenge.books.filter(id => id.toString() !== bookId);
        await challenge.save();

        res.json({result: true, challenge:challenge});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//recuperer tous les livres d'un challenge

router.get('/:challengeId/books', async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.challengeId).populate("books");
        if (!challenge) {
            return res.status(404).json({ message: "Challenge non trouvé" });
        }
        res.json({result: true, books:challenge.books});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;

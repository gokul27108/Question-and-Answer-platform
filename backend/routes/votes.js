const express = require('express');
const router = express.Router();
const { sequelize, Vote, Question, Answer, User, Notification } = require('../db');
const { requireAuth } = require('../middleware/auth');

// Helper to check and add badge to user
async function addBadgeToUser(user, badgeName, transaction) {
  const currentBadges = user.badges || [];
  if (!currentBadges.includes(badgeName)) {
    user.badges = [...currentBadges, badgeName];
    await user.save({ transaction });
  }
}

// POST /api/questions/:questionId/vote
router.post('/questions/:questionId/vote', requireAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { questionId } = req.params;
    const value = parseInt(req.query.value);

    if (value !== 1 && value !== -1) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Vote value must be 1 or -1' });
    }

    const question = await Question.findByPk(questionId, {
      include: [{ model: User, as: 'author' }],
      transaction
    });

    if (!question) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Question not found' });
    }

    const existingVote = await Vote.findOne({
      where: { userId: req.user.id, questionId },
      transaction
    });

    let repChange = 0;

    if (existingVote) {
      if (existingVote.value === value) {
        // Remove vote
        await existingVote.destroy({ transaction });
        repChange = (value === 1) ? -15 : 2;
      } else {
        // Change vote
        existingVote.value = value;
        await existingVote.save({ transaction });
        repChange = (value === 1) ? 17 : -17;
      }
    } else {
      // New vote
      await Vote.create({
        userId: req.user.id,
        questionId: Number(questionId),
        value
      }, { transaction });

      repChange = (value === 1) ? 15 : -2;

      // Notify question author of upvote
      if (value === 1 && question.authorId !== req.user.id) {
        await Notification.create({
          userId: question.authorId,
          type: 'UPVOTE',
          message: `${req.user.username} upvoted your question: ${question.title}`,
          questionId: question.id
        }, { transaction });
      }
    }

    // Apply reputation changes to question author
    const author = question.author;
    if (author && repChange !== 0) {
      author.reputation += repChange;
      await author.save({ transaction });
    }

    // Popular badge check
    const totalScore = await Vote.sum('value', { where: { questionId }, transaction }) || 0;
    if (totalScore >= 5 && author) {
      await addBadgeToUser(author, 'Popular', transaction);
    }

    // Check author Stellar Contributor badge: reputation >= 100
    if (author && author.reputation >= 100) {
      await addBadgeToUser(author, 'Stellar Contributor', transaction);
    }

    await transaction.commit();
    return res.status(200).send('Vote submitted successfully!');

  } catch (error) {
    await transaction.rollback();
    console.error('Failed to vote on question:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/answers/:answerId/vote
router.post('/answers/:answerId/vote', requireAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { answerId } = req.params;
    const value = parseInt(req.query.value);

    if (value !== 1 && value !== -1) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Vote value must be 1 or -1' });
    }

    const answer = await Answer.findByPk(answerId, {
      include: [
        { model: User, as: 'author' },
        { model: Question, as: 'question' }
      ],
      transaction
    });

    if (!answer) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Answer not found' });
    }

    const existingVote = await Vote.findOne({
      where: { userId: req.user.id, answerId },
      transaction
    });

    let repChange = 0;

    if (existingVote) {
      if (existingVote.value === value) {
        // Remove vote
        await existingVote.destroy({ transaction });
        repChange = (value === 1) ? -15 : 2;
      } else {
        // Change vote
        existingVote.value = value;
        await existingVote.save({ transaction });
        repChange = (value === 1) ? 17 : -17;
      }
    } else {
      // New vote
      await Vote.create({
        userId: req.user.id,
        answerId: Number(answerId),
        value
      }, { transaction });

      repChange = (value === 1) ? 15 : -2;

      // Notify answer author of upvote
      if (value === 1 && answer.authorId !== req.user.id) {
        await Notification.create({
          userId: answer.authorId,
          type: 'UPVOTE',
          message: `${req.user.username} upvoted your answer.`,
          questionId: answer.question ? answer.question.id : null
        }, { transaction });
      }
    }

    // Apply reputation changes to answer author
    const author = answer.author;
    if (author && repChange !== 0) {
      author.reputation += repChange;
      await author.save({ transaction });
    }

    // Popular badge check
    const totalScore = await Vote.sum('value', { where: { answerId }, transaction }) || 0;
    if (totalScore >= 5 && author) {
      await addBadgeToUser(author, 'Popular', transaction);
    }

    // Check author Stellar Contributor badge: reputation >= 100
    if (author && author.reputation >= 100) {
      await addBadgeToUser(author, 'Stellar Contributor', transaction);
    }

    await transaction.commit();
    return res.status(200).send('Vote submitted successfully!');

  } catch (error) {
    await transaction.rollback();
    console.error('Failed to vote on answer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

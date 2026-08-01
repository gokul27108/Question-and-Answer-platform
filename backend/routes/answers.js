const express = require('express');
const router = express.Router();
const { sequelize, Question, Answer, User, Vote, Notification } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Helper to check if text contains LaTeX
function isLatex(text) {
  if (!text) return false;
  return text.includes('$$') || text.includes('$') || text.includes('\\(') || text.includes('\\[');
}

// GET /api/questions/:questionId/answers
router.get('/questions/:questionId/answers', optionalAuth, async (req, res) => {
  try {
    const { questionId } = req.params;
    const answers = await Answer.findAll({
      where: { questionId },
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'reputation', 'avatarUrl'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    const userId = req.user ? req.user.id : null;
    const responseList = [];

    for (const a of answers) {
      const voteSum = await Vote.sum('value', { where: { answerId: a.id } }) || 0;
      let userVoteVal = 0;
      if (userId) {
        const v = await Vote.findOne({ where: { userId, answerId: a.id } });
        if (v) userVoteVal = v.value;
      }

      responseList.push({
        id: a.id,
        questionId: Number(questionId),
        text: a.text,
        authorId: a.author ? a.author.id : null,
        authorUsername: a.author ? a.author.username : null,
        authorReputation: a.author ? a.author.reputation : 0,
        authorAvatar: a.author ? a.author.avatarUrl : null,
        accepted: a.accepted,
        votes: voteSum,
        userVote: userVoteVal,
        imageUrl: a.imageUrl,
        createdAt: a.createdAt
      });
    }

    return res.status(200).json(responseList);
  } catch (error) {
    console.error('Failed to get answers:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/questions/:questionId/answers
router.post('/questions/:questionId/answers', requireAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { questionId } = req.params;
    const { text, imageUrl } = req.body;

    if (!text) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Answer text is required' });
    }

    const question = await Question.findByPk(questionId, {
      include: [{ model: User, as: 'author' }],
      transaction
    });

    if (!question) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Question not found' });
    }

    const answer = await Answer.create({
      text,
      authorId: req.user.id,
      questionId: Number(questionId),
      imageUrl
    }, { transaction });

    // Award +10 reputation
    req.user.reputation += 10;

    // Check First Word Badge
    const answerCount = await Answer.count({ where: { authorId: req.user.id }, transaction });
    const currentBadges = req.user.badges || [];
    
    if (answerCount === 1 && !currentBadges.includes('First Word')) {
      req.user.badges = [...req.user.badges, 'First Word'];
    }

    // Check LaTeX Badge
    if (isLatex(text) && !req.user.badges.includes('Math Scholar')) {
      req.user.badges = [...req.user.badges, 'Math Scholar'];
    }

    await req.user.save({ transaction });

    // Notify question author
    if (question.authorId !== req.user.id) {
      await Notification.create({
        userId: question.authorId,
        type: 'NEW_ANSWER',
        message: `${req.user.username} posted an answer to your question: ${question.title}`,
        questionId: question.id
      }, { transaction });
    }

    await transaction.commit();

    return res.status(200).json({
      id: answer.id,
      questionId: Number(questionId),
      text: answer.text,
      authorId: req.user.id,
      authorUsername: req.user.username,
      authorReputation: req.user.reputation,
      authorAvatar: req.user.avatarUrl,
      accepted: false,
      votes: 0,
      userVote: 0,
      imageUrl: answer.imageUrl,
      createdAt: answer.createdAt
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Failed to create answer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/answers/:id
router.put('/answers/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, imageUrl } = req.body;

    const answer = await Answer.findByPk(id);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    if (answer.authorId !== req.user.id) {
      return res.status(400).json({ message: 'Unauthorized to update this answer' });
    }

    answer.text = text || answer.text;
    answer.imageUrl = imageUrl !== undefined ? imageUrl : answer.imageUrl;
    await answer.save();

    const voteSum = await Vote.sum('value', { where: { answerId: id } }) || 0;

    return res.status(200).json({
      id: answer.id,
      questionId: answer.questionId,
      text: answer.text,
      authorId: req.user.id,
      authorUsername: req.user.username,
      authorReputation: req.user.reputation,
      authorAvatar: req.user.avatarUrl,
      accepted: answer.accepted,
      votes: voteSum,
      userVote: 0,
      imageUrl: answer.imageUrl,
      createdAt: answer.createdAt
    });
  } catch (error) {
    console.error('Failed to update answer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/answers/:id
router.delete('/answers/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const answer = await Answer.findByPk(id);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const isAdmin = req.user.roles && req.user.roles.includes('ADMIN');
    if (answer.authorId !== req.user.id && !isAdmin) {
      return res.status(400).json({ message: 'Unauthorized to delete this answer' });
    }

    await answer.destroy();
    return res.status(200).send('Answer deleted successfully!');
  } catch (error) {
    console.error('Failed to delete answer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/answers/:id/accept
router.post('/answers/:id/accept', requireAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const answer = await Answer.findByPk(id, {
      include: [{ model: Question, as: 'question' }],
      transaction
    });

    if (!answer) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Answer not found' });
    }

    const question = answer.question;

    // Only question author can accept
    if (question.authorId !== req.user.id) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Unauthorized: Only the question author can accept an answer' });
    }

    const currentStatus = answer.accepted;

    // Reset other accepted answers for same question
    const otherAnswers = await Answer.findAll({
      where: { questionId: question.id, accepted: true },
      transaction
    });

    for (const a of otherAnswers) {
      a.accepted = false;
      await a.save({ transaction });

      // Deduct 25 reputation from previous best answer author
      const prevAuthor = await User.findByPk(a.authorId, { transaction });
      if (prevAuthor) {
        prevAuthor.reputation -= 25;
        await prevAuthor.save({ transaction });
      }
    }

    // Toggle acceptance of current answer
    answer.accepted = !currentStatus;
    await answer.save({ transaction });

    const answerAuthor = await User.findByPk(answer.authorId, { transaction });

    if (answer.accepted) {
      question.acceptedAnswerId = answer.id;
      
      // Award +25 reputation to answer author
      if (answerAuthor) {
        answerAuthor.reputation += 25;
        await answerAuthor.save({ transaction });
      }

      // Notify answer author
      await Notification.create({
        userId: answer.authorId,
        type: 'ACCEPTED_ANSWER',
        message: 'Your answer has been accepted as the best answer!',
        questionId: question.id
      }, { transaction });
    } else {
      question.acceptedAnswerId = null;
      // Deduct reputation
      if (answerAuthor) {
        answerAuthor.reputation -= 25;
        await answerAuthor.save({ transaction });
      }
    }

    await question.save({ transaction });
    await transaction.commit();

    const voteSum = await Vote.sum('value', { where: { answerId: id } }) || 0;

    return res.status(200).json({
      id: answer.id,
      questionId: answer.questionId,
      text: answer.text,
      authorId: answer.authorId,
      authorUsername: answerAuthor ? answerAuthor.username : null,
      authorReputation: answerAuthor ? answerAuthor.reputation : 0,
      authorAvatar: answerAuthor ? answerAuthor.avatarUrl : null,
      accepted: answer.accepted,
      votes: voteSum,
      userVote: 0,
      imageUrl: answer.imageUrl,
      createdAt: answer.createdAt
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Failed to accept answer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { Comment, User, Question, Answer, Notification } = require('../db');
const { requireAuth } = require('../middleware/auth');

// Helper to build comment tree in memory
function buildCommentTree(comments) {
  const commentMap = {};
  const rootComments = [];

  comments.forEach(c => {
    commentMap[c.id] = {
      id: c.id,
      text: c.text,
      authorId: c.author ? c.author.id : null,
      authorUsername: c.author ? c.author.username : null,
      authorReputation: c.author ? c.author.reputation : 0,
      createdAt: c.createdAt,
      replies: []
    };
  });

  comments.forEach(c => {
    const mapped = commentMap[c.id];
    if (c.parentId) {
      const parent = commentMap[c.parentId];
      if (parent) {
        parent.replies.push(mapped);
      } else {
        rootComments.push(mapped);
      }
    } else {
      rootComments.push(mapped);
    }
  });

  return rootComments;
}

// GET /api/questions/:questionId/comments
router.get('/questions/:questionId/comments', async (req, res) => {
  try {
    const { questionId } = req.params;
    const comments = await Comment.findAll({
      where: { questionId },
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'reputation'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    const commentTree = buildCommentTree(comments);
    return res.status(200).json(commentTree);
  } catch (error) {
    console.error('Failed to get comments:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/answers/:answerId/comments
router.get('/answers/:answerId/comments', async (req, res) => {
  try {
    const { answerId } = req.params;
    const comments = await Comment.findAll({
      where: { answerId },
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'reputation'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    const commentTree = buildCommentTree(comments);
    return res.status(200).json(commentTree);
  } catch (error) {
    console.error('Failed to get comments:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/questions/:questionId/comments
router.post('/questions/:questionId/comments', requireAuth, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { text, parentId } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const question = await Question.findByPk(questionId, {
      include: [{ model: User, as: 'author' }]
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (parentId) {
      const parent = await Comment.findByPk(parentId);
      if (!parent) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    const comment = await Comment.create({
      text,
      authorId: req.user.id,
      questionId: Number(questionId),
      parentId: parentId ? Number(parentId) : null
    });

    // Notify question author
    if (question.authorId !== req.user.id) {
      await Notification.create({
        userId: question.authorId,
        type: 'NEW_COMMENT',
        message: `${req.user.username} commented on your question: ${question.title}`,
        questionId: question.id
      });
    }

    return res.status(200).json({
      id: comment.id,
      text: comment.text,
      authorId: req.user.id,
      authorUsername: req.user.username,
      authorReputation: req.user.reputation,
      createdAt: comment.createdAt,
      replies: []
    });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/answers/:answerId/comments
router.post('/answers/:answerId/comments', requireAuth, async (req, res) => {
  try {
    const { answerId } = req.params;
    const { text, parentId } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const answer = await Answer.findByPk(answerId, {
      include: [
        { model: User, as: 'author' },
        { model: Question, as: 'question' }
      ]
    });

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    if (parentId) {
      const parent = await Comment.findByPk(parentId);
      if (!parent) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    const comment = await Comment.create({
      text,
      authorId: req.user.id,
      answerId: Number(answerId),
      parentId: parentId ? Number(parentId) : null
    });

    // Notify answer author
    if (answer.authorId !== req.user.id) {
      await Notification.create({
        userId: answer.authorId,
        type: 'NEW_COMMENT',
        message: `${req.user.username} commented on your answer.`,
        questionId: answer.question ? answer.question.id : null
      });
    }

    return res.status(200).json({
      id: comment.id,
      text: comment.text,
      authorId: req.user.id,
      authorUsername: req.user.username,
      authorReputation: req.user.reputation,
      createdAt: comment.createdAt,
      replies: []
    });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/comments/:id
router.delete('/comments/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isAdmin = req.user.roles && req.user.roles.includes('ADMIN');
    if (comment.authorId !== req.user.id && !isAdmin) {
      return res.status(400).json({ message: 'Unauthorized to delete this comment' });
    }

    await comment.destroy();
    return res.status(200).send('Comment deleted successfully!');
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { User, Question, Answer } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/admin/stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    // Check if the user is an admin
    if (!req.user.roles || !req.user.roles.includes('ADMIN')) {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }

    const totalUsers = await User.count();
    const totalQuestions = await Question.count();
    const totalAnswers = await Answer.count();

    return res.status(200).json({
      totalUsers,
      totalQuestions,
      totalAnswers
    });
  } catch (error) {
    console.error('Failed to get system stats:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

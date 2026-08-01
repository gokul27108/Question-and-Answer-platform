const express = require('express');
const router = express.Router();
const { User } = require('../db');

// GET /api/users/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['reputation', 'DESC']],
      limit: 10
    });

    const response = users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      bio: u.bio,
      reputation: u.reputation,
      avatarUrl: u.avatarUrl,
      badges: u.badges || [],
      roles: u.roles || []
    }));

    return res.status(200).json(response);
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/users/:username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      reputation: user.reputation,
      avatarUrl: user.avatarUrl,
      badges: user.badges || [],
      roles: user.roles || []
    });
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { Notification } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    const response = notifications.map(n => ({
      id: n.id,
      type: n.type,
      message: n.message,
      questionId: n.questionId ? Number(n.questionId) : null,
      read: n.isRead,
      createdAt: n.createdAt
    }));

    return res.status(200).json(response);
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/notifications/:id/read
router.post('/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({
      where: { id, userId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).send('Notification marked as read');
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', requireAuth, async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );

    return res.status(200).send('All notifications marked as read');
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

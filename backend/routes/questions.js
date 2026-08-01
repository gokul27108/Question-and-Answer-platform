const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { sequelize, Question, User, Category, Tag, Vote } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Helper to check if text contains LaTeX
function isLatex(text) {
  if (!text) return false;
  return text.includes('$$') || text.includes('$') || text.includes('\\(') || text.includes('\\[');
}

// GET /api/questions
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { query, category, tag, page = 0, size = 10, sortBy = 'createdAt' } = req.query;
    
    let where = {};
    const limit = parseInt(size);
    const offset = parseInt(page) * limit;

    // Build search conditions
    if (query) {
      where = {
        [Op.or]: [
          { title: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } },
          sequelize.literal(`exists (select 1 from question_tags qt join tags t on qt.tagId = t.id where qt.questionId = Question.id and t.name like ${sequelize.escape('%' + query + '%')})`),
          sequelize.literal(`exists (select 1 from users u where u.id = Question.authorId and u.username like ${sequelize.escape('%' + query + '%')})`)
        ]
      };
    } else if (category) {
      where = sequelize.literal(`exists (select 1 from categories c where c.id = Question.categoryId and c.name = ${sequelize.escape(category)})`);
    } else if (tag) {
      where = sequelize.literal(`exists (select 1 from question_tags qt join tags t on qt.tagId = t.id where qt.questionId = Question.id and t.name = ${sequelize.escape(tag.trim().toLowerCase())})`);
    }

    // Determine ordering
    let order = [['createdAt', 'DESC']];
    if (sortBy === 'votes') {
      order = [[sequelize.literal('votesCount'), 'DESC']];
    } else if (sortBy === 'views') {
      order = [['views', 'DESC']];
    } else if (sortBy !== 'createdAt') {
      order = [[sortBy, 'DESC']];
    }

    const userId = req.user ? req.user.id : null;
    const voteSumLiteral = sequelize.literal(`(SELECT COALESCE(SUM(value), 0) FROM votes WHERE votes.questionId = Question.id)`);
    const userVoteLiteral = userId 
      ? sequelize.literal(`(SELECT COALESCE(value, 0) FROM votes WHERE votes.userId = ${sequelize.escape(userId)} AND votes.questionId = Question.id)`)
      : sequelize.literal('0');
    const answersCountLiteral = sequelize.literal(`(SELECT COUNT(*) FROM answers WHERE answers.questionId = Question.id)`);

    const questions = await Question.findAndCountAll({
      where,
      attributes: {
        include: [
          [voteSumLiteral, 'votesCount'],
          [userVoteLiteral, 'userVoteVal'],
          [answersCountLiteral, 'answersCountVal']
        ]
      },
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'reputation', 'avatarUrl'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name'], through: { attributes: [] } }
      ],
      order,
      limit,
      offset,
      distinct: true
    });

    const totalPages = Math.ceil(questions.count / limit);
    const content = questions.rows.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      authorId: q.author ? q.author.id : null,
      authorUsername: q.author ? q.author.username : null,
      authorReputation: q.author ? q.author.reputation : 0,
      authorAvatar: q.author ? q.author.avatarUrl : null,
      categoryName: q.category ? q.category.name : null,
      tags: q.tags ? q.tags.map(t => t.name) : [],
      views: q.views,
      votes: parseInt(q.getDataValue('votesCount')) || 0,
      userVote: parseInt(q.getDataValue('userVoteVal')) || 0,
      answersCount: parseInt(q.getDataValue('answersCountVal')) || 0,
      acceptedAnswerId: q.acceptedAnswerId ? Number(q.acceptedAnswerId) : null,
      imageUrl: q.imageUrl,
      createdAt: q.createdAt
    }));

    return res.status(200).json({
      content,
      totalPages,
      totalElements: questions.count,
      number: parseInt(page),
      first: parseInt(page) === 0,
      last: parseInt(page) >= totalPages - 1,
      size: limit
    });
  } catch (error) {
    console.error('Failed to get questions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/questions/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByPk(id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'reputation', 'avatarUrl'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Increment view count
    question.views += 1;
    await question.save();

    const voteSum = await Vote.sum('value', { where: { questionId: id } }) || 0;

    let userVoteVal = 0;
    if (req.user) {
      const v = await Vote.findOne({ where: { userId: req.user.id, questionId: id } });
      if (v) userVoteVal = v.value;
    }

    const answersCount = await question.countAnswers();

    return res.status(200).json({
      id: question.id,
      title: question.title,
      description: question.description,
      authorId: question.author ? question.author.id : null,
      authorUsername: question.author ? question.author.username : null,
      authorReputation: question.author ? question.author.reputation : 0,
      authorAvatar: question.author ? question.author.avatarUrl : null,
      categoryName: question.category ? question.category.name : null,
      tags: question.tags ? question.tags.map(t => t.name) : [],
      views: question.views,
      votes: voteSum,
      userVote: userVoteVal,
      answersCount,
      acceptedAnswerId: question.acceptedAnswerId ? Number(question.acceptedAnswerId) : null,
      imageUrl: question.imageUrl,
      createdAt: question.createdAt
    });
  } catch (error) {
    console.error('Failed to get question:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/questions
router.post('/', requireAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { title, description, categoryName, tags, imageUrl } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    let category = null;
    if (categoryName && categoryName.trim()) {
      [category] = await Category.findOrCreate({
        where: { name: categoryName.trim() },
        defaults: { description: 'Auto created category' },
        transaction
      });
    }

    const question = await Question.create({
      title,
      description,
      authorId: req.user.id,
      categoryId: category ? category.id : null,
      imageUrl
    }, { transaction });

    if (tags && Array.isArray(tags)) {
      const tagInstances = [];
      for (const tagName of tags) {
        if (!tagName.trim()) continue;
        const [tag] = await Tag.findOrCreate({
          where: { name: tagName.trim().toLowerCase() },
          transaction
        });
        tagInstances.push(tag);
      }
      await question.setTags(tagInstances, { transaction });
    }

    // Award +5 reputation
    req.user.reputation += 5;

    // Check LaTeX
    if (isLatex(title) || isLatex(description)) {
      const currentBadges = req.user.badges || [];
      if (!currentBadges.includes('Math Scholar')) {
        req.user.badges = [...currentBadges, 'Math Scholar'];
      }
    }
    await req.user.save({ transaction });

    await transaction.commit();

    // Map to response
    const reloaded = await Question.findByPk(question.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'reputation', 'avatarUrl'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });

    return res.status(200).json({
      id: reloaded.id,
      title: reloaded.title,
      description: reloaded.description,
      authorId: reloaded.author ? reloaded.author.id : null,
      authorUsername: reloaded.author ? reloaded.author.username : null,
      authorReputation: reloaded.author ? reloaded.author.reputation : 0,
      authorAvatar: reloaded.author ? reloaded.author.avatarUrl : null,
      categoryName: reloaded.category ? reloaded.category.name : null,
      tags: reloaded.tags ? reloaded.tags.map(t => t.name) : [],
      views: reloaded.views,
      votes: 0,
      userVote: 0,
      answersCount: 0,
      acceptedAnswerId: null,
      imageUrl: reloaded.imageUrl,
      createdAt: reloaded.createdAt
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Failed to create question:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/questions/:id
router.put('/:id', requireAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { title, description, categoryName, tags, imageUrl } = req.body;

    const question = await Question.findByPk(id, { transaction });
    if (!question) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.authorId !== req.user.id) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Unauthorized to update this question' });
    }

    question.title = title || question.title;
    question.description = description || question.description;
    question.imageUrl = imageUrl !== undefined ? imageUrl : question.imageUrl;

    if (categoryName && categoryName.trim()) {
      const [category] = await Category.findOrCreate({
        where: { name: categoryName.trim() },
        defaults: { description: 'Auto created category' },
        transaction
      });
      question.categoryId = category.id;
    }

    await question.save({ transaction });

    if (tags && Array.isArray(tags)) {
      const tagInstances = [];
      for (const tagName of tags) {
        if (!tagName.trim()) continue;
        const [tag] = await Tag.findOrCreate({
          where: { name: tagName.trim().toLowerCase() },
          transaction
        });
        tagInstances.push(tag);
      }
      await question.setTags(tagInstances, { transaction });
    }

    await transaction.commit();

    const reloaded = await Question.findByPk(id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'reputation', 'avatarUrl'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });

    const voteSum = await Vote.sum('value', { where: { questionId: id } }) || 0;
    const answersCount = await reloaded.countAnswers();

    return res.status(200).json({
      id: reloaded.id,
      title: reloaded.title,
      description: reloaded.description,
      authorId: reloaded.author ? reloaded.author.id : null,
      authorUsername: reloaded.author ? reloaded.author.username : null,
      authorReputation: reloaded.author ? reloaded.author.reputation : 0,
      authorAvatar: reloaded.author ? reloaded.author.avatarUrl : null,
      categoryName: reloaded.category ? reloaded.category.name : null,
      tags: reloaded.tags ? reloaded.tags.map(t => t.name) : [],
      views: reloaded.views,
      votes: voteSum,
      userVote: 0, // In PUT it can be 0 or recalculate
      answersCount,
      acceptedAnswerId: reloaded.acceptedAnswerId ? Number(reloaded.acceptedAnswerId) : null,
      imageUrl: reloaded.imageUrl,
      createdAt: reloaded.createdAt
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Failed to update question:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/questions/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByPk(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const isAdmin = req.user.roles && req.user.roles.includes('ADMIN');
    if (question.authorId !== req.user.id && !isAdmin) {
      return res.status(400).json({ message: 'Unauthorized to delete this question' });
    }

    await question.destroy();
    return res.status(200).send('Question deleted successfully!');
  } catch (error) {
    console.error('Failed to delete question:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

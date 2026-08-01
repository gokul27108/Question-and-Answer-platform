const db = require('./db');

async function view() {
  try {
    // Suppress Sequelize console logs during table prints
    await db.init();
    
    console.log('\n================================== 👤 USERS ==================================');
    const users = await db.User.findAll();
    console.table(users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      reputation: u.reputation,
      badges: (u.badges || []).join(', '),
      roles: (u.roles || []).join(', ')
    })));

    console.log('\n================================== ❓ QUESTIONS ==================================');
    const questions = await db.Question.findAll();
    console.table(questions.map(q => ({
      id: q.id,
      title: q.title,
      authorId: q.authorId,
      categoryId: q.categoryId,
      views: q.views,
      acceptedAnswerId: q.acceptedAnswerId
    })));

    console.log('\n================================== 💬 ANSWERS ==================================');
    const answers = await db.Answer.findAll();
    console.table(answers.map(a => ({
      id: a.id,
      questionId: a.questionId,
      authorId: a.authorId,
      accepted: a.accepted,
      text: a.text.substring(0, 50) + (a.text.length > 50 ? '...' : '')
    })));

    console.log('\n================================== 💬 COMMENTS ==================================');
    const comments = await db.Comment.findAll();
    console.table(comments.map(c => ({
      id: c.id,
      questionId: c.questionId,
      answerId: c.answerId,
      parentId: c.parentId,
      authorId: c.authorId,
      text: c.text
    })));

    process.exit(0);
  } catch (error) {
    console.error('Error fetching database records:', error);
    process.exit(1);
  }
}

view();

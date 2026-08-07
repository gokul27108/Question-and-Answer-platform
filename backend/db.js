const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASS || 'gokul@@27';
const database = process.env.DB_NAME || 'openqa_db';

let sequelize;

// Import models helper
const createUserModel = require('./models/User');
const createCategoryModel = require('./models/Category');
const createTagModel = require('./models/Tag');
const createQuestionModel = require('./models/Question');
const createAnswerModel = require('./models/Answer');
const createCommentModel = require('./models/Comment');
const createVoteModel = require('./models/Vote');
const createNotificationModel = require('./models/Notification');

let User, Category, Tag, Question, Answer, Comment, Vote, Notification;

async function init() {
  try {
    // 1. Initialize Sequelize & Create database if not exists
    if (process.env.DATABASE_URL) {
      sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
          ssl: {
            rejectUnauthorized: false
          }
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      });
    } else {
      const connection = await mysql.createConnection({ host, port, user, password });
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
      await connection.end();

      // 2. Connect with Sequelize
      sequelize = new Sequelize(database, user, password, {
        host,
        port,
        dialect: 'mysql',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      });
    }

    // 3. Define Models
    User = createUserModel(sequelize);
    Category = createCategoryModel(sequelize);
    Tag = createTagModel(sequelize);
    Question = createQuestionModel(sequelize);
    Answer = createAnswerModel(sequelize);
    Comment = createCommentModel(sequelize);
    Vote = createVoteModel(sequelize);
    Notification = createNotificationModel(sequelize);

    // 4. Set up associations
    // User associations
    User.hasMany(Question, { as: 'questions', foreignKey: 'authorId', onDelete: 'CASCADE' });
    Question.belongsTo(User, { as: 'author', foreignKey: 'authorId' });

    User.hasMany(Answer, { as: 'answers', foreignKey: 'authorId', onDelete: 'CASCADE' });
    Answer.belongsTo(User, { as: 'author', foreignKey: 'authorId' });

    User.hasMany(Comment, { as: 'comments', foreignKey: 'authorId', onDelete: 'CASCADE' });
    Comment.belongsTo(User, { as: 'author', foreignKey: 'authorId' });

    User.hasMany(Vote, { as: 'votes', foreignKey: 'userId', onDelete: 'CASCADE' });
    Vote.belongsTo(User, { as: 'user', foreignKey: 'userId' });

    User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId', onDelete: 'CASCADE' });
    Notification.belongsTo(User, { as: 'user', foreignKey: 'userId' });

    // Category associations
    Category.hasMany(Question, { as: 'questions', foreignKey: 'categoryId', onDelete: 'SET NULL' });
    Question.belongsTo(Category, { as: 'category', foreignKey: 'categoryId' });

    // Question-Tag Many-to-Many
    Question.belongsToMany(Tag, { through: 'question_tags', as: 'tags', foreignKey: 'questionId', timestamps: false });
    Tag.belongsToMany(Question, { through: 'question_tags', as: 'questions', foreignKey: 'tagId', timestamps: false });

    // Question - Answer
    Question.hasMany(Answer, { as: 'answers', foreignKey: 'questionId', onDelete: 'CASCADE' });
    Answer.belongsTo(Question, { as: 'question', foreignKey: 'questionId' });

    // Question - Comment
    Question.hasMany(Comment, { as: 'comments', foreignKey: 'questionId', onDelete: 'CASCADE' });
    Comment.belongsTo(Question, { as: 'question', foreignKey: 'questionId' });

    // Answer - Comment
    Answer.hasMany(Comment, { as: 'comments', foreignKey: 'answerId', onDelete: 'CASCADE' });
    Comment.belongsTo(Answer, { as: 'answer', foreignKey: 'answerId' });

    // Nested Comments
    Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentId', onDelete: 'CASCADE' });
    Comment.belongsTo(Comment, { as: 'parentComment', foreignKey: 'parentId' });

    // Votes associations
    Question.hasMany(Vote, { as: 'votes', foreignKey: 'questionId', onDelete: 'CASCADE' });
    Vote.belongsTo(Question, { as: 'question', foreignKey: 'questionId' });

    Answer.hasMany(Vote, { as: 'votes', foreignKey: 'answerId', onDelete: 'CASCADE' });
    Vote.belongsTo(Answer, { as: 'answer', foreignKey: 'answerId' });

    // 5. Sync Database
    await sequelize.sync();
    console.log('Database synchronized.');

    // 6. Seed Data
    await seed();

  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

async function seed() {
  const userCount = await User.count();
  if (userCount > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial data...');
  const hashedPassword = bcrypt.hashSync('password', 10);

  // Seed Users
  const gokul = await User.create({
    username: 'Gokul',
    email: 'gokul@gmail.com',
    password: hashedPassword,
    bio: 'Full-stack software developer who loves math and Java.',
    reputation: 120,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Gokul',
    roles: ['USER', 'ADMIN'],
    badges: ['Math Scholar', 'Stellar Contributor']
  });

  const einstein = await User.create({
    username: 'EinsteinPi',
    email: 'einstein@physics.org',
    password: hashedPassword,
    bio: 'Interested in general relativity, calculus, and algorithms.',
    reputation: 340,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=EinsteinPi',
    roles: ['USER'],
    badges: ['Math Scholar', 'Top Scholar', 'Popular']
  });

  const ada = await User.create({
    username: 'AdaCode',
    email: 'ada@lovelace.net',
    password: hashedPassword,
    bio: 'First computer programmer. Loves clean structures.',
    reputation: 85,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdaCode',
    roles: ['USER'],
    badges: ['First Word']
  });

  // Seed Categories
  const javaCat = await Category.create({
    name: 'Java',
    description: 'Questions related to core Java, JVM, Spring framework, and Maven builds.'
  });

  const calcCat = await Category.create({
    name: 'Calculus',
    description: 'Questions dealing with derivatives, integrations, infinite series, and LaTeX math equations.'
  });

  const physCat = await Category.create({
    name: 'Physics',
    description: 'Space time, relativity, mechanics, and physical derivations.'
  });

  // Seed Tags
  const springBootTag = await Tag.create({ name: 'spring-boot' });
  const integrationTag = await Tag.create({ name: 'integration' });
  const relativityTag = await Tag.create({ name: 'relativity' });
  const oopTag = await Tag.create({ name: 'oop' });

  // Seed Questions
  const q1 = await Question.create({
    title: 'What is dependency injection in Spring Boot?',
    description: 'Can anyone explain how IoC container and Dependency Injection work in Spring with a simple code snippet? I want to know about Autowired annotation.',
    authorId: gokul.id,
    categoryId: javaCat.id,
    views: 45
  });
  await q1.addTags([springBootTag, oopTag]);

  const q2 = await Question.create({
    title: 'Deriving the Gaussian Integral $\\int_{-\\infty}^{\\infty} e^{-x^2} dx$',
    description: 'I am trying to solve the Gaussian integral:\n\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\n\nCan someone show the double integration method using polar coordinates?',
    authorId: einstein.id,
    categoryId: calcCat.id,
    views: 98
  });
  await q2.addTags([integrationTag]);

  // Seed Answers
  const a1 = await Answer.create({
    text: 'Dependency Injection (DI) is a design pattern where the container injects dependencies into objects rather than the objects creating them themselves. You can use `@Autowired` to instruct Spring to inject the component:\n\n```java\n@Component\npublic class Engine {}\n\n@Component\npublic class Car {\n    @Autowired\n    private Engine engine;\n}\n```',
    authorId: ada.id,
    questionId: q1.id,
    accepted: true
  });

  const a2 = await Answer.create({
    text: 'To solve this, let the integral be $I$. Then:\n\n$$I^2 = \\int_{-\\infty}^{\\infty} e^{-x^2} dx \\int_{-\\infty}^{\\infty} e^{-y^2} dy = \\int_{-\\infty}^{\\infty} \\int_{-\\infty}^{\\infty} e^{-(x^2+y^2)} dx dy$$\n\nIn polar coordinates ($x^2+y^2=r^2$ and $dx dy = r dr d\\theta$):\n\n$$I^2 = \\int_{0}^{2\\pi} d\\theta \\int_{0}^{\\infty} e^{-r^2} r dr = 2\\pi \\left[ -\\frac{1}{2} e^{-r^2} \\right]_0^\\infty = \\pi$$\n\nHence, $I = \\sqrt{\\pi}$.',
    authorId: gokul.id,
    questionId: q2.id,
    accepted: true
  });

  // Update accepted answers on questions
  await q1.update({ acceptedAnswerId: a1.id });
  await q2.update({ acceptedAnswerId: a2.id });

  // Seed Comments
  await Comment.create({
    text: 'This is the most elegant solution I have ever seen. Thanks Gokul!',
    authorId: einstein.id,
    answerId: a2.id
  });

  await Comment.create({
    text: 'Very clear example using automotive components, Ada!',
    authorId: gokul.id,
    answerId: a1.id
  });

  // Seed Votes
  await Vote.create({ userId: einstein.id, questionId: q1.id, value: 1 });
  await Vote.create({ userId: ada.id, questionId: q2.id, value: 1 });
  await Vote.create({ userId: gokul.id, answerId: a1.id, value: 1 });
  await Vote.create({ userId: einstein.id, answerId: a2.id, value: 1 });

  console.log('Seeding completed.');
}

module.exports = {
  init,
  get sequelize() { return sequelize; },
  get User() { return User; },
  get Category() { return Category; },
  get Tag() { return Tag; },
  get Question() { return Question; },
  get Answer() { return Answer; },
  get Comment() { return Comment; },
  get Vote() { return Vote; },
  get Notification() { return Notification; }
};

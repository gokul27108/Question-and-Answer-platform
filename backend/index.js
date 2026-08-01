require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS with support for local development origins and file protocols
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    // Allow localhost, 127.0.0.1, and file:// protocol
    if (origin.startsWith('http://localhost') || 
        origin.startsWith('http://127.0.0.1') || 
        origin.startsWith('file://') ||
        origin.endsWith('.vercel.app') ||
        origin.includes('vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Logger Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Initialize Database & Run Server
db.init()
  .then(() => {
    // Mount routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/questions', require('./routes/questions'));
    
    // Answers, comments, and votes mount on /api directly
    app.use('/api', require('./routes/answers'));
    app.use('/api', require('./routes/comments'));
    app.use('/api', require('./routes/votes'));
    
    app.use('/api/notifications', require('./routes/notifications'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/admin', require('./routes/admin'));

    // Handle 404
    app.use((req, res) => {
      res.status(404).json({ message: 'Resource not found' });
    });

    // Error handler
    app.use((err, req, res, next) => {
      console.error(err);
      res.status(err.status || 500).json({
        message: err.message || 'Internal server error'
      });
    });

    app.listen(PORT, () => {
      console.log(`Node.js Backend REST Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to start server due to database error:', err);
    process.exit(1);
  });

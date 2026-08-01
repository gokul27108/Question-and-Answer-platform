# ⚡ Open Q&A Platform Backend (Node.js REST API)

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
</div>

---

Welcome to the **Node.js REST API backend** for the Open Q&A Platform! This server replaces the previous Spring Boot application, exposing the identical set of REST endpoints and utilizing Sequelize ORM to coordinate database actions with MySQL.

## 🚀 Key Features

* 🔑 **Authentication & Security**: Secure user registration and login with JWT token verification and BCrypt password hashing.
* 📦 **Automatic Database Initializer**: Dynamically creates the `openqa_db` database if not found, synchronizes all models (tables), and seeds default data on first startup.
* 📈 **Reputation Engine**: Calculates reputation point updates dynamically based on user activities (+5 for questions, +10 for answers, +15 on upvotes, etc.).
* 🎖️ **Badge Systems**: Auto-awards special badges such as "First Word" and "Math Scholar" (detects LaTeX mathematical notation).
* 🔔 **Real-Time Notifications**: Automatically logs notifications for users when their posts receive votes, answers, comments, or accepted answer flags.

---

## 🛠️ Tech Stack & Requirements

* **Runtime**: [Node.js](https://nodejs.org/) (v18+ recommended)
* **Framework**: Express.js
* **ORM**: Sequelize ORM
* **Database**: MySQL 8.0+

---

## ⚙️ Environment Variables Configuration

Create a `.env` file in the `backend` directory to override database or port configurations:

```env
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=gokul@@27
DB_NAME=openqa_db
JWT_SECRET=9a4f2c8d3b7a1e5f8g0h2i4j6k8l0m2n4o6p8q0r2s4t6u8v0w2x4y6z8A0B2C4D
JWT_EXPIRATION_MS=86400000
```

---

## 🏁 How to Run

### Option 1: Local Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```
2. **Run Server**:
   ```bash
   # Production mode
   npm start
   
   # Development mode (with nodemon reload)
   npm run dev
   ```
   The backend server will start listening at `http://localhost:8080`.

### Option 2: Docker Quickstart
To build and launch the Node.js application and MySQL database in containerized isolation, run:
```bash
docker-compose up --build
```

---

## 🔐 Seed Accounts (Authentication)

Use any of these pre-seeded accounts to log into the application. The password for all accounts is **`password`**:

* 👤 **Gokul** (reputation: 120, admin privileges)
* 👤 **EinsteinPi** (reputation: 340)
* 👤 **AdaCode** (reputation: 85)

---

## 🌐 REST API Endpoints Overview

| Category | Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- | :---: |
| **Auth** | `POST` | `/api/auth/register` | Register new user account | ❌ |
| | `POST` | `/api/auth/login` | Authenticate user & get JWT token | ❌ |
| **Questions** | `GET` | `/api/questions` | List questions (supports search & sorting) | ❌ |
| | `GET` | `/api/questions/:id` | Retrieve single question details | ❌ |
| | `POST` | `/api/questions` | Create a new question (+5 reputation) | `yes` |
| | `PUT` | `/api/questions/:id` | Edit details | `yes` |
| | `DELETE`| `/api/questions/:id` | Delete question | `yes` |
| **Answers** | `GET` | `/api/questions/:questionId/answers` | List answers for a question | ❌ |
| | `POST` | `/api/questions/:questionId/answers` | Post an answer (+10 reputation) | `yes` |
| | `PUT` | `/api/answers/:id` | Edit answer text | `yes` |
| | `DELETE`| `/api/answers/:id` | Delete answer | `yes` |
| | `POST` | `/api/answers/:id/accept` | Accept / reject best answer (+25 reputation) | `yes` |
| **Comments** | `GET` | `/api/questions/:questionId/comments` | List nested comments for a question | ❌ |
| | `GET` | `/api/answers/:answerId/comments` | List nested comments for an answer | ❌ |
| | `POST` | `/api/questions/:questionId/comments` | Comment on a question | `yes` |
| | `POST` | `/api/answers/:answerId/comments` | Comment on an answer | `yes` |
| | `DELETE`| `/api/comments/:id` | Delete comment | `yes` |
| **Votes** | `POST` | `/api/questions/:questionId/vote` | Upvote/downvote a question | `yes` |
| | `POST` | `/api/answers/:answerId/vote` | Upvote/downvote an answer | `yes` |
| **Notifications** | `GET` | `/api/notifications` | Get user notifications | `yes` |
| | `POST` | `/api/notifications/:id/read` | Mark notification as read | `yes` |
| | `POST` | `/api/notifications/read-all` | Mark all notifications as read | `yes` |
| **Users** | `GET` | `/api/users/leaderboard` | Get reputation leaderboard | ❌ |
| | `GET` | `/api/users/:username` | Retrieve user profile details | ❌ |
| **Admin** | `GET` | `/api/admin/stats` | System statistics (ADMIN role) | `yes` (Admin) |

---

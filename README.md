# 🌌 Open Q&A Platform (Social Learning Hub)

<div align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
</div>

---

A modern, responsive, full-stack **Question and Answer Platform** inspired by Stack Overflow. This application is optimized for social learning and academic environments, supporting advanced features such as **LaTeX-based mathematical notation rendering** (via KaTeX), real-time user notification flows, reputation rewards, and gamified user badges.

---

## ✨ Features

* 📐 **LaTeX Equations (KaTeX)**: Renders beautiful mathematical and scientific equations inline (using `$`) and in display block mode (using `$$`).
* 📝 **Markdown Formatting (Marked)**: Supports rich post descriptions, code snippets with formatting syntax highlighting, and clean structural paragraphs.
* 💬 **Multi-Level Nested Comments**: Supports replies to both questions and answers with recursive visual indentations.
* 🗳️ **Upvote / Downvote system**: Upvote or downvote questions and answers dynamically.
* 🎖️ **Reputation & Badges**: Earn reputation points (+5 for questions, +10 for answers, +25 for accepted answers) and automatically unlock badges like *"Math Scholar"*, *"First Word"*, and *"Popular"*.
* 🔔 **User Notification Center**: Real-time navbar alerts notify authors when their posts get upvoted, commented on, or answered.
* 📊 **Admin Dashboard**: Moderation panel providing statistics on users, questions, and answers (exclusive to the `ADMIN` role).

---

## 🛠️ Tech Stack

* **Frontend**: Vanilla JS (ES6+), Bootstrap 5, KaTeX (Math), Marked (Markdown), Vite Dev Server
* **Backend**: Node.js, Express, Sequelize ORM
* **Database**: MySQL 8.0

---

## 🏗️ Folder Structure

```text
open-qa-platform/
├── backend/            # Express.js REST API server
│   ├── middleware/     # JWT authentication middleware
│   ├── models/         # Sequelize data model schemas
│   ├── routes/         # REST API endpoint route controllers
│   ├── db.js           # Sequelize connection, tables sync & seeder logic
│   └── index.js        # Main entry point for the backend
├── frontend/           # Vite-powered client web app
│   ├── css/            # Style sheets (Bootstrap overrides)
│   ├── js/             # API client services & routing handler logic
│   ├── *.html          # Responsive templates (Feed, Profile, Ask, Admin)
│   └── vite.config.js  # Vite dev server and Rollup multi-page config
├── backend-java/       # [Backup] Legacy Spring Boot backend implementation
├── run.bat             # One-click startup batch script
└── docker-compose.yml  # Multi-container local boot coordinator
```

---

## 🚀 Getting Started

### 1. Database Setup
Make sure MySQL server is running locally on your computer.
By default, the database is configured with the following credentials (configure your local password in `backend/.env`):
* **Host**: `localhost`
* **Username**: `root`
* **Password**: `YOUR_MYSQL_PASSWORD`
* **Database**: `openqa_db`

> [!NOTE]
> The backend server **automatically creates** the `openqa_db` database if it does not already exist, and initializes/seeds the database tables for you.

---

### 2. Run the Platform

#### ⚡ Option A: One-Click Startup (Recommended)
Double-click the **`run.bat`** file in the root directory. It checks your Node.js runtime, installs all dependencies for both directories, boots the backend/frontend servers, and automatically opens your browser at **`http://localhost:3000`**.

#### 🛠️ Option B: Manual Startup

**Window 1: Start Backend API Server**
```bash
cd backend
npm install
npm start
```
*Backend is served at `http://localhost:8080`.*

**Window 2: Start Frontend Web App**
```bash
cd frontend
npm install
npm run dev
```
*Frontend is served at `http://localhost:3000`.*

---

## 🔐 Seed User Accounts (Authentication)

Log in using either the **username** OR the **email address** of the seeded profiles. The password for all profiles is **`password`**:

| Profile Name | Email | Reputation | Roles | Special Badges |
| :--- | :--- | :---: | :---: | :--- |
| **Gokul** | `gokul@gmail.com` | 120 | `USER`, `ADMIN` | Math Scholar, Stellar Contributor |
| **EinsteinPi** | `einstein@physics.org` | 340 | `USER` | Math Scholar, Top Scholar, Popular |
| **AdaCode** | `ada@lovelace.net` | 85 | `USER` | First Word |

---

## 🌐 Cloud Deployment Guide

Follow these steps to host your application live on the web!

### 1. Setup MySQL Database
1. Create a MySQL database hosted in the cloud (e.g. using a free database tier on **[Aiven.io](https://aiven.io/)**, **[Tidbcloud.com](https://pingcap.com/products/tidb-cloud)**, or **[Render MySQL Docker Private Service](https://render.com/)**).
2. Copy the database connection URL (e.g. `mysql://user:password@host:port/database`).

### 2. Deploy Backend REST API (on Render)
1. Sign in to **[Render.com](https://render.com/)** and click **New** > **Web Service**.
2. Import your GitHub repository.
3. Configure the service settings:
   * **Root Directory**: `backend`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
4. Expand **Advanced** and add these **Environment Variables**:
   * `DATABASE_URL` = *[Your MySQL connection URL]*
   * `JWT_SECRET` = *[A long, secure secret string]*
5. Click **Deploy**. Copy your live backend URL (e.g., `https://your-backend.onrender.com`).

### 3. Deploy Frontend Client (on Vercel)
1. Sign in to **[Vercel.com](https://vercel.com/)** and click **Add New** > **Project**.
2. Import your GitHub repository.
3. Set the project root directory configuration:
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Vite` (Vercel automatically configures `npm run build` and output directory `dist`).
4. Click **Deploy**.
5. Replace the placeholder Render URL in **[frontend/js/api.js](file:///d:/open-qa-platform/frontend/js/api.js)** (line 3) with your actual live backend URL so that your live client interfaces with your live API server.

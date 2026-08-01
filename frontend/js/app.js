// Client Application Logic for routing, rendering, search queries, and leaderboards
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication and setup Navbar
    const currUser = Api.Auth.getCurrentUser();
    const isAuth = Api.Auth.isAuthenticated();

    if (isAuth && currUser.username) {
        document.getElementById('user-nav-name').innerText = currUser.username;
        document.getElementById('user-nav-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${currUser.username}`;
        document.getElementById('user-menu').style.display = 'block';
        document.getElementById('auth-buttons').style.display = 'none';

        // Check if admin to show menu link
        if (currUser.roles.includes('ADMIN')) {
            document.getElementById('menu-btn-admin').style.display = 'block';
        }

        // Show notifications button
        const notifBtn = document.getElementById('nav-notifications');
        if (notifBtn) {
            notifBtn.style.display = 'block';
            loadNotificationCount();
        }
    } else {
        // If not logged in and not on index/login/register, redirect
        const path = window.location.pathname;
        if (!path.endsWith('index.html') && !path.endsWith('login.html') && !path.endsWith('register.html') && path !== '/' && path !== '') {
            window.location.href = 'login.html';
        }
    }

    // Set menu button clicks
    const profileBtn = document.getElementById('menu-btn-profile');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            window.location.href = `profile.html?user=${currUser.username}`;
        });
    }

    const logoutBtn = document.getElementById('menu-btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Api.Auth.logout();
        });
    }

    // Sidebar Leaderboard click
    const leaderboardBtn = document.getElementById('sidebar-btn-leaderboard');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleLeaderboardView(true);
        });
    }

    // Load initial feed questions if we are on index.html
    if (document.getElementById('questions-container')) {
        const urlParams = new URLSearchParams(window.location.search);
        const sortBy = urlParams.get('sortBy') || 'createdAt';
        const tag = urlParams.get('tag') || '';
        const leaderboardParam = urlParams.get('leaderboard') === 'true';

        if (leaderboardParam) {
            toggleLeaderboardView(true);
        } else {
            loadQuestions('', '', tag, 0, 10, sortBy);
        }

        // Setup real-time search
        let searchTimeout = null;
        const searchBox = document.getElementById('search-box');
        if (searchBox) {
            searchBox.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                searchTimeout = setTimeout(() => {
                    toggleLeaderboardView(false);
                    loadQuestions(query, '', '', 0, 10, 'createdAt');
                }, 300);
            });
        }
    }
});

// Load notifications count
async function loadNotificationCount() {
    try {
        const notifs = await Api.Notifications.getAll();
        const unread = notifs.filter(n => !n.read).length;
        const countBadge = document.getElementById('notification-count');
        if (countBadge) {
            if (unread > 0) {
                countBadge.innerText = unread;
                countBadge.style.display = 'block';
            } else {
                countBadge.style.display = 'none';
            }
        }
    } catch (err) {
        console.error('Failed to load notifications', err);
    }
}

// Toggle Leaderboard View
async function toggleLeaderboardView(show) {
    const leaderboardSec = document.getElementById('leaderboard-section');
    const questionsDiv = document.getElementById('questions-container');
    const pagination = document.getElementById('feed-pagination');
    const title = document.getElementById('feed-title');

    if (!leaderboardSec) return;

    if (show) {
        title.innerText = 'Contributor Leaderboard';
        questionsDiv.innerHTML = '';
        if (pagination) pagination.style.display = 'none';
        leaderboardSec.style.display = 'block';

        // Load leaderboard list
        try {
            const leaderboard = await Api.Users.getLeaderboard();
            const tbody = document.getElementById('leaderboard-tbody');
            tbody.innerHTML = '';

            leaderboard.forEach((user, index) => {
                const badgesHTML = user.badges.map(badge => {
                    const styleClass = badge.toLowerCase().replace(' ', '-');
                    return `<span class="badge-pill ${styleClass}">${badge}</span>`;
                }).join(' ');

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>#${index + 1}</strong></td>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${user.avatarUrl}" class="rounded-circle me-2" width="28" height="28">
                            <a href="profile.html?user=${user.username}" class="fw-bold">${user.username}</a>
                        </div>
                    </td>
                    <td><span class="text-success fw-bold">${user.reputation}</span></td>
                    <td>${badgesHTML || '<span class="text-muted small">None</span>'}</td>
                `;
                tbody.appendChild(row);
            });
        } catch (err) {
            console.error('Failed to load leaderboard', err);
        }
    } else {
        title.innerText = 'All Questions';
        leaderboardSec.style.display = 'none';
    }
}

// Load feed questions
async function loadQuestions(query, category, tag, page, size, sortBy) {
    const container = document.getElementById('questions-container');
    if (!container) return;

    try {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-secondary" role="status"></div>
            </div>`;

        const res = await Api.Questions.getAll(query, category, tag, page, size, sortBy);
        container.innerHTML = '';

        if (res.content.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 border rounded bg-light">
                    <i class="fa-solid fa-circle-question fs-1 text-muted mb-3"></i>
                    <p class="text-muted mb-0">No questions found matching the query.</p>
                </div>`;
            return;
        }

        res.content.forEach(q => {
            const hasAnswers = q.answersCount > 0;
            const hasAccepted = q.acceptedAnswerId !== null;
            let statClass = 'answers';
            if (hasAccepted) {
                statClass = 'accepted-answer';
            } else if (hasAnswers) {
                statClass = 'has-answers';
            }

            const item = document.createElement('div');
            item.className = 'question-item d-flex gap-3';
            item.innerHTML = `
                <div class="question-stats d-flex flex-column justify-content-center">
                    <div class="question-stat votes positive">
                        <strong>${q.votes}</strong> votes
                    </div>
                    <div class="question-stat ${statClass}">
                        <strong>${q.answersCount}</strong> answers
                    </div>
                    <div class="question-stat views">
                        <strong>${q.views}</strong> views
                    </div>
                </div>
                <div class="flex-grow-1">
                    <a href="question-details.html?id=${q.id}" class="question-title-link fw-bold">${q.title}</a>
                    <p class="question-excerpt text-muted mb-2">${q.description.substring(0, 150)}${q.description.length > 150 ? '...' : ''}</p>
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            ${q.tags.map(t => `<a href="index.html?tag=${t}" class="tag-badge">#${t}</a>`).join('')}
                        </div>
                        <div class="question-meta">
                            <img src="${q.authorAvatar}" class="rounded-circle" width="16" height="16">
                            <a href="profile.html?user=${q.authorUsername}" class="meta-author fw-semibold">${q.authorUsername}</a>
                            <span class="meta-reputation">${q.authorReputation}</span>
                            <span class="text-muted">• asked ${new Date(q.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(item);
        });

        // Typeset math LaTeX on title elements
        if (typeof renderMathInElement === 'function') {
            container.querySelectorAll('.question-title-link').forEach(el => {
                renderMathInElement(el, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\(', right: '\\)', display: false},
                        {left: '\\[', right: '\\]', display: true}
                    ],
                    throwOnError: false
                });
            });
        }

        // Setup pagination bar
        renderPagination(res, query, category, tag, size, sortBy);

    } catch (err) {
        container.innerHTML = `
            <div class="alert alert-danger">
                Failed to load questions. Make sure the Spring Boot backend server is running.
            </div>`;
    }
}

// Render pagination control
function renderPagination(pageObj, query, category, tag, size, sortBy) {
    const nav = document.getElementById('feed-pagination');
    if (!nav) return;

    if (pageObj.totalPages <= 1) {
        nav.style.display = 'none';
        return;
    }

    nav.style.display = 'block';
    const ul = nav.querySelector('ul');
    ul.innerHTML = '';

    // Prev Button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${pageObj.first ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
    if (!pageObj.first) {
        prevLi.onclick = (e) => {
            e.preventDefault();
            loadQuestions(query, category, tag, pageObj.number - 1, size, sortBy);
        };
    }
    ul.appendChild(prevLi);

    // Number Buttons
    for (let i = 0; i < pageObj.totalPages; i++) {
        const numLi = document.createElement('li');
        numLi.className = `page-item ${pageObj.number === i ? 'active' : ''}`;
        numLi.innerHTML = `<a class="page-link" href="#">${i + 1}</a>`;
        numLi.onclick = (e) => {
            e.preventDefault();
            loadQuestions(query, category, tag, i, size, sortBy);
        };
        ul.appendChild(numLi);
    }

    // Next Button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${pageObj.last ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
    if (!pageObj.last) {
        nextLi.onclick = (e) => {
            e.preventDefault();
            loadQuestions(query, category, tag, pageObj.number + 1, size, sortBy);
        };
    }
    ul.appendChild(nextLi);
}

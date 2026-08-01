// Central API Client integrating with REST Endpoints
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080/api'
    : 'https://question-and-answer-platform-backend.onrender.com/api'; // Replace with your actual Render backend URL after deployment

const Api = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            
            if (response.status === 401 || response.status === 403) {
                // If unauthorized and not on login/register pages, redirect
                if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html')) {
                    localStorage.clear();
                    window.location.href = 'login.html';
                }
            }

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ message: 'Request failed' }));
                throw new Error(errData.message || 'API request failed');
            }

            // If DELETE or response is text/plain
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return await response.text();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    Auth: {
        async login(username, password) {
            const data = await Api.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            localStorage.setItem('token', data.accessToken);
            localStorage.setItem('username', data.username);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('roles', JSON.stringify(data.roles));
            localStorage.setItem('reputation', data.reputation);
            return data;
        },

        async register(username, email, password) {
            return await Api.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, email, password })
            });
        },

        logout() {
            localStorage.clear();
            window.location.href = 'login.html';
        },

        isAuthenticated() {
            return !!localStorage.getItem('token');
        },

        getCurrentUser() {
            return {
                username: localStorage.getItem('username'),
                userId: localStorage.getItem('userId'),
                reputation: localStorage.getItem('reputation'),
                roles: JSON.parse(localStorage.getItem('roles') || '[]')
            };
        }
    },

    Questions: {
        async getAll(query = '', category = '', tag = '', page = 0, size = 10, sortBy = 'createdAt') {
            let params = `page=${page}&size=${size}&sortBy=${sortBy}`;
            if (query) params += `&query=${encodeURIComponent(query)}`;
            if (category) params += `&category=${encodeURIComponent(category)}`;
            if (tag) params += `&tag=${encodeURIComponent(tag)}`;
            return await Api.request(`/questions?${params}`);
        },

        async getById(id) {
            return await Api.request(`/questions/${id}`);
        },

        async create(title, description, categoryName, tags, imageUrl) {
            return await Api.request('/questions', {
                method: 'POST',
                body: JSON.stringify({ title, description, categoryName, tags, imageUrl })
            });
        },

        async update(id, title, description, categoryName, tags, imageUrl) {
            return await Api.request(`/questions/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ title, description, categoryName, tags, imageUrl })
            });
        },

        async delete(id) {
            return await Api.request(`/questions/${id}`, {
                method: 'DELETE'
            });
        }
    },

    Answers: {
        async getByQuestion(questionId) {
            return await Api.request(`/questions/${questionId}/answers`);
        },

        async create(questionId, text, imageUrl) {
            return await Api.request(`/questions/${questionId}/answers`, {
                method: 'POST',
                body: JSON.stringify({ text, imageUrl })
            });
        },

        async accept(answerId) {
            return await Api.request(`/answers/${answerId}/accept`, {
                method: 'POST'
            });
        },

        async delete(answerId) {
            return await Api.request(`/answers/${answerId}`, {
                method: 'DELETE'
            });
        }
    },

    Comments: {
        async getByQuestion(questionId) {
            return await Api.request(`/questions/${questionId}/comments`);
        },

        async getByAnswer(answerId) {
            return await Api.request(`/answers/${answerId}/comments`);
        },

        async createQuestionComment(questionId, text, parentId = null) {
            return await Api.request(`/questions/${questionId}/comments`, {
                method: 'POST',
                body: JSON.stringify({ text, parentId })
            });
        },

        async createAnswerComment(answerId, text, parentId = null) {
            return await Api.request(`/answers/${answerId}/comments`, {
                method: 'POST',
                body: JSON.stringify({ text, parentId })
            });
        },

        async delete(id) {
            return await Api.request(`/comments/${id}`, {
                method: 'DELETE'
            });
        }
    },

    Votes: {
        async voteQuestion(questionId, value) {
            return await Api.request(`/questions/${questionId}/vote?value=${value}`, {
                method: 'POST'
            });
        },

        async voteAnswer(answerId, value) {
            return await Api.request(`/answers/${answerId}/vote?value=${value}`, {
                method: 'POST'
            });
        }
    },

    Users: {
        async getProfile(username) {
            return await Api.request(`/users/${username}`);
        },

        async getLeaderboard() {
            return await Api.request('/users/leaderboard');
        }
    },

    Notifications: {
        async getAll() {
            return await Api.request('/notifications');
        },

        async markAsRead(id) {
            return await Api.request(`/notifications/${id}/read`, {
                method: 'POST'
            });
        },

        async markAllAsRead() {
            return await Api.request('/notifications/read-all', {
                method: 'POST'
            });
        }
    },

    Admin: {
        async getStats() {
            return await Api.request('/admin/stats');
        }
    }
};

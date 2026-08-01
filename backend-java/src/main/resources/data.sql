-- Seed sample database data for Open Q&A Platform

-- Password hash is '$2a$10$wMdBZpGZ9kK/n1Y1mXmU3Ou4N6bC/H6Bsk1k3QO5rXU5T1h/O71Zq' which decrypts to 'password'
INSERT IGNORE INTO users (username, email, password, bio, reputation, avatar_url) VALUES
('Gokul', 'gokul@gmail.com', '$2a$10$wMdBZpGZ9kK/n1Y1mXmU3Ou4N6bC/H6Bsk1k3QO5rXU5T1h/O71Zq', 'Full-stack software developer who loves math and Java.', 120, 'https://api.dicebear.com/7.x/bottts/svg?seed=Gokul'),
('EinsteinPi', 'einstein@physics.org', '$2a$10$wMdBZpGZ9kK/n1Y1mXmU3Ou4N6bC/H6Bsk1k3QO5rXU5T1h/O71Zq', 'Interested in general relativity, calculus, and algorithms.', 340, 'https://api.dicebear.com/7.x/bottts/svg?seed=EinsteinPi'),
('AdaCode', 'ada@lovelace.net', '$2a$10$wMdBZpGZ9kK/n1Y1mXmU3Ou4N6bC/H6Bsk1k3QO5rXU5T1h/O71Zq', 'First computer programmer. Loves clean structures.', 85, 'https://api.dicebear.com/7.x/bottts/svg?seed=AdaCode');

-- User roles
INSERT IGNORE INTO user_roles (user_id, role) VALUES
(1, 'USER'),
(1, 'ADMIN'),
(2, 'USER'),
(3, 'USER');

-- User badges
INSERT IGNORE INTO user_badges (user_id, badge) VALUES
(1, 'Math Scholar'),
(1, 'Stellar Contributor'),
(2, 'Math Scholar'),
(2, 'Top Scholar'),
(2, 'Popular'),
(3, 'First Word');

-- Categories
INSERT IGNORE INTO categories (name, description) VALUES
('Java', 'Questions related to core Java, JVM, Spring framework, and Maven builds.'),
('Calculus', 'Questions dealing with derivatives, integrations, infinite series, and LaTeX math equations.'),
('Physics', 'Space time, relativity, mechanics, and physical derivations.');

-- Tags
INSERT IGNORE INTO tags (name) VALUES
('spring-boot'),
('integration'),
('relativity'),
('oop');

-- Questions
INSERT IGNORE INTO questions (title, description, author_id, category_id, views) VALUES
('What is dependency injection in Spring Boot?', 'Can anyone explain how IoC container and Dependency Injection work in Spring with a simple code snippet? I want to know about Autowired annotation.', 1, 1, 45),
('Deriving the Gaussian Integral $\\int_{-\\infty}^{\\infty} e^{-x^2} dx$', 'I am trying to solve the Gaussian integral:\n\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\n\nCan someone show the double integration method using polar coordinates?', 2, 2, 98);

-- Question-Tags mapping
INSERT IGNORE INTO question_tags (question_id, tag_id) VALUES
(1, 1),
(1, 4),
(2, 2);

-- Answers
INSERT IGNORE INTO answers (text, author_id, question_id, accepted) VALUES
('Dependency Injection (DI) is a design pattern where the container injects dependencies into objects rather than the objects creating them themselves. You can use `@Autowired` to instruct Spring to inject the component:\n\n```java\n@Component\npublic class Engine {}\n\n@Component\npublic class Car {\n    @Autowired\n    private Engine engine;\n}\n```', 3, 1, true),
('To solve this, let the integral be $I$. Then:\n\n$$I^2 = \\int_{-\\infty}^{\\infty} e^{-x^2} dx \\int_{-\\infty}^{\\infty} e^{-y^2} dy = \\int_{-\\infty}^{\\infty} \\int_{-\\infty}^{\\infty} e^{-(x^2+y^2)} dx dy$$\n\nIn polar coordinates ($x^2+y^2=r^2$ and $dx dy = r dr d\\theta$):\n\n$$I^2 = \\int_{0}^{2\\pi} d\\theta \\int_{0}^{\\infty} e^{-r^2} r dr = 2\\pi \\left[ -\\frac{1}{2} e^{-r^2} \\right]_0^\\infty = \\pi$$\n\nHence, $I = \\sqrt{\\pi}$.', 1, 2, true);

-- Update accepted answers in questions
UPDATE questions SET accepted_answer_id = 1 WHERE id = 1;
UPDATE questions SET accepted_answer_id = 2 WHERE id = 2;

-- Comments
INSERT IGNORE INTO comments (text, author_id, question_id, answer_id) VALUES
('This is the most elegant solution I have ever seen. Thanks Gokul!', 2, NULL, 2),
('Very clear example using automotive components, Ada!', 1, NULL, 1);

-- Votes
INSERT IGNORE INTO votes (user_id, question_id, answer_id, value) VALUES
(2, 1, NULL, 1),
(3, 2, NULL, 1),
(1, NULL, 1, 1),
(2, NULL, 2, 1);

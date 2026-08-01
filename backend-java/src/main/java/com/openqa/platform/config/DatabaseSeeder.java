package com.openqa.platform.config;

import com.openqa.platform.entity.*;
import com.openqa.platform.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final CommentRepository commentRepository;
    private final VoteRepository voteRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UserRepository userRepository,
                          CategoryRepository categoryRepository,
                          TagRepository tagRepository,
                          QuestionRepository questionRepository,
                          AnswerRepository answerRepository,
                          CommentRepository commentRepository,
                          VoteRepository voteRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.commentRepository = commentRepository;
        this.voteRepository = voteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            return; // Already seeded
        }

        String encodedPassword = passwordEncoder.encode("password");

        // 1. Seed Users
        User gokul = User.builder()
                .username("Gokul")
                .email("gokul@gmail.com")
                .password(encodedPassword)
                .bio("Full-stack software developer who loves math and Java.")
                .reputation(120)
                .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=Gokul")
                .roles(new HashSet<>(Arrays.asList("USER", "ADMIN")))
                .badges(new HashSet<>(Arrays.asList("Math Scholar", "Stellar Contributor")))
                .build();

        User einstein = User.builder()
                .username("EinsteinPi")
                .email("einstein@physics.org")
                .password(encodedPassword)
                .bio("Interested in general relativity, calculus, and algorithms.")
                .reputation(340)
                .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=EinsteinPi")
                .roles(new HashSet<>(Collections.singletonList("USER")))
                .badges(new HashSet<>(Arrays.asList("Math Scholar", "Top Scholar", "Popular")))
                .build();

        User ada = User.builder()
                .username("AdaCode")
                .email("ada@lovelace.net")
                .password(encodedPassword)
                .bio("First computer programmer. Loves clean structures.")
                .reputation(85)
                .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=AdaCode")
                .roles(new HashSet<>(Collections.singletonList("USER")))
                .badges(new HashSet<>(Collections.singletonList("First Word")))
                .build();

        gokul = userRepository.save(gokul);
        einstein = userRepository.save(einstein);
        ada = userRepository.save(ada);

        // 2. Seed Categories
        Category javaCategory = Category.builder()
                .name("Java")
                .description("Questions related to core Java, JVM, Spring framework, and Maven builds.")
                .build();

        Category calculusCategory = Category.builder()
                .name("Calculus")
                .description("Questions dealing with derivatives, integrations, infinite series, and LaTeX math equations.")
                .build();

        Category physicsCategory = Category.builder()
                .name("Physics")
                .description("Space time, relativity, mechanics, and physical derivations.")
                .build();

        javaCategory = categoryRepository.save(javaCategory);
        calculusCategory = categoryRepository.save(calculusCategory);
        physicsCategory = categoryRepository.save(physicsCategory);

        // 3. Seed Tags
        Tag springBootTag = Tag.builder().name("spring-boot").build();
        Tag integrationTag = Tag.builder().name("integration").build();
        Tag relativityTag = Tag.builder().name("relativity").build();
        Tag oopTag = Tag.builder().name("oop").build();

        springBootTag = tagRepository.save(springBootTag);
        integrationTag = tagRepository.save(integrationTag);
        relativityTag = tagRepository.save(relativityTag);
        oopTag = tagRepository.save(oopTag);

        // 4. Seed Questions
        Question q1 = Question.builder()
                .title("What is dependency injection in Spring Boot?")
                .description("Can anyone explain how IoC container and Dependency Injection work in Spring with a simple code snippet? I want to know about Autowired annotation.")
                .author(gokul)
                .category(javaCategory)
                .tags(new HashSet<>(Arrays.asList(springBootTag, oopTag)))
                .views(45)
                .build();

        Question q2 = Question.builder()
                .title("Deriving the Gaussian Integral $\\int_{-\\infty}^{\\infty} e^{-x^2} dx$")
                .description("I am trying to solve the Gaussian integral:\n\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\n\nCan someone show the double integration method using polar coordinates?")
                .author(einstein)
                .category(calculusCategory)
                .tags(new HashSet<>(Collections.singletonList(integrationTag)))
                .views(98)
                .build();

        q1 = questionRepository.save(q1);
        q2 = questionRepository.save(q2);

        // 5. Seed Answers
        Answer a1 = Answer.builder()
                .text("Dependency Injection (DI) is a design pattern where the container injects dependencies into objects rather than the objects creating them themselves. You can use `@Autowired` to instruct Spring to inject the component:\n\n```java\n@Component\npublic class Engine {}\n\n@Component\npublic class Car {\n    @Autowired\n    private Engine engine;\n}\n```")
                .author(ada)
                .question(q1)
                .accepted(true)
                .build();

        Answer a2 = Answer.builder()
                .text("To solve this, let the integral be $I$. Then:\n\n$$I^2 = \\int_{-\\infty}^{\\infty} e^{-x^2} dx \\int_{-\\infty}^{\\infty} e^{-y^2} dy = \\int_{-\\infty}^{\\infty} \\int_{-\\infty}^{\\infty} e^{-(x^2+y^2)} dx dy$$\n\nIn polar coordinates ($x^2+y^2=r^2$ and $dx dy = r dr d\\theta$):\n\n$$I^2 = \\int_{0}^{2\\pi} d\\theta \\int_{0}^{\\infty} e^{-r^2} r dr = 2\\pi \\left[ -\\frac{1}{2} e^{-r^2} \\right]_0^\\infty = \\pi$$\n\nHence, $I = \\sqrt{\\pi}$.")
                .author(gokul)
                .question(q2)
                .accepted(true)
                .build();

        a1 = answerRepository.save(a1);
        a2 = answerRepository.save(a2);

        // 6. Update Questions with Accepted Answer IDs
        q1.setAcceptedAnswerId(a1.getId());
        q2.setAcceptedAnswerId(a2.getId());
        questionRepository.save(q1);
        questionRepository.save(q2);

        // 7. Seed Comments
        Comment c1 = Comment.builder()
                .text("This is the most elegant solution I have ever seen. Thanks Gokul!")
                .author(einstein)
                .answer(a2)
                .build();

        Comment c2 = Comment.builder()
                .text("Very clear example using automotive components, Ada!")
                .author(gokul)
                .answer(a1)
                .build();

        commentRepository.save(c1);
        commentRepository.save(c2);

        // 8. Seed Votes
        Vote v1 = Vote.builder().user(einstein).question(q1).value(1).build();
        Vote v2 = Vote.builder().user(ada).question(q2).value(1).build();
        Vote v3 = Vote.builder().user(gokul).answer(a1).value(1).build();
        Vote v4 = Vote.builder().user(einstein).answer(a2).value(1).build();

        voteRepository.save(v1);
        voteRepository.save(v2);
        voteRepository.save(v3);
        voteRepository.save(v4);
    }
}

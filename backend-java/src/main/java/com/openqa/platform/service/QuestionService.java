package com.openqa.platform.service;

import com.openqa.platform.dto.QuestionRequest;
import com.openqa.platform.dto.QuestionResponse;
import com.openqa.platform.entity.Category;
import com.openqa.platform.entity.Question;
import com.openqa.platform.entity.Tag;
import com.openqa.platform.entity.User;
import com.openqa.platform.exception.BadRequestException;
import com.openqa.platform.exception.ResourceNotFoundException;
import com.openqa.platform.repository.CategoryRepository;
import com.openqa.platform.repository.QuestionRepository;
import com.openqa.platform.repository.TagRepository;
import com.openqa.platform.repository.UserRepository;
import com.openqa.platform.repository.VoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashSet;
import java.util.Set;
import com.openqa.platform.entity.Vote;
import java.util.stream.Collectors;

@Service
public class QuestionService {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private VoteRepository voteRepository;

    @Autowired
    private UserService userService;

    @Transactional
    public QuestionResponse createQuestion(QuestionRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Category category = null;
        if (request.getCategoryName() != null && !request.getCategoryName().isBlank()) {
            category = categoryRepository.findByName(request.getCategoryName())
                    .orElseGet(() -> categoryRepository.save(
                            Category.builder()
                                    .name(request.getCategoryName())
                                    .description("Auto created category")
                                    .build()
                    ));
        }

        Set<Tag> tags = new HashSet<>();
        if (request.getTags() != null) {
            for (String tagName : request.getTags()) {
                if (tagName.trim().isEmpty()) continue;
                Tag tag = tagRepository.findByName(tagName.trim().toLowerCase())
                        .orElseGet(() -> tagRepository.save(
                                Tag.builder().name(tagName.trim().toLowerCase()).build()
                        ));
                tags.add(tag);
            }
        }

        Question question = Question.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .author(user)
                .category(category)
                .tags(tags)
                .imageUrl(request.getImageUrl())
                .build();

        Question saved = questionRepository.save(question);

        // Reputation points award rules (+5 points for asking a question)
        userService.updateUserReputation(user, 5);

        // LaTeX check
        if (isLatex(request.getTitle()) || isLatex(request.getDescription())) {
            userService.addBadgeToUser(user, "Math Scholar");
        }

        return mapToResponse(saved);
    }

    @Transactional
    public QuestionResponse updateQuestion(Long id, QuestionRequest request, String username) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        if (!question.getAuthor().getUsername().equals(username)) {
            throw new BadRequestException("Unauthorized to update this question");
        }

        question.setTitle(request.getTitle());
        question.setDescription(request.getDescription());

        if (request.getCategoryName() != null && !request.getCategoryName().isBlank()) {
            Category category = categoryRepository.findByName(request.getCategoryName())
                    .orElseGet(() -> categoryRepository.save(
                            Category.builder().name(request.getCategoryName()).build()
                    ));
            question.setCategory(category);
        }

        Set<Tag> tags = new HashSet<>();
        if (request.getTags() != null) {
            for (String tagName : request.getTags()) {
                if (tagName.trim().isEmpty()) continue;
                Tag tag = tagRepository.findByName(tagName.trim().toLowerCase())
                        .orElseGet(() -> tagRepository.save(
                                Tag.builder().name(tagName.trim().toLowerCase()).build()
                        ));
                tags.add(tag);
            }
        }
        question.setTags(tags);
        question.setImageUrl(request.getImageUrl());

        return mapToResponse(questionRepository.save(question));
    }

    @Transactional
    public void deleteQuestion(Long id, String username, boolean isAdmin) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        if (!question.getAuthor().getUsername().equals(username) && !isAdmin) {
            throw new BadRequestException("Unauthorized to delete this question");
        }

        questionRepository.delete(question);
    }

    @Transactional
    public QuestionResponse getQuestionById(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        
        // Increment view count
        question.setViews(question.getViews() + 1);
        Question saved = questionRepository.save(question);
        return mapToResponse(saved);
    }

    public Page<QuestionResponse> getAllQuestions(String query, String category, String tag, int page, int size, String sortBy) {
        Sort sort = Sort.by(sortBy).descending();
        if ("votes".equalsIgnoreCase(sortBy)) {
            // Sort by views or timestamp as base, votes sorting logic is done in query or memory
            sort = Sort.by("createdAt").descending(); 
        }
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Question> questions;
        if (query != null && !query.isBlank()) {
            questions = questionRepository.searchQuestions(query, pageable);
        } else if (category != null && !category.isBlank()) {
            Category cat = categoryRepository.findByName(category)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            questions = questionRepository.findByCategory(cat, pageable);
        } else if (tag != null && !tag.isBlank()) {
            questions = questionRepository.findByTagsName(tag.trim().toLowerCase(), pageable);
        } else {
            questions = questionRepository.findAll(pageable);
        }

        return questions.map(this::mapToResponse);
    }

    private boolean isLatex(String text) {
        if (text == null) return false;
        return text.contains("$$") || text.contains("$") || text.contains("\\(") || text.contains("\\[");
    }

    public QuestionResponse mapToResponse(Question q) {
        int voteSum = voteRepository.getQuestionVoteCount(q);

        int userVoteVal = 0;
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String currentUsername = null;
            if (auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                currentUsername = ((org.springframework.security.core.userdetails.UserDetails) auth.getPrincipal()).getUsername();
            } else {
                currentUsername = auth.getPrincipal().toString();
            }
            if (currentUsername != null) {
                User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
                if (currentUser != null) {
                    userVoteVal = voteRepository.findByUserAndQuestion(currentUser, q)
                            .map(Vote::getValue).orElse(0);
                }
            }
        }

        return QuestionResponse.builder()
                .id(q.getId())
                .title(q.getTitle())
                .description(q.getDescription())
                .authorId(q.getAuthor().getId())
                .authorUsername(q.getAuthor().getUsername())
                .authorReputation(q.getAuthor().getReputation())
                .authorAvatar(q.getAuthor().getAvatarUrl())
                .categoryName(q.getCategory() != null ? q.getCategory().getName() : null)
                .tags(q.getTags().stream().map(Tag::getName).collect(Collectors.toSet()))
                .views(q.getViews())
                .votes(voteSum)
                .userVote(userVoteVal)
                .answersCount(q.getAnswers().size())
                .acceptedAnswerId(q.getAcceptedAnswerId())
                .imageUrl(q.getImageUrl())
                .createdAt(q.getCreatedAt())
                .build();
    }
}

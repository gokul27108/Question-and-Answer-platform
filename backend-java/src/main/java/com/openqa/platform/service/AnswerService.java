package com.openqa.platform.service;

import com.openqa.platform.dto.AnswerRequest;
import com.openqa.platform.dto.AnswerResponse;
import com.openqa.platform.entity.Answer;
import com.openqa.platform.entity.Vote;
import com.openqa.platform.entity.Question;
import com.openqa.platform.entity.User;
import com.openqa.platform.exception.BadRequestException;
import com.openqa.platform.exception.ResourceNotFoundException;
import com.openqa.platform.repository.AnswerRepository;
import com.openqa.platform.repository.QuestionRepository;
import com.openqa.platform.repository.UserRepository;
import com.openqa.platform.repository.VoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnswerService {

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VoteRepository voteRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public AnswerResponse createAnswer(Long questionId, AnswerRequest request, String username) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Answer answer = Answer.builder()
                .text(request.getText())
                .author(user)
                .question(question)
                .imageUrl(request.getImageUrl())
                .build();

        Answer saved = answerRepository.save(answer);

        // Reputation points award rules (+10 points for posting an answer)
        userService.updateUserReputation(user, 10);

        // First Word Badge: check if it is the first answer they provide
        List<Answer> userAnswers = answerRepository.findByAuthorUsername(username);
        if (userAnswers.size() == 1) {
            userService.addBadgeToUser(user, "First Word");
        }

        // LaTeX check
        if (request.getText().contains("$$") || request.getText().contains("$") || request.getText().contains("\\(") || request.getText().contains("\\[")) {
            userService.addBadgeToUser(user, "Math Scholar");
        }

        // Notify question author
        if (!question.getAuthor().getUsername().equals(username)) {
            notificationService.createNotification(
                    question.getAuthor(),
                    "NEW_ANSWER",
                    user.getUsername() + " posted an answer to your question: " + question.getTitle(),
                    question.getId()
            );
        }

        return mapToResponse(saved);
    }

    @Transactional
    public AnswerResponse updateAnswer(Long id, AnswerRequest request, String username) {
        Answer answer = answerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found"));

        if (!answer.getAuthor().getUsername().equals(username)) {
            throw new BadRequestException("Unauthorized to update this answer");
        }

        answer.setText(request.getText());
        answer.setImageUrl(request.getImageUrl());
        return mapToResponse(answerRepository.save(answer));
    }

    @Transactional
    public void deleteAnswer(Long id, String username, boolean isAdmin) {
        Answer answer = answerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found"));

        if (!answer.getAuthor().getUsername().equals(username) && !isAdmin) {
            throw new BadRequestException("Unauthorized to delete this answer");
        }

        answerRepository.delete(answer);
    }

    @Transactional
    public AnswerResponse acceptAnswer(Long id, String username) {
        Answer answer = answerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found"));

        Question question = answer.getQuestion();

        // Toggle state
        boolean currentStatus = answer.isAccepted();
        
        // Reset other accepted answers for the same question
        question.getAnswers().forEach(a -> {
            if (a.isAccepted()) {
                a.setAccepted(false);
                answerRepository.save(a);
                // Deduct points from previous accepted owner
                userService.updateUserReputation(a.getAuthor(), -25);
            }
        });

        answer.setAccepted(!currentStatus);
        Answer saved = answerRepository.save(answer);

        if (saved.isAccepted()) {
            question.setAcceptedAnswerId(saved.getId());
            // Award reputation: +25 to answerer
            userService.updateUserReputation(saved.getAuthor(), 25);

            // Notify answerer
            notificationService.createNotification(
                    saved.getAuthor(),
                    "ACCEPTED_ANSWER",
                    "Your answer has been accepted as the best answer!",
                    question.getId()
            );
        } else {
            question.setAcceptedAnswerId(null);
        }
        questionRepository.save(question);

        return mapToResponse(saved);
    }

    public List<AnswerResponse> getAnswersByQuestionId(Long questionId) {
        return answerRepository.findByQuestionId(questionId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public AnswerResponse mapToResponse(Answer a) {
        int voteSum = voteRepository.getAnswerVoteCount(a);

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
                    userVoteVal = voteRepository.findByUserAndAnswer(currentUser, a)
                            .map(Vote::getValue).orElse(0);
                }
            }
        }

        return AnswerResponse.builder()
                .id(a.getId())
                .questionId(a.getQuestion().getId())
                .text(a.getText())
                .authorId(a.getAuthor().getId())
                .authorUsername(a.getAuthor().getUsername())
                .authorReputation(a.getAuthor().getReputation())
                .authorAvatar(a.getAuthor().getAvatarUrl())
                .accepted(a.isAccepted())
                .votes(voteSum)
                .userVote(userVoteVal)
                .imageUrl(a.getImageUrl())
                .createdAt(a.getCreatedAt())
                .build();
    }
}

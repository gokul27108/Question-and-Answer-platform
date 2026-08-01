package com.openqa.platform.service;

import com.openqa.platform.entity.Answer;
import com.openqa.platform.entity.Question;
import com.openqa.platform.entity.User;
import com.openqa.platform.entity.Vote;
import com.openqa.platform.exception.ResourceNotFoundException;
import com.openqa.platform.repository.AnswerRepository;
import com.openqa.platform.repository.QuestionRepository;
import com.openqa.platform.repository.UserRepository;
import com.openqa.platform.repository.VoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
public class VoteService {

    @Autowired
    private VoteRepository voteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public void voteQuestion(Long questionId, int value, String username) {
        if (value != 1 && value != -1) {
            throw new IllegalArgumentException("Vote value must be 1 or -1");
        }

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Optional<Vote> existingVote = voteRepository.findByUserAndQuestion(user, question);

        int repChange = 0;

        if (existingVote.isPresent()) {
            Vote vote = existingVote.get();
            if (vote.getValue() == value) {
                // Remove vote if clicked same direction
                voteRepository.delete(vote);
                // Undo reputation change
                repChange = (value == 1) ? -15 : 2;
            } else {
                // Change vote direction
                vote.setValue(value);
                voteRepository.save(vote);
                // Difference in reputation: up to down is -17, down to up is +17
                repChange = (value == 1) ? 17 : -17;
            }
        } else {
            // New vote
            Vote vote = Vote.builder()
                    .user(user)
                    .question(question)
                    .value(value)
                    .build();
            voteRepository.save(vote);

            // Add reputation: upvote is +15, downvote is -2
            repChange = (value == 1) ? 15 : -2;

            // Notify user of upvote
            if (value == 1 && !question.getAuthor().getUsername().equals(username)) {
                notificationService.createNotification(
                        question.getAuthor(),
                        "UPVOTE",
                        user.getUsername() + " upvoted your question: " + question.getTitle(),
                        question.getId()
                );
            }
        }

        if (repChange != 0) {
            userService.updateUserReputation(question.getAuthor(), repChange);
        }

        // Popular badge check
        int score = voteRepository.getQuestionVoteCount(question);
        if (score >= 5) {
            userService.addBadgeToUser(question.getAuthor(), "Popular");
        }
    }

    @Transactional
    public void voteAnswer(Long answerId, int value, String username) {
        if (value != 1 && value != -1) {
            throw new IllegalArgumentException("Vote value must be 1 or -1");
        }

        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Optional<Vote> existingVote = voteRepository.findByUserAndAnswer(user, answer);

        int repChange = 0;

        if (existingVote.isPresent()) {
            Vote vote = existingVote.get();
            if (vote.getValue() == value) {
                // Remove vote if clicked same direction
                voteRepository.delete(vote);
                repChange = (value == 1) ? -15 : 2;
            } else {
                // Change vote direction
                vote.setValue(value);
                voteRepository.save(vote);
                repChange = (value == 1) ? 17 : -17;
            }
        } else {
            // New vote
            Vote vote = Vote.builder()
                    .user(user)
                    .answer(answer)
                    .value(value)
                    .build();
            voteRepository.save(vote);
            repChange = (value == 1) ? 15 : -2;

            // Notify user of upvote
            if (value == 1 && !answer.getAuthor().getUsername().equals(username)) {
                notificationService.createNotification(
                        answer.getAuthor(),
                        "UPVOTE",
                        user.getUsername() + " upvoted your answer.",
                        answer.getQuestion().getId()
                );
            }
        }

        if (repChange != 0) {
            userService.updateUserReputation(answer.getAuthor(), repChange);
        }

        // Popular badge check
        int score = voteRepository.getAnswerVoteCount(answer);
        if (score >= 5) {
            userService.addBadgeToUser(answer.getAuthor(), "Popular");
        }
    }
}

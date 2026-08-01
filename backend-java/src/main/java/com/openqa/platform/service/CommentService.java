package com.openqa.platform.service;

import com.openqa.platform.dto.CommentRequest;
import com.openqa.platform.dto.CommentResponse;
import com.openqa.platform.entity.Answer;
import com.openqa.platform.entity.Comment;
import com.openqa.platform.entity.Question;
import com.openqa.platform.entity.User;
import com.openqa.platform.exception.BadRequestException;
import com.openqa.platform.exception.ResourceNotFoundException;
import com.openqa.platform.repository.AnswerRepository;
import com.openqa.platform.repository.CommentRepository;
import com.openqa.platform.repository.QuestionRepository;
import com.openqa.platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public CommentResponse createQuestionComment(Long questionId, CommentRequest request, String username) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Comment comment = Comment.builder()
                .text(request.getText())
                .author(user)
                .question(question)
                .build();

        if (request.getParentId() != null) {
            Comment parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));
            comment.setParentComment(parent);
        }

        Comment saved = commentRepository.save(comment);

        // Notify question author
        if (!question.getAuthor().getUsername().equals(username)) {
            notificationService.createNotification(
                    question.getAuthor(),
                    "NEW_COMMENT",
                    user.getUsername() + " commented on your question: " + question.getTitle(),
                    question.getId()
            );
        }

        return mapToResponse(saved);
    }

    @Transactional
    public CommentResponse createAnswerComment(Long answerId, CommentRequest request, String username) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Comment comment = Comment.builder()
                .text(request.getText())
                .author(user)
                .answer(answer)
                .build();

        if (request.getParentId() != null) {
            Comment parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));
            comment.setParentComment(parent);
        }

        Comment saved = commentRepository.save(comment);

        // Notify answer author
        if (!answer.getAuthor().getUsername().equals(username)) {
            notificationService.createNotification(
                    answer.getAuthor(),
                    "NEW_COMMENT",
                    user.getUsername() + " commented on your answer.",
                    answer.getQuestion().getId()
            );
        }

        return mapToResponse(saved);
    }

    @Transactional
    public void deleteComment(Long id, String username, boolean isAdmin) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!comment.getAuthor().getUsername().equals(username) && !isAdmin) {
            throw new BadRequestException("Unauthorized to delete this comment");
        }

        commentRepository.delete(comment);
    }

    public List<CommentResponse> getCommentsByQuestionId(Long questionId) {
        return commentRepository.findByQuestionIdAndParentCommentIsNull(questionId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CommentResponse> getCommentsByAnswerId(Long answerId) {
        return commentRepository.findByAnswerIdAndParentCommentIsNull(answerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CommentResponse mapToResponse(Comment comment) {
        List<CommentResponse> replies = comment.getReplies().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return CommentResponse.builder()
                .id(comment.getId())
                .text(comment.getText())
                .authorId(comment.getAuthor().getId())
                .authorUsername(comment.getAuthor().getUsername())
                .authorReputation(comment.getAuthor().getReputation())
                .createdAt(comment.getCreatedAt())
                .replies(replies)
                .build();
    }
}

package com.openqa.platform.repository;

import com.openqa.platform.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByQuestionIdAndParentCommentIsNull(Long questionId);
    List<Comment> findByAnswerIdAndParentCommentIsNull(Long answerId);
}

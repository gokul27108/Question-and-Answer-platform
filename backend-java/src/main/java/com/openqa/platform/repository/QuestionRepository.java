package com.openqa.platform.repository;

import com.openqa.platform.entity.Category;
import com.openqa.platform.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    Page<Question> findByCategory(Category category, Pageable pageable);

    Page<Question> findByTagsName(String tagName, Pageable pageable);

    Page<Question> findByAuthorUsername(String username, Pageable pageable);

    @Query("SELECT DISTINCT q FROM Question q LEFT JOIN q.tags t WHERE " +
           "LOWER(q.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(q.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Question> searchQuestions(@Param("query") String query, Pageable pageable);
}

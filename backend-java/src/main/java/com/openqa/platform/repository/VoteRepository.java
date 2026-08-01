package com.openqa.platform.repository;

import com.openqa.platform.entity.Answer;
import com.openqa.platform.entity.Question;
import com.openqa.platform.entity.User;
import com.openqa.platform.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {
    Optional<Vote> findByUserAndQuestion(User user, Question question);
    Optional<Vote> findByUserAndAnswer(User user, Answer answer);
    
    @Query("SELECT COALESCE(SUM(v.value), 0) FROM Vote v WHERE v.question = :question")
    int getQuestionVoteCount(Question question);

    @Query("SELECT COALESCE(SUM(v.value), 0) FROM Vote v WHERE v.answer = :answer")
    int getAnswerVoteCount(Answer answer);
}

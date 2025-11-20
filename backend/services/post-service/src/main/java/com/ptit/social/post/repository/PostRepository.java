package com.ptit.social.post.repository;

import com.ptit.social.post.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findByOrderByCreatedAtDesc(Pageable pageable);
    Page<Post> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    List<Post> findByUserIdInOrderByCreatedAtDesc(List<Long> userIds, Pageable pageable);
}

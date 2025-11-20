package com.ptit.social.post.dto;

import com.ptit.social.post.model.Post.Privacy;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class PostResponse {
    private Long id;
    private Long userId;
    private String content;
    private String imageUrl;
    private String videoUrl;
    private Integer likeCount;
    private Integer commentCount;
    private Integer shareCount;
    private Privacy privacy;
    private Boolean isLiked;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

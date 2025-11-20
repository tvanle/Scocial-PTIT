package com.ptit.social.post.dto;

import com.ptit.social.post.model.Post.Privacy;
import lombok.Data;

@Data
public class PostRequest {
    private String content;
    private String imageUrl;
    private String videoUrl;
    private Privacy privacy;
}

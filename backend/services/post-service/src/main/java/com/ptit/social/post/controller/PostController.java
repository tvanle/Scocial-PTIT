package com.ptit.social.post.controller;

import com.ptit.social.post.dto.PostRequest;
import com.ptit.social.post.dto.PostResponse;
import com.ptit.social.post.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody PostRequest request) {
        return ResponseEntity.ok(postService.createPost(userId, request));
    }

    @GetMapping("/feed")
    public ResponseEntity<Page<PostResponse>> getNewsFeed(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(postService.getNewsFeed(userId, page, size));
    }

    @GetMapping("/user/{targetUserId}")
    public ResponseEntity<Page<PostResponse>> getUserPosts(
            @PathVariable Long targetUserId,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(postService.getUserPosts(targetUserId, currentUserId, page, size));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<PostResponse> getPost(
            @PathVariable Long postId,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(postService.getPost(postId, userId));
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<PostResponse> likePost(
            @PathVariable Long postId,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(postService.likePost(postId, userId));
    }

    @DeleteMapping("/{postId}/like")
    public ResponseEntity<PostResponse> unlikePost(
            @PathVariable Long postId,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(postService.unlikePost(postId, userId));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long postId,
            @RequestHeader("X-User-Id") Long userId) {
        postService.deletePost(postId, userId);
        return ResponseEntity.ok().build();
    }
}

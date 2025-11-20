package com.ptit.social.data.model

import com.google.gson.annotations.SerializedName

// Auth Models
data class RegisterRequest(
    val email: String,
    val username: String,
    val password: String,
    val fullName: String,
    val studentId: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class AuthResponse(
    val token: String,
    val type: String,
    val userId: Long,
    val username: String,
    val email: String
)

// Post Models
data class Post(
    val id: Long,
    val userId: Long,
    val content: String?,
    val imageUrl: String?,
    val videoUrl: String?,
    val likeCount: Int,
    val commentCount: Int,
    val shareCount: Int,
    val privacy: String,
    val isLiked: Boolean,
    val createdAt: String,
    val updatedAt: String
)

data class CreatePostRequest(
    val content: String?,
    val imageUrl: String?,
    val videoUrl: String?,
    val privacy: String = "PUBLIC"
)

// Comment Models
data class Comment(
    val id: Long,
    val postId: Long,
    val userId: Long,
    val content: String,
    val parentId: Long?,
    val createdAt: String
)

data class CreateCommentRequest(
    val postId: Long,
    val content: String,
    val parentId: Long? = null
)

// Pagination
data class PageResponse<T>(
    val content: List<T>,
    val totalPages: Int,
    val totalElements: Long,
    val size: Int,
    val number: Int
)

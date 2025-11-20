package com.ptit.social.data.api

import com.ptit.social.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth endpoints
    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    // Post endpoints
    @GET("api/posts/feed")
    suspend fun getNewsFeed(
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): Response<PageResponse<Post>>

    @POST("api/posts")
    suspend fun createPost(@Body request: CreatePostRequest): Response<Post>

    @GET("api/posts/{postId}")
    suspend fun getPost(@Path("postId") postId: Long): Response<Post>

    @POST("api/posts/{postId}/like")
    suspend fun likePost(@Path("postId") postId: Long): Response<Post>

    @DELETE("api/posts/{postId}/like")
    suspend fun unlikePost(@Path("postId") postId: Long): Response<Post>

    @DELETE("api/posts/{postId}")
    suspend fun deletePost(@Path("postId") postId: Long): Response<Unit>

    // Comment endpoints
    @GET("api/comments/post/{postId}")
    suspend fun getComments(
        @Path("postId") postId: Long,
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): Response<PageResponse<Comment>>

    @POST("api/comments")
    suspend fun createComment(@Body request: CreateCommentRequest): Response<Comment>
}

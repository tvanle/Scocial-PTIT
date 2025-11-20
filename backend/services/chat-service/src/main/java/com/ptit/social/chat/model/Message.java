package com.ptit.social.chat.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    @Id
    private String id;
    private Long senderId;
    private Long receiverId;
    private String content;
    private String imageUrl;
    private Boolean isRead = false;
    private LocalDateTime createdAt = LocalDateTime.now();
}

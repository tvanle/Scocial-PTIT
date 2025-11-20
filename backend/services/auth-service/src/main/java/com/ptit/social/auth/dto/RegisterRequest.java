package com.ptit.social.auth.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String username;
    private String password;
    private String fullName;
    private String studentId;
}

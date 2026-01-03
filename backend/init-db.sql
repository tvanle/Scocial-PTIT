-- Initialize databases for PTIT Social microservices

-- Auth Service Database
CREATE DATABASE ptit_auth;

-- User Service Database
CREATE DATABASE ptit_users;

-- Post Service Database
CREATE DATABASE ptit_posts;

-- Group Service Database
CREATE DATABASE ptit_groups;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ptit_auth TO postgres;
GRANT ALL PRIVILEGES ON DATABASE ptit_users TO postgres;
GRANT ALL PRIVILEGES ON DATABASE ptit_posts TO postgres;
GRANT ALL PRIVILEGES ON DATABASE ptit_groups TO postgres;

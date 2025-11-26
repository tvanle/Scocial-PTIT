-- Create databases for each service
CREATE DATABASE ptit_auth;
CREATE DATABASE ptit_users;
CREATE DATABASE ptit_posts;
CREATE DATABASE ptit_groups;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ptit_auth TO postgres;
GRANT ALL PRIVILEGES ON DATABASE ptit_users TO postgres;
GRANT ALL PRIVILEGES ON DATABASE ptit_posts TO postgres;
GRANT ALL PRIVILEGES ON DATABASE ptit_groups TO postgres;

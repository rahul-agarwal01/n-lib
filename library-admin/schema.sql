-- Library Admin MySQL Schema
-- Generated for Library Software Admin Dashboard

-- =============================================
-- CREATE DATABASE
-- =============================================
CREATE SCHEMA IF NOT EXISTS `n_lib` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `n_lib`;

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_name ON users(name);

-- =============================================
-- CATEGORIES TABLE
-- =============================================
CREATE TABLE categories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    abbreviation VARCHAR(45),
    PRIMARY KEY (id)
);

CREATE INDEX idx_categories_name ON categories(name);

-- =============================================
-- WRITERS TABLE
-- =============================================
CREATE TABLE writers (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    nationality VARCHAR(100),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    image_url VARCHAR(1000),
    PRIMARY KEY (id)
);

CREATE INDEX idx_writers_name ON writers(name);
CREATE UNIQUE INDEX idx_writers_name_nationality ON writers(name, nationality);

-- =============================================
-- BOOKS TABLE
-- =============================================
CREATE TABLE books (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(500) NOT NULL,
    isbn VARCHAR(20) NOT NULL,
    label_number VARCHAR(50),
    barcode VARCHAR(100),
    publication_year SMALLINT UNSIGNED,
    total_copies INT UNSIGNED NOT NULL DEFAULT 1,
    available_copies INT UNSIGNED NOT NULL DEFAULT 1,
    image_url VARCHAR(1000),
    description TEXT,
    owner_id BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    book_type VARCHAR(45),
    PRIMARY KEY (id),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_label_number ON books(label_number);
CREATE INDEX idx_books_barcode ON books(barcode);
CREATE INDEX idx_books_owner_id ON books(owner_id);
CREATE INDEX idx_books_publication_year ON books(publication_year);

-- =============================================
-- BOOK_CATEGORIES (Junction Table)
-- =============================================
CREATE TABLE book_categories (
    book_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (book_id, category_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_book_categories_category_id ON book_categories(category_id);

-- =============================================
-- BOOK_WRITERS (Junction Table)
-- =============================================
CREATE TABLE book_writers (
    book_id BIGINT UNSIGNED NOT NULL,
    writer_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (book_id, writer_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (writer_id) REFERENCES writers(id) ON DELETE CASCADE
);

CREATE INDEX idx_book_writers_writer_id ON book_writers(writer_id);

-- =============================================
-- BOOKS_CIRCULATION TABLE
-- Tracks book issues and returns
-- =============================================
CREATE TABLE books_circulation (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    book_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    status ENUM('issued', 'returned') NOT NULL DEFAULT 'issued',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_books_circulation_book_id ON books_circulation(book_id);
CREATE INDEX idx_books_circulation_user_id ON books_circulation(user_id);
CREATE INDEX idx_books_circulation_status ON books_circulation(status);
CREATE INDEX idx_books_circulation_issue_date ON books_circulation(issue_date);
CREATE INDEX idx_books_circulation_due_date ON books_circulation(due_date);

-- =============================================
-- BOOK_REQUESTS TABLE
-- Tracks user requests for new books
-- =============================================
CREATE TABLE book_requests (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    book_name VARCHAR(500) NOT NULL,
    category_id BIGINT UNSIGNED,
    author_name VARCHAR(255),
    request_date DATE NOT NULL,
    status ENUM('pending', 'fulfilled', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_book_requests_category_id ON book_requests(category_id);
CREATE INDEX idx_book_requests_status ON book_requests(status);
CREATE INDEX idx_book_requests_request_date ON book_requests(request_date);


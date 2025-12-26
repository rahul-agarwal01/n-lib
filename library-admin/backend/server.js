import express from 'express';
import cors from 'cors';
import pool from './db.js';
import { adminCredentials, serverConfig } from './config.js';
import { getCache, CacheKeys } from './cache/index.js';

const app = express();
const cache = getCache();

app.use(cors());
app.use(express.json());

// =============================================
// CACHE ROUTES (for monitoring)
// =============================================
app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await cache.stats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cache/clear', async (req, res) => {
  try {
    await cache.clear();
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// AUTH ROUTES
// =============================================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === adminCredentials.username && password === adminCredentials.password) {
    res.json({ success: true, token: 'admin-token' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// =============================================
// CATEGORIES ROUTES
// =============================================
app.get('/api/categories', async (req, res) => {
  try {
    // Try to select with abbreviation, fallback if column doesn't exist
    let query = 'SELECT id, name, description';
    try {
      // Check if abbreviation column exists
      const [columns] = await pool.query("SHOW COLUMNS FROM categories LIKE 'abbreviation'");
      if (columns.length > 0) {
        query += ', abbreviation';
      }
    } catch (checkError) {
      // If check fails, continue without abbreviation
    }
    query += ' FROM categories ORDER BY name';
    
    const [rows] = await pool.query(query);
    res.json(rows.map(row => ({ 
      ...row, 
      id: String(row.id),
      abbreviation: row.abbreviation || null
    })));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, description, abbreviation } = req.body;
    
    // Check if abbreviation column exists
    let hasAbbreviationColumn = false;
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM categories LIKE 'abbreviation'");
      hasAbbreviationColumn = columns.length > 0;
    } catch (checkError) {
      // Column doesn't exist, continue without it
    }
    
    let query, params;
    if (hasAbbreviationColumn) {
      query = 'INSERT INTO categories (name, description, abbreviation) VALUES (?, ?, ?)';
      params = [name, description, abbreviation || null];
    } else {
      query = 'INSERT INTO categories (name, description) VALUES (?, ?)';
      params = [name, description];
    }
    
    const [result] = await pool.query(query, params);
    res.json({ 
      id: String(result.insertId), 
      name, 
      description, 
      abbreviation: hasAbbreviationColumn ? (abbreviation || null) : null 
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, abbreviation } = req.body;
    
    // Check if abbreviation column exists
    let hasAbbreviationColumn = false;
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM categories LIKE 'abbreviation'");
      hasAbbreviationColumn = columns.length > 0;
    } catch (checkError) {
      // Column doesn't exist, continue without it
    }
    
    let query, params;
    if (hasAbbreviationColumn) {
      query = 'UPDATE categories SET name = ?, description = ?, abbreviation = ? WHERE id = ?';
      params = [name, description, abbreviation || null, id];
    } else {
      query = 'UPDATE categories SET name = ?, description = ? WHERE id = ?';
      params = [name, description, id];
    }
    
    await pool.query(query, params);
    res.json({ 
      id, 
      name, 
      description, 
      abbreviation: hasAbbreviationColumn ? (abbreviation || null) : null 
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// WRITERS ROUTES
// =============================================
app.get('/api/writers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, nationality, bio, image_url FROM writers ORDER BY name');
    res.json(rows.map(row => {
      const writer = {
        id: String(row.id),
        name: row.name,
        nationality: row.nationality || '',
        bio: row.bio || ''
      };
      // Only add imageUrl if it exists and is not null
      if (row.image_url) {
        writer.imageUrl = row.image_url;
      }
      return writer;
    }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/writers', async (req, res) => {
  try {
    const { name, nationality, bio, imageUrl } = req.body;
    
    // Check for duplicate name + nationality combination
    const [duplicateCheck] = await pool.query(
      'SELECT id FROM writers WHERE name = ? AND nationality = ?',
      [name, nationality]
    );
    if (duplicateCheck.length > 0) {
      return res.status(400).json({ 
        error: `A writer named "${name}" from "${nationality}" already exists` 
      });
    }
    
    const [result] = await pool.query(
      'INSERT INTO writers (name, nationality, bio, image_url) VALUES (?, ?, ?, ?)',
      [name, nationality, bio, imageUrl || null]
    );
    res.json({ id: String(result.insertId), name, nationality, bio, imageUrl: imageUrl || undefined });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/writers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nationality, bio, imageUrl } = req.body;
    
    // Check for duplicate name + nationality combination (excluding current writer)
    const [duplicateCheck] = await pool.query(
      'SELECT id FROM writers WHERE name = ? AND nationality = ? AND id != ?',
      [name, nationality, id]
    );
    if (duplicateCheck.length > 0) {
      return res.status(400).json({ 
        error: `A writer named "${name}" from "${nationality}" already exists` 
      });
    }
    
    await pool.query(
      'UPDATE writers SET name = ?, nationality = ?, bio = ?, image_url = ? WHERE id = ?',
      [name, nationality, bio, imageUrl || null, id]
    );
    res.json({ id, name, nationality, bio, imageUrl: imageUrl || undefined });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/writers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM writers WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// USERS ROUTES (with caching)
// =============================================
app.get('/api/users', async (req, res) => {
  try {
    // Try cache first
    const cacheKey = CacheKeys.allUsers();
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Cache miss - fetch from DB
    const [rows] = await pool.query('SELECT id, name, phone, email FROM users ORDER BY name');
    const users = rows.map(row => ({ ...row, id: String(row.id) }));
    
    // Store in cache
    await cache.set(cacheKey, users);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    
    // Check for duplicate phone
    const [phoneCheck] = await pool.query(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    );
    if (phoneCheck.length > 0) {
      return res.status(400).json({ error: 'Phone number already registered to another user' });
    }
    
    // Check for duplicate email
    const [emailCheck] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (emailCheck.length > 0) {
      return res.status(400).json({ error: 'Email already registered to another user' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO users (name, phone, email) VALUES (?, ?, ?)',
      [name, phone, email]
    );
    
    // Invalidate users cache
    await cache.deletePattern(CacheKeys.patterns.allUsers);
    
    res.json({ id: String(result.insertId), name, phone, email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email } = req.body;
    
    // Check for duplicate phone (excluding current user)
    const [phoneCheck] = await pool.query(
      'SELECT id FROM users WHERE phone = ? AND id != ?',
      [phone, id]
    );
    if (phoneCheck.length > 0) {
      return res.status(400).json({ error: 'Phone number already registered to another user' });
    }
    
    // Check for duplicate email (excluding current user)
    const [emailCheck] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, id]
    );
    if (emailCheck.length > 0) {
      return res.status(400).json({ error: 'Email already registered to another user' });
    }
    
    await pool.query(
      'UPDATE users SET name = ?, phone = ?, email = ? WHERE id = ?',
      [name, phone, email, id]
    );
    
    // Invalidate users cache
    await cache.deletePattern(CacheKeys.patterns.allUsers);
    
    res.json({ id, name, phone, email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    
    // Invalidate users cache
    await cache.deletePattern(CacheKeys.patterns.allUsers);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// BOOKS ROUTES (with caching)
// =============================================
app.get('/api/books', async (req, res) => {
  try {
    // Try cache first
    const cacheKey = CacheKeys.allBooks();
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Cache miss - fetch from DB
    const [books] = await pool.query(`
      SELECT b.id, b.title, b.isbn, b.label_number as labelNumber, b.barcode,
             b.publication_year as publicationYear, b.total_copies as totalCopies,
             b.available_copies as availableCopies, b.image_url as imageUrl,
             b.description, b.owner_id as ownerId, b.book_type as bookType,
             u.name as ownerName, u.phone as ownerPhone, u.email as ownerEmail
      FROM books b
      LEFT JOIN users u ON b.owner_id = u.id
      ORDER BY b.title
    `);

    // Get categories and writers for each book
    for (const book of books) {
      const [categories] = await pool.query(
        'SELECT category_id FROM book_categories WHERE book_id = ?',
        [book.id]
      );
      const [writers] = await pool.query(
        'SELECT writer_id FROM book_writers WHERE book_id = ?',
        [book.id]
      );
      book.id = String(book.id);
      book.ownerId = book.ownerId ? String(book.ownerId) : null;
      book.categoryIds = categories.map(c => String(c.category_id));
      book.writerIds = writers.map(w => String(w.writer_id));
    }

    // Store in cache
    await cache.set(cacheKey, books);

    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try cache first
    const cacheKey = CacheKeys.book(id);
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Cache miss - fetch from DB
    const [books] = await pool.query(`
      SELECT b.id, b.title, b.isbn, b.label_number as labelNumber, b.barcode,
             b.publication_year as publicationYear, b.total_copies as totalCopies,
             b.available_copies as availableCopies, b.image_url as imageUrl,
             b.description, b.owner_id as ownerId, b.book_type as bookType,
             u.name as ownerName, u.phone as ownerPhone, u.email as ownerEmail
      FROM books b
      LEFT JOIN users u ON b.owner_id = u.id
      WHERE b.id = ?
    `, [id]);

    if (books.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const book = books[0];
    const [categories] = await pool.query(
      'SELECT category_id FROM book_categories WHERE book_id = ?',
      [id]
    );
    const [writers] = await pool.query(
      'SELECT writer_id FROM book_writers WHERE book_id = ?',
      [id]
    );

    book.id = String(book.id);
    book.ownerId = book.ownerId ? String(book.ownerId) : null;
    book.categoryIds = categories.map(c => String(c.category_id));
    book.writerIds = writers.map(w => String(w.writer_id));

    // Store in cache
    await cache.set(cacheKey, book);

    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/books', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { title, isbn, labelNumber, barcode, publicationYear, totalCopies, 
            availableCopies, imageUrl, description, categoryIds, writerIds, ownerId, bookType } = req.body;

    // Check for duplicate title + writers combination
    if (writerIds && writerIds.length > 0) {
      const sortedWriterIds = [...writerIds].map(id => parseInt(id)).sort((a, b) => a - b);
      
      // Find books with the same title (case-insensitive)
      const [booksWithSameTitle] = await connection.query(
        'SELECT id FROM books WHERE LOWER(TRIM(title)) = LOWER(TRIM(?))',
        [title]
      );
      
      for (const book of booksWithSameTitle) {
        // Get writers for this book
        const [bookWriters] = await connection.query(
          'SELECT writer_id FROM book_writers WHERE book_id = ? ORDER BY writer_id',
          [book.id]
        );
        const bookWriterIds = bookWriters.map(w => w.writer_id).sort((a, b) => a - b);
        
        // Check if writers match
        if (bookWriterIds.length === sortedWriterIds.length &&
            bookWriterIds.every((id, i) => id === sortedWriterIds[i])) {
          await connection.rollback();
          return res.status(400).json({ 
            error: 'A book with this title and writer(s) combination already exists' 
          });
        }
      }
    }

    const [result] = await connection.query(
      `INSERT INTO books (title, isbn, label_number, barcode, publication_year, 
       total_copies, available_copies, image_url, description, owner_id, book_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, isbn, labelNumber, barcode, publicationYear, totalCopies, 
       availableCopies, imageUrl, description, ownerId || null, bookType || 'Paperback']
    );

    const bookId = result.insertId;

    // Insert category relationships
    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await connection.query(
          'INSERT INTO book_categories (book_id, category_id) VALUES (?, ?)',
          [bookId, categoryId]
        );
      }
    }

    // Insert writer relationships
    if (writerIds && writerIds.length > 0) {
      for (const writerId of writerIds) {
        await connection.query(
          'INSERT INTO book_writers (book_id, writer_id) VALUES (?, ?)',
          [bookId, writerId]
        );
      }
    }

    await connection.commit();

    // Invalidate books cache
    await cache.deletePattern(CacheKeys.patterns.allBooks);

    // Fetch owner details if exists
    let ownerName = null, ownerPhone = null, ownerEmail = null;
    if (ownerId) {
      const [owners] = await pool.query('SELECT name, phone, email FROM users WHERE id = ?', [ownerId]);
      if (owners.length > 0) {
        ownerName = owners[0].name;
        ownerPhone = owners[0].phone;
        ownerEmail = owners[0].email;
      }
    }

    res.json({
      id: String(bookId), title, isbn, labelNumber, barcode, publicationYear,
      totalCopies, availableCopies, imageUrl, description,
      categoryIds: categoryIds || [], writerIds: writerIds || [],
      ownerId: ownerId ? String(ownerId) : null, ownerName, ownerPhone, ownerEmail,
      bookType: bookType || 'Paperback'
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.put('/api/books/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { title, isbn, labelNumber, barcode, publicationYear, totalCopies, 
            availableCopies, imageUrl, description, categoryIds, writerIds, ownerId, bookType } = req.body;

    // Check for duplicate title + writers combination (excluding current book)
    if (writerIds && writerIds.length > 0) {
      const sortedWriterIds = [...writerIds].map(wid => parseInt(wid)).sort((a, b) => a - b);
      
      // Find books with the same title (case-insensitive), excluding current book
      const [booksWithSameTitle] = await connection.query(
        'SELECT id FROM books WHERE LOWER(TRIM(title)) = LOWER(TRIM(?)) AND id != ?',
        [title, id]
      );
      
      for (const book of booksWithSameTitle) {
        // Get writers for this book
        const [bookWriters] = await connection.query(
          'SELECT writer_id FROM book_writers WHERE book_id = ? ORDER BY writer_id',
          [book.id]
        );
        const bookWriterIds = bookWriters.map(w => w.writer_id).sort((a, b) => a - b);
        
        // Check if writers match
        if (bookWriterIds.length === sortedWriterIds.length &&
            bookWriterIds.every((wid, i) => wid === sortedWriterIds[i])) {
          await connection.rollback();
          return res.status(400).json({ 
            error: 'A book with this title and writer(s) combination already exists' 
          });
        }
      }
    }

    await connection.query(
      `UPDATE books SET title = ?, isbn = ?, label_number = ?, barcode = ?, 
       publication_year = ?, total_copies = ?, available_copies = ?, 
       image_url = ?, description = ?, owner_id = ?, book_type = ? WHERE id = ?`,
      [title, isbn, labelNumber, barcode, publicationYear, totalCopies, 
       availableCopies, imageUrl, description, ownerId || null, bookType || 'Paperback', id]
    );

    // Update category relationships
    await connection.query('DELETE FROM book_categories WHERE book_id = ?', [id]);
    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await connection.query(
          'INSERT INTO book_categories (book_id, category_id) VALUES (?, ?)',
          [id, categoryId]
        );
      }
    }

    // Update writer relationships
    await connection.query('DELETE FROM book_writers WHERE book_id = ?', [id]);
    if (writerIds && writerIds.length > 0) {
      for (const writerId of writerIds) {
        await connection.query(
          'INSERT INTO book_writers (book_id, writer_id) VALUES (?, ?)',
          [id, writerId]
        );
      }
    }

    await connection.commit();

    // Invalidate books cache
    await cache.deletePattern(CacheKeys.patterns.allBooks);

    // Fetch owner details if exists
    let ownerName = null, ownerPhone = null, ownerEmail = null;
    if (ownerId) {
      const [owners] = await pool.query('SELECT name, phone, email FROM users WHERE id = ?', [ownerId]);
      if (owners.length > 0) {
        ownerName = owners[0].name;
        ownerPhone = owners[0].phone;
        ownerEmail = owners[0].email;
      }
    }

    res.json({
      id, title, isbn, labelNumber, barcode, publicationYear,
      totalCopies, availableCopies, imageUrl, description,
      categoryIds: categoryIds || [], writerIds: writerIds || [],
      ownerId: ownerId ? String(ownerId) : null, ownerName, ownerPhone, ownerEmail,
      bookType: bookType || 'Paperback'
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM books WHERE id = ?', [id]);
    
    // Invalidate books cache
    await cache.deletePattern(CacheKeys.patterns.allBooks);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// BOOK CIRCULATION (ISSUES) ROUTES
// =============================================
app.get('/api/issues', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT bc.id, bc.book_id as bookId, bc.user_id as userId,
             bc.issue_date as issueDate, bc.due_date as dueDate,
             bc.return_date as returnDate, bc.status,
             u.name as userName, u.phone as userPhone, u.email as userEmail
      FROM books_circulation bc
      JOIN users u ON bc.user_id = u.id
      ORDER BY bc.issue_date DESC
    `);
    res.json(rows.map(row => ({
      ...row,
      id: String(row.id),
      bookId: String(row.bookId),
      userId: String(row.userId),
      issueDate: row.issueDate?.toISOString().split('T')[0],
      dueDate: row.dueDate?.toISOString().split('T')[0],
      returnDate: row.returnDate?.toISOString().split('T')[0] || null
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/issues', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { bookId, userId, issueDate, dueDate } = req.body;

    // Insert circulation record
    const [result] = await connection.query(
      `INSERT INTO books_circulation (book_id, user_id, issue_date, due_date, status) 
       VALUES (?, ?, ?, ?, 'issued')`,
      [bookId, userId, issueDate, dueDate]
    );

    // Decrement available copies
    await connection.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = ? AND available_copies > 0',
      [bookId]
    );

    await connection.commit();

    // Get user details
    const [users] = await pool.query('SELECT name, phone, email FROM users WHERE id = ?', [userId]);
    const user = users[0] || {};

    res.json({
      id: String(result.insertId),
      bookId: String(bookId),
      userId: String(userId),
      userName: user.name,
      userPhone: user.phone,
      userEmail: user.email,
      issueDate,
      dueDate,
      returnDate: null,
      status: 'issued'
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.put('/api/issues/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { returnDate, status, bookId } = req.body;

    await connection.query(
      'UPDATE books_circulation SET return_date = ?, status = ? WHERE id = ?',
      [returnDate, status, id]
    );

    // If returning, increment available copies
    if (status === 'returned' && bookId) {
      await connection.query(
        'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
        [bookId]
      );
    }

    await connection.commit();

    // Get full issue details
    const [issues] = await pool.query(`
      SELECT bc.id, bc.book_id as bookId, bc.user_id as userId,
             bc.issue_date as issueDate, bc.due_date as dueDate,
             bc.return_date as returnDate, bc.status,
             u.name as userName, u.phone as userPhone, u.email as userEmail
      FROM books_circulation bc
      JOIN users u ON bc.user_id = u.id
      WHERE bc.id = ?
    `, [id]);

    const issue = issues[0];
    res.json({
      id: String(issue.id),
      bookId: String(issue.bookId),
      userId: String(issue.userId),
      userName: issue.userName,
      userPhone: issue.userPhone,
      userEmail: issue.userEmail,
      issueDate: issue.issueDate?.toISOString().split('T')[0],
      dueDate: issue.dueDate?.toISOString().split('T')[0],
      returnDate: issue.returnDate?.toISOString().split('T')[0] || null,
      status: issue.status
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// =============================================
// BOOK REQUESTS ROUTES
// =============================================
app.get('/api/book-requests', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT br.id, br.book_name as bookName, br.category_id as categoryId,
             br.author_name as authorName, br.request_date as requestDate, br.status,
             c.name as categoryName
      FROM book_requests br
      LEFT JOIN categories c ON br.category_id = c.id
      ORDER BY br.request_date DESC
    `);
    res.json(rows.map(row => ({
      ...row,
      id: String(row.id),
      categoryId: row.categoryId ? String(row.categoryId) : null,
      requestDate: row.requestDate?.toISOString().split('T')[0]
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/book-requests', async (req, res) => {
  try {
    const { bookName, categoryId, authorName, requestDate } = req.body;
    const [result] = await pool.query(
      `INSERT INTO book_requests (book_name, category_id, author_name, request_date, status) 
       VALUES (?, ?, ?, ?, 'pending')`,
      [bookName, categoryId || null, authorName || null, requestDate]
    );

    // Get category name if exists
    let categoryName = null;
    if (categoryId) {
      const [categories] = await pool.query('SELECT name FROM categories WHERE id = ?', [categoryId]);
      categoryName = categories[0]?.name || null;
    }

    res.json({
      id: String(result.insertId),
      bookName,
      categoryId: categoryId ? String(categoryId) : null,
      categoryName,
      authorName: authorName || null,
      requestDate,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/book-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { bookName, categoryId, authorName, requestDate, status } = req.body;
    
    await pool.query(
      `UPDATE book_requests SET book_name = ?, category_id = ?, author_name = ?, 
       request_date = ?, status = ? WHERE id = ?`,
      [bookName, categoryId || null, authorName || null, requestDate, status, id]
    );

    // Get category name if exists
    let categoryName = null;
    if (categoryId) {
      const [categories] = await pool.query('SELECT name FROM categories WHERE id = ?', [categoryId]);
      categoryName = categories[0]?.name || null;
    }

    res.json({
      id,
      bookName,
      categoryId: categoryId ? String(categoryId) : null,
      categoryName,
      authorName: authorName || null,
      requestDate,
      status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/book-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM book_requests WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server - listen on all interfaces
app.listen(serverConfig.port, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${serverConfig.port}`);
});


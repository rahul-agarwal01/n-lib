import type { Book, Category, Writer, User, BookIssue, BookRequest } from '../App';
import { getCache, CacheKeys } from './cache';
import { apiConfig } from '../config';

const API_BASE_URL = apiConfig.baseUrl;

// Get cache instance
const cache = getCache();

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// ===== BOOKS API =====
export const booksApi = {
  getAll: async (): Promise<Book[]> => {
    const cacheKey = CacheKeys.allBooks();
    const cached = cache.get<Book[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const books = await fetchWithAuth(`${API_BASE_URL}/books`);
    cache.set(cacheKey, books);
    return books;
  },

  getById: async (id: string): Promise<Book> => {
    const cacheKey = CacheKeys.book(id);
    const cached = cache.get<Book>(cacheKey);
    if (cached) {
      return cached;
    }

    const book = await fetchWithAuth(`${API_BASE_URL}/books/${id}`);
    cache.set(cacheKey, book);
    return book;
  },

  create: async (book: Book): Promise<Book> => {
    const created = await fetchWithAuth(`${API_BASE_URL}/books`, {
      method: 'POST',
      body: JSON.stringify(book),
    });
    
    // Add to cached list
    cache.addToArray(CacheKeys.allBooks(), created);
    // Cache individual book
    cache.set(CacheKeys.book(created.id), created);
    
    return created;
  },

  update: async (id: string, book: Book): Promise<Book> => {
    const updated = await fetchWithAuth(`${API_BASE_URL}/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(book),
    });
    
    // Update in cached list
    cache.updateInArray(CacheKeys.allBooks(), updated);
    // Update individual book cache
    cache.set(CacheKeys.book(id), updated);
    
    return updated;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const result = await fetchWithAuth(`${API_BASE_URL}/books/${id}`, {
      method: 'DELETE',
    });
    
    // Remove from cached list
    cache.removeFromArray<Book>(CacheKeys.allBooks(), id);
    // Remove individual book cache
    cache.delete(CacheKeys.book(id));
    
    return result;
  },
};

// ===== CATEGORIES API =====
export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const cacheKey = CacheKeys.allCategories();
    const cached = cache.get<Category[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const categories = await fetchWithAuth(`${API_BASE_URL}/categories`);
    cache.set(cacheKey, categories);
    return categories;
  },

  create: async (category: Category): Promise<Category> => {
    const created = await fetchWithAuth(`${API_BASE_URL}/categories`, {
      method: 'POST',
      body: JSON.stringify(category),
    });
    
    // Add to cached list
    cache.addToArray(CacheKeys.allCategories(), created);
    cache.set(CacheKeys.category(created.id), created);
    
    return created;
  },

  update: async (id: string, category: Category): Promise<Category> => {
    const updated = await fetchWithAuth(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
    
    // Update in cached list
    cache.updateInArray(CacheKeys.allCategories(), updated);
    cache.set(CacheKeys.category(id), updated);
    
    return updated;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const result = await fetchWithAuth(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    
    // Remove from cached list
    cache.removeFromArray<Category>(CacheKeys.allCategories(), id);
    cache.delete(CacheKeys.category(id));
    
    return result;
  },
};

// ===== WRITERS API =====
export const writersApi = {
  getAll: async (): Promise<Writer[]> => {
    const cacheKey = CacheKeys.allWriters();
    const cached = cache.get<Writer[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const writers = await fetchWithAuth(`${API_BASE_URL}/writers`);
    cache.set(cacheKey, writers);
    return writers;
  },

  create: async (writer: Writer): Promise<Writer> => {
    const created = await fetchWithAuth(`${API_BASE_URL}/writers`, {
      method: 'POST',
      body: JSON.stringify(writer),
    });
    
    // Add to cached list
    cache.addToArray(CacheKeys.allWriters(), created);
    cache.set(CacheKeys.writer(created.id), created);
    
    return created;
  },

  update: async (id: string, writer: Writer): Promise<Writer> => {
    const updated = await fetchWithAuth(`${API_BASE_URL}/writers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(writer),
    });
    
    // Update in cached list
    cache.updateInArray(CacheKeys.allWriters(), updated);
    cache.set(CacheKeys.writer(id), updated);
    
    return updated;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const result = await fetchWithAuth(`${API_BASE_URL}/writers/${id}`, {
      method: 'DELETE',
    });
    
    // Remove from cached list
    cache.removeFromArray<Writer>(CacheKeys.allWriters(), id);
    cache.delete(CacheKeys.writer(id));
    
    return result;
  },
};

// ===== USERS API =====
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const cacheKey = CacheKeys.allUsers();
    const cached = cache.get<User[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const users = await fetchWithAuth(`${API_BASE_URL}/users`);
    cache.set(cacheKey, users);
    return users;
  },

  create: async (user: User): Promise<User> => {
    const created = await fetchWithAuth(`${API_BASE_URL}/users`, {
      method: 'POST',
      body: JSON.stringify(user),
    });
    
    // Add to cached list
    cache.addToArray(CacheKeys.allUsers(), created);
    cache.set(CacheKeys.user(created.id), created);
    
    return created;
  },

  update: async (id: string, user: User): Promise<User> => {
    const updated = await fetchWithAuth(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
    
    // Update in cached list
    cache.updateInArray(CacheKeys.allUsers(), updated);
    cache.set(CacheKeys.user(id), updated);
    
    return updated;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const result = await fetchWithAuth(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    
    // Remove from cached list
    cache.removeFromArray<User>(CacheKeys.allUsers(), id);
    cache.delete(CacheKeys.user(id));
    
    return result;
  },
};

// ===== BOOK ISSUES API =====
export const issuesApi = {
  getAll: async (): Promise<BookIssue[]> => {
    const cacheKey = CacheKeys.allIssues();
    const cached = cache.get<BookIssue[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const issues = await fetchWithAuth(`${API_BASE_URL}/issues`);
    cache.set(cacheKey, issues);
    return issues;
  },

  create: async (issue: BookIssue): Promise<BookIssue> => {
    const created = await fetchWithAuth(`${API_BASE_URL}/issues`, {
      method: 'POST',
      body: JSON.stringify(issue),
    });
    
    // Add to cached issues list
    cache.addToArray(CacheKeys.allIssues(), created);
    
    // Update only the specific book's availableCopies (decrement on issue)
    updateBookAvailableCopies(created.bookId, -1);
    
    return created;
  },

  update: async (id: string, issue: BookIssue): Promise<BookIssue> => {
    // Get current issue to check status change
    const currentIssue = cache.get<BookIssue[]>(CacheKeys.allIssues())?.find(i => i.id === id);
    
    const updated = await fetchWithAuth(`${API_BASE_URL}/issues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(issue),
    });
    
    // Update in cached issues list
    cache.updateInArray(CacheKeys.allIssues(), updated);
    
    // If status changed to 'returned', increment availableCopies
    if (currentIssue?.status === 'issued' && updated.status === 'returned') {
      updateBookAvailableCopies(updated.bookId, 1);
    }
    
    return updated;
  },
};

/**
 * Helper to update a specific book's availableCopies in cache
 */
function updateBookAvailableCopies(bookId: string, delta: number): void {
  // Update in all books list
  const allBooks = cache.get<Book[]>(CacheKeys.allBooks());
  if (allBooks) {
    const updatedBooks = allBooks.map(book => {
      if (book.id === bookId) {
        return { ...book, availableCopies: book.availableCopies + delta };
      }
      return book;
    });
    cache.set(CacheKeys.allBooks(), updatedBooks);
  }
  
  // Update individual book cache
  const book = cache.get<Book>(CacheKeys.book(bookId));
  if (book) {
    cache.set(CacheKeys.book(bookId), { ...book, availableCopies: book.availableCopies + delta });
  }
}

// ===== BOOK REQUESTS API =====
export const bookRequestsApi = {
  getAll: async (): Promise<BookRequest[]> => {
    const cacheKey = CacheKeys.allBookRequests();
    const cached = cache.get<BookRequest[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const requests = await fetchWithAuth(`${API_BASE_URL}/book-requests`);
    cache.set(cacheKey, requests);
    return requests;
  },

  create: async (request: BookRequest): Promise<BookRequest> => {
    const created = await fetchWithAuth(`${API_BASE_URL}/book-requests`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    // Add to cached list
    cache.addToArray(CacheKeys.allBookRequests(), created);
    
    return created;
  },

  update: async (id: string, request: BookRequest): Promise<BookRequest> => {
    const updated = await fetchWithAuth(`${API_BASE_URL}/book-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
    
    // Update in cached list
    cache.updateInArray(CacheKeys.allBookRequests(), updated);
    
    return updated;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const result = await fetchWithAuth(`${API_BASE_URL}/book-requests/${id}`, {
      method: 'DELETE',
    });
    
    // Remove from cached list
    cache.removeFromArray<BookRequest>(CacheKeys.allBookRequests(), id);
    
    return result;
  },
};

// ===== CACHE UTILITIES =====
export const cacheUtils = {
  getStats: () => cache.stats(),
  clearAll: () => cache.clear(),
  clearBooks: () => cache.deletePattern(CacheKeys.patterns.allBooks),
  clearUsers: () => cache.deletePattern(CacheKeys.patterns.allUsers),
  clearCategories: () => cache.deletePattern(CacheKeys.patterns.allCategories),
  clearWriters: () => cache.deletePattern(CacheKeys.patterns.allWriters),
  clearIssues: () => cache.deletePattern(CacheKeys.patterns.allIssues),
  clearBookRequests: () => cache.deletePattern(CacheKeys.patterns.allBookRequests),
};

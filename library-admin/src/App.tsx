import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { Categories } from './components/Categories';
import { Writers } from './components/Writers';
import { Users } from './components/Users';
import { Books } from './components/Books';
import { BookDetail } from './components/BookDetail';
import { IssueBook } from './components/IssueBook';
import { ReceiveBook } from './components/ReceiveBook';
import { SearchBooks } from './components/SearchBooks';
import { cacheUtils } from './utils/api';
import { apiConfig } from './config';

export type Category = {
  id: string;
  name: string;
  description: string;
  abbreviation?: string;
};

export type Writer = {
  id: string;
  name: string;
  nationality: string;
  bio: string;
  imageUrl?: string;
};

export type User = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

export type Book = {
  id: string;
  title: string;
  isbn: string;
  labelNumber: string;
  barcode?: string;
  publicationYear: number;
  totalCopies: number;
  availableCopies: number;
  imageUrl: string;
  description: string;
  categoryIds: string[];
  writerIds: string[];
  ownerId?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  bookType?: string;
};

export type BookIssue = {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'issued' | 'returned';
};

export type BookRequest = {
  id: string;
  bookName: string;
  categoryId: string | null;
  categoryName: string;
  authorName?: string;
  requestDate: string;
  status: 'pending' | 'fulfilled' | 'rejected';
};

type Page = 
  | { type: 'login' }
  | { type: 'dashboard' }
  | { type: 'categories' }
  | { type: 'writers' }
  | { type: 'users' }
  | { type: 'books' }
  | { type: 'book-detail'; bookId: string }
  | { type: 'issue-book' }
  | { type: 'receive-book' }
  | { type: 'search'; writerId?: string; categoryId?: string };

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>({ type: 'search' });

  useEffect(() => {
    const auth = localStorage.getItem('libraryAdminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      setCurrentPage({ type: 'dashboard' });
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('libraryAdminAuth', 'true');
    setCurrentPage({ type: 'dashboard' });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('libraryAdminAuth');
    setCurrentPage({ type: 'search' });
  };

  const handleRefreshCache = async () => {
    try {
      // Clear frontend cache
      cacheUtils.clearAll();
      
      // Clear backend cache
      const response = await fetch(`${apiConfig.baseUrl}/cache/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Reload the page to refresh all data
        window.location.reload();
      } else {
        alert('Failed to clear cache. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Error clearing cache. Please try again.');
    }
  };

  // Allow public access to search and book-detail pages
  const isPublicPage = currentPage.type === 'search' || currentPage.type === 'book-detail';

  if (!isAuthenticated && !isPublicPage) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <button 
                onClick={() => setCurrentPage(isAuthenticated ? { type: 'dashboard' } : { type: 'search' })}
                className="text-blue-600"
              >
                Library Admin
              </button>
              {isAuthenticated ? (
                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentPage({ type: 'dashboard' })}
                    className={currentPage.type === 'dashboard' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentPage({ type: 'categories' })}
                    className={currentPage.type === 'categories' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}
                  >
                    Categories
                  </button>
                  <button
                    onClick={() => setCurrentPage({ type: 'writers' })}
                    className={currentPage.type === 'writers' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}
                  >
                    Writers
                  </button>
                  <button
                    onClick={() => setCurrentPage({ type: 'users' })}
                    className={currentPage.type === 'users' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}
                  >
                    Users
                  </button>
                  <button
                    onClick={() => setCurrentPage({ type: 'books' })}
                    className={currentPage.type === 'books' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}
                  >
                    Books
                  </button>
                  <button
                    onClick={() => setCurrentPage({ type: 'search' })}
                    className={currentPage.type === 'search' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}
                  >
                    Search
                  </button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentPage({ type: 'search' })}
                    className={currentPage.type === 'search' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}
                  >
                    Search Books
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={handleRefreshCache}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    title="Refresh Cache"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setCurrentPage({ type: 'login' })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Admin Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage.type === 'dashboard' && (
          <Dashboard onNavigate={setCurrentPage} />
        )}
        {currentPage.type === 'categories' && (
          <Categories 
            onNavigateToCategory={(categoryId) => setCurrentPage({ type: 'search', categoryId })}
          />
        )}
        {currentPage.type === 'writers' && <Writers />}
        {currentPage.type === 'users' && <Users />}
        {currentPage.type === 'books' && (
          <Books onViewBook={(bookId) => setCurrentPage({ type: 'book-detail', bookId })} />
        )}
        {currentPage.type === 'book-detail' && (
          <BookDetail
            bookId={currentPage.bookId}
            onBack={() => setCurrentPage(isAuthenticated ? { type: 'books' } : { type: 'search' })}
            onNavigateToSearch={(writerId, categoryId) => 
              setCurrentPage({ type: 'search', writerId, categoryId })
            }
          />
        )}
        {currentPage.type === 'issue-book' && (
          <IssueBook onBack={() => setCurrentPage({ type: 'dashboard' })} />
        )}
        {currentPage.type === 'receive-book' && (
          <ReceiveBook onBack={() => setCurrentPage({ type: 'dashboard' })} />
        )}
        {currentPage.type === 'search' && (
          <SearchBooks 
            onViewBook={(bookId) => setCurrentPage({ type: 'book-detail', bookId })} 
            writerId={currentPage.writerId}
            categoryId={currentPage.categoryId}
            onNavigateToCategory={(categoryId) => 
              setCurrentPage({ type: 'search', categoryId })
            }
            onNavigateToWriter={(writerId) => 
              setCurrentPage({ type: 'search', writerId })
            }
          />
        )}
      </main>
    </div>
  );
}
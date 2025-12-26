import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Calendar, Hash, Users, FolderTree, CheckCircle, Tag } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MarkdownContent } from './MarkdownContent';
import type { Book, Category, Writer, BookIssue } from '../App';
import { booksApi, categoriesApi, writersApi, issuesApi } from '../utils/api';

type BookDetailProps = {
  bookId: string;
  onBack: () => void;
  onNavigateToSearch?: (writerId?: string, categoryId?: string) => void;
};

export function BookDetail({ bookId, onBack, onNavigateToSearch }: BookDetailProps) {
  const [book, setBook] = useState<Book | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [issueHistory, setIssueHistory] = useState<BookIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookData();
  }, [bookId]);

  const loadBookData = async () => {
    try {
      setLoading(true);
      const [booksData, categoriesData, writersData, issuesData] = await Promise.all([
        booksApi.getAll(),
        categoriesApi.getAll(),
        writersApi.getAll(),
        issuesApi.getAll(),
      ]);

      const foundBook = booksData.find(b => b.id === bookId);
      setBook(foundBook || null);
      setCategories(categoriesData);
      setWriters(writersData);

      const bookIssues = issuesData
        .filter(issue => issue.bookId === bookId)
        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
      setIssueHistory(bookIssues);
    } catch (error) {
      console.error('Error loading book details:', error);
      alert('Failed to load book details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveBook = async (issueId: string) => {
    try {
      // Get all issues and books
      const [issues, books] = await Promise.all([
        issuesApi.getAll(),
        booksApi.getAll(),
      ]);

      // Update issue status
      const issueToUpdate = issues.find(issue => issue.id === issueId);
      if (issueToUpdate) {
        const updatedIssue = {
          ...issueToUpdate,
          status: 'returned' as const,
          returnDate: new Date().toISOString(),
        };
        await issuesApi.update(issueId, updatedIssue);
      }

      // Update book available copies
      const bookToUpdate = books.find(b => b.id === bookId);
      if (bookToUpdate) {
        const updatedBook = {
          ...bookToUpdate,
          availableCopies: bookToUpdate.availableCopies + 1,
        };
        await booksApi.update(bookId, updatedBook);
      }

      // Reload data
      await loadBookData();
    } catch (error) {
      console.error('Error receiving book:', error);
      alert('Failed to process book return. Please try again.');
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (!book) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Book not found</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const bookCategories = book.categoryIds
    .map(id => categories.find(c => c.id === id))
    .filter(Boolean) as Category[];

  const bookWriters = book.writerIds
    .map(id => writers.find(w => w.id === id))
    .filter(Boolean) as Writer[];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:underline mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Search
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {/* Book Cover */}
          <div className="md:col-span-1">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
              {book.imageUrl ? (
                <ImageWithFallback
                  src={book.imageUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-24 h-24 text-gray-300" />
                </div>
              )}
            </div>
          </div>

          {/* Book Details */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-gray-900 mb-2">{book.title}</h1>
              <div className="text-gray-600">
                <MarkdownContent content={book.description} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-600">ISBN</p>
                  <p className="text-gray-900">{book.isbn}</p>
                </div>
              </div>

              {book.labelNumber && (
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-600">Rack Label</p>
                    <p className="text-gray-900">{book.labelNumber}</p>
                  </div>
                </div>
              )}

              {book.barcode && (
                <div className="flex items-start gap-3">
                  <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-600">Chip ID</p>
                    <p className="text-gray-900">{book.barcode}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-600">Publication Year</p>
                  <p className="text-gray-900">{book.publicationYear}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-600">Book Type</p>
                  <p className="text-gray-900">{book.bookType || 'Paperback'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-600">Total Copies</p>
                  <p className="text-gray-900">{book.totalCopies}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-600">Available Copies</p>
                  <p className="text-gray-900">{book.availableCopies}</p>
                </div>
              </div>
            </div>

            {bookWriters.length > 0 && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-600 mb-2">Writers</p>
                  <div className="flex flex-wrap gap-2">
                    {bookWriters.map((writer) => (
                      <button
                        key={writer.id}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 cursor-pointer transition-colors"
                        onClick={() => onNavigateToSearch?.(writer.id)}
                      >
                        {writer.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {bookCategories.length > 0 && (
              <div className="flex items-start gap-3">
                <FolderTree className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-600 mb-2">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {bookCategories.map((category) => (
                      <button
                        key={category.id}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 cursor-pointer transition-colors"
                        onClick={() => onNavigateToSearch?.(undefined, category.id)}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Issue History */}
        <div className="border-t border-gray-200 p-6">
          <h2 className="text-gray-900 mb-4">Issue History</h2>
          {issueHistory.length === 0 ? (
            <p className="text-gray-500">No issue history for this book</p>
          ) : (
            <div className="space-y-3">
              {issueHistory.map((issue) => (
                <div
                  key={issue.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900 mb-1">{issue.userName}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-gray-600">
                        <div>
                          <span className="block">User ID: {issue.userId}</span>
                        </div>
                        <div>
                          <span className="block">Phone: {issue.userPhone}</span>
                        </div>
                        <div>
                          <span className="block">Email: {issue.userEmail}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-gray-600">
                        <span>Issued: {formatDate(issue.issueDate)}</span>
                        <span className={isOverdue(issue.dueDate) && issue.status === 'issued' ? 'text-red-600' : ''}>
                          Due: {formatDate(issue.dueDate)}
                          {isOverdue(issue.dueDate) && issue.status === 'issued' && ' (Overdue)'}
                        </span>
                        {issue.returnDate && (
                          <span>Returned: {formatDate(issue.returnDate)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span
                        className={`px-3 py-1 rounded-full ${
                          issue.status === 'issued'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {issue.status === 'issued' ? 'Issued' : 'Returned'}
                      </span>
                      {issue.status === 'issued' && (
                        <button
                          onClick={() => handleReceiveBook(issue.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Receive
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
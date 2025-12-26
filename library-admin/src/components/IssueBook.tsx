import { useState, useEffect } from 'react';
import { ArrowLeft, Search, User } from 'lucide-react';
import type { Book, BookIssue, User as UserType } from '../App';
import { booksApi, usersApi, issuesApi } from '../utils/api';

type IssueBookProps = {
  onBack: () => void;
};

export function IssueBook({ onBack }: IssueBookProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [localUsers, setLocalUsers] = useState<UserType[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userDetails, setUserDetails] = useState<{
    userId: string;
    name: string;
    phone: string;
    email: string;
  } | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooks();
    loadLocalUsers();
    // Set default due date to 2 weeks from now
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    setDueDate(twoWeeksFromNow.toISOString().split('T')[0]);
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const allBooks = await booksApi.getAll();
      // Only show books with available copies
      const availableBooks = allBooks.filter(book => book.availableCopies > 0);
      setBooks(availableBooks);
    } catch (error) {
      console.error('Error loading books:', error);
      alert('Failed to load books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadLocalUsers = async () => {
    try {
      const allUsers = await usersApi.getAll();
      setLocalUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSelectLocalUser = (user: UserType) => {
    setUserDetails({
      userId: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
    });
    setUserSearchQuery('');
    setShowUserDropdown(false);
  };

  const filteredLocalUsers = localUsers.filter(user => {
    const query = userSearchQuery.toLowerCase().trim();
    if (query.length < 3) return false;
    
    return (
      user.name.toLowerCase().includes(query) ||
      user.phone.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const filteredBooks = books.filter(book => {
    const query = bookSearchQuery.toLowerCase().trim();
    if (query.length < 3) return false;
    
    return (
      book.title.toLowerCase().includes(query) ||
      book.isbn.toLowerCase().includes(query) ||
      (book.labelNumber && book.labelNumber.toLowerCase().includes(query))
    );
  });

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setBookSearchQuery('');
    setShowBookDropdown(false);
  };

  const handleIssueBook = async () => {
    if (!selectedBook || !userDetails) {
      return;
    }

    try {
      // Create new issue - backend handles availableCopies decrement
      const newIssue: BookIssue = {
        id: Date.now().toString(),
        bookId: selectedBook.id,
        userId: userDetails.userId,
        userName: userDetails.name,
        userPhone: userDetails.phone,
        userEmail: userDetails.email,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate,
        status: 'issued',
      };

      await issuesApi.create(newIssue);

      // Show success message and reset
      setSuccessMessage(`Book "${selectedBook.title}" issued to ${userDetails.name}`);
      setSelectedBook(null);
      setUserDetails(null);
      setUserSearchQuery('');
      setBookSearchQuery('');
      await loadBooks();

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error issuing book:', error);
      alert('Failed to issue book. Please try again.');
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:underline mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      <h1 className="text-gray-900 mb-6">Issue Book</h1>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Details Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-gray-900 mb-4">User Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Search Users</label>
              <div className="relative">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        setShowUserDropdown(true);
                      }}
                      onFocus={() => setShowUserDropdown(true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search by name, phone, or email..."
                    />
                    {showUserDropdown && filteredLocalUsers.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredLocalUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleSelectLocalUser(user)}
                            className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                          >
                            <p className="text-gray-900">{user.name}</p>
                            <p className="text-gray-600">{user.phone} | {user.email}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mt-1">
                {userSearchQuery.trim().length > 0 && userSearchQuery.trim().length < 3 
                  ? 'Type at least 3 characters to search' 
                  : 'Search and select a user from the database'}
              </p>
            </div>

            {userDetails && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-900">{userDetails.name}</p>
                    <p className="text-gray-600">ID: {userDetails.userId}</p>
                  </div>
                </div>
                <div className="space-y-1 text-gray-600">
                  <p>Phone: {userDetails.phone}</p>
                  <p>Email: {userDetails.email}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-700 mb-2">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-gray-600 mt-1">Default: 2 weeks from today</p>
            </div>
          </div>
        </div>

        {/* Book Selection Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-gray-900 mb-4">Select Book</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Search Books</label>
              <div className="relative">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={bookSearchQuery}
                      onChange={(e) => {
                        setBookSearchQuery(e.target.value);
                        setShowBookDropdown(true);
                      }}
                      onFocus={() => setShowBookDropdown(true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search by title, ISBN, or label..."
                    />
                    {showBookDropdown && filteredBooks.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredBooks.map((book) => (
                          <button
                            key={book.id}
                            onClick={() => handleSelectBook(book)}
                            className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                          >
                            <p className="text-gray-900">{book.title}</p>
                            <p className="text-gray-600">
                              ISBN: {book.isbn} {book.labelNumber && `| Label: ${book.labelNumber}`} | Available: {book.availableCopies}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mt-1">
                {bookSearchQuery.trim().length > 0 && bookSearchQuery.trim().length < 3 
                  ? 'Type at least 3 characters to search' 
                  : 'Search and select a book from the database'}
              </p>
            </div>

            {selectedBook && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-900">{selectedBook.title}</p>
                    <p className="text-gray-600">ISBN: {selectedBook.isbn}</p>
                  </div>
                </div>
                <div className="space-y-1 text-gray-600">
                  <p>Label: {selectedBook.labelNumber}</p>
                  <p>Available Copies: {selectedBook.availableCopies}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Issue Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleIssueBook}
          disabled={!selectedBook || !userDetails}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Issue Book
        </button>
      </div>
    </div>
  );
}
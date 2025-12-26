import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import type { BookIssue } from '../App';
import { booksApi, issuesApi } from '../utils/api';

type ReceiveBookProps = {
  onBack: () => void;
};

export function ReceiveBook({ onBack }: ReceiveBookProps) {
  const [issuedBooks, setIssuedBooks] = useState<(BookIssue & { bookTitle: string, bookIsbn: string, bookLabelNumber: string })[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIssuedBooks();
  }, []);

  const loadIssuedBooks = async () => {
    try {
      setLoading(true);
      const [issues, books] = await Promise.all([
        issuesApi.getAll(),
        booksApi.getAll(),
      ]);

      const issued = issues
        .filter(issue => issue.status === 'issued')
        .map(issue => {
          const book = books.find(b => b.id === issue.bookId);
          return {
            ...issue,
            bookTitle: book?.title || 'Unknown Book',
            bookIsbn: book?.isbn || '',
            bookLabelNumber: book?.labelNumber || '',
          };
        })
        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

      setIssuedBooks(issued);
    } catch (error) {
      console.error('Error loading issued books:', error);
      alert('Failed to load issued books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveBook = async (issueId: string, bookId: string) => {
    try {
      const returnedBook = issuedBooks.find(b => b.id === issueId);
      
      // Update issue status - backend handles availableCopies increment
      await issuesApi.update(issueId, {
        status: 'returned',
        returnDate: new Date().toISOString().split('T')[0],
        bookId: bookId, // Backend needs this to update availableCopies
      });

      // Show success message and reload
      setSuccessMessage(`"${returnedBook?.bookTitle}" has been marked as returned`);
      await loadIssuedBooks();

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error receiving book:', error);
      alert('Failed to process book return. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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

      <h1 className="text-gray-900 mb-6">Receive Book</h1>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading...
          </div>
        ) : issuedBooks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No books currently issued
          </div>
        ) : (
          <div className="divide-y">
            {issuedBooks.map((issue) => (
              <div
                key={issue.id}
                className="p-4 hover:bg-gray-50 flex items-start justify-between"
              >
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-2">{issue.bookTitle}</h3>
                  <div className="flex flex-wrap gap-4 text-gray-600 mb-2">
                    <span>ISBN: {issue.bookIsbn}</span>
                    {issue.bookLabelNumber && <span>Label: {issue.bookLabelNumber}</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-600 mb-2">
                    <div>
                      <span className="block">Issued to: {issue.userName}</span>
                      <span className="block">User ID: {issue.userId}</span>
                    </div>
                    <div>
                      <span className="block">Phone: {issue.userPhone}</span>
                      <span className="block">Email: {issue.userEmail}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-gray-600">
                    <span>Issued: {formatDate(issue.issueDate)}</span>
                    <span className={isOverdue(issue.dueDate) ? 'text-red-600' : ''}>
                      Due: {formatDate(issue.dueDate)}
                      {isOverdue(issue.dueDate) && ' (Overdue)'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleReceiveBook(issue.id, issue.bookId)}
                  className="ml-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Receive
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {issuedBooks.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900">
            Total Issued Books: {issuedBooks.length}
          </p>
          <p className="text-blue-700">
            Overdue Books: {issuedBooks.filter(b => isOverdue(b.dueDate)).length}
          </p>
        </div>
      )}
    </div>
  );
}
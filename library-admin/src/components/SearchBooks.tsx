import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, BookOpen, BookPlus } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MarkdownContent } from './MarkdownContent';
import { RequestBook } from './RequestBook';
import type { Book, Category, Writer } from '../App';
import { booksApi, categoriesApi, writersApi } from '../utils/api';

type SearchBooksProps = {
  onViewBook: (bookId: string) => void;
  writerId?: string;
  categoryId?: string;
  onNavigateToCategory?: (categoryId: string) => void;
  onNavigateToWriter?: (writerId: string) => void;
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function SearchBooks({ onViewBook, writerId, categoryId, onNavigateToCategory, onNavigateToWriter }: SearchBooksProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Set search query to category name when categoryId is provided (only on initial load)
  useEffect(() => {
    if (categoryId && categories.length > 0) {
      const category = categories.find(c => c.id === categoryId);
      if (category && searchQuery === '') {
        setSearchQuery(category.name);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, categories]);

  // Clear category filter if user changes the search query
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    // If user clears or changes the search, we'll let them search freely
    // The category filter will still apply if categoryId exists, but search will work within it
  };

  // Debounce search query - wait 300ms after user stops typing
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Create lookup maps for O(1) access instead of O(n) array.find()
  const writersMap = useMemo(() => {
    const map = new Map<string, Writer>();
    writers.forEach(w => map.set(w.id, w));
    return map;
  }, [writers]);

  const categoriesMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  // Pre-build search index for faster searching
  const searchIndex = useMemo(() => {
    return books.map(book => {
      const writerNames = book.writerIds
        .map(id => writersMap.get(id)?.name?.toLowerCase() || '')
        .join(' ');
      const categoryNames = book.categoryIds
        .map(id => categoriesMap.get(id)?.name?.toLowerCase() || '')
        .join(' ');
      
      return {
        book,
        searchText: `${book.title.toLowerCase()} ${book.isbn.toLowerCase()} ${writerNames} ${categoryNames}`
      };
    });
  }, [books, writersMap, categoriesMap]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [booksData, categoriesData, writersData] = await Promise.all([
        booksApi.getAll(),
        categoriesApi.getAll(),
        writersApi.getAll(),
      ]);

      setBooks(booksData);
      setCategories(categoriesData);
      setWriters(writersData);
    } catch (error) {
      console.error('Error loading search data:', error);
      alert('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Memoized search results
  const searchResults = useMemo(() => {
    let filteredBooks = books;

    // Apply category filter if active
    if (categoryId) {
      filteredBooks = filteredBooks.filter(book => book.categoryIds.includes(categoryId));
    }

    // Apply writer filter if active
    if (writerId) {
      filteredBooks = filteredBooks.filter(book => book.writerIds.includes(writerId));
    }

    // Apply search query if provided (3+ characters)
    const query = debouncedQuery.toLowerCase().trim();
    if (query.length >= 3) {
      // Filter within already filtered books
      const queryLower = query.toLowerCase();
      return filteredBooks.filter(book => {
        const writerNames = book.writerIds
          .map(id => writersMap.get(id)?.name?.toLowerCase() || '')
          .join(' ');
        const categoryNames = book.categoryIds
          .map(id => categoriesMap.get(id)?.name?.toLowerCase() || '')
          .join(' ');
        const searchText = `${book.title.toLowerCase()} ${book.isbn.toLowerCase()} ${writerNames} ${categoryNames}`;
        return searchText.includes(queryLower);
      });
    }

    // If no search query but filters are active, return filtered books
    if (categoryId || writerId) {
      return filteredBooks;
    }

    // No filters and no search query
    return [];
  }, [books, writerId, categoryId, debouncedQuery, writersMap, categoriesMap]);

  // Memoized helper functions using the lookup maps
  const getWriter = useCallback((id: string) => writersMap.get(id), [writersMap]);
  const getCategory = useCallback((id: string) => categoriesMap.get(id), [categoriesMap]);

  const getCategoryNames = useCallback((categoryIds: string[]) => {
    return categoryIds
      .map(id => categoriesMap.get(id)?.name)
      .filter(Boolean)
      .join(', ');
  }, [categoriesMap]);

  const getWriterNames = useCallback((writerIds: string[]) => {
    return writerIds
      .map(id => writersMap.get(id)?.name)
      .filter(Boolean)
      .join(', ');
  }, [writersMap]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-gray-900">Search Books</h1>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <BookPlus className="w-5 h-5" />
          Request Book
        </button>
      </div>

      {/* Show filter info if active */}
      {(writerId || categoryId) && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900">
            {writerId && `Showing books by writer: ${writersMap.get(writerId)?.name || 'Unknown'}`}
            {categoryId && `Showing books in category: ${categoriesMap.get(categoryId)?.name || 'Unknown'}`}
          </p>
        </div>
      )}

      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by book title, writer, category, or ISBN..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {searchQuery && searchQuery.trim().length >= 3 && (
          <p className="text-gray-600 mt-2">
            Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
            {searchQuery !== debouncedQuery && ' (searching...)'}
            {(writerId || categoryId) && ' (filtered)'}
          </p>
        )}
        {searchQuery && searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
          <p className="text-orange-600 mt-2">
            Please enter at least 3 characters to search
          </p>
        )}
        {!searchQuery && (writerId || categoryId) && (
          <p className="text-gray-600 mt-2">
            Found {searchResults.length} {searchResults.length === 1 ? 'book' : 'books'}
          </p>
        )}
      </div>

      {/* Search Results */}
      {!writerId && !categoryId && searchQuery.trim() === '' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">
            Enter a search term to find books by title, writer, category, or ISBN
          </p>
        </div>
      ) : searchQuery.trim().length > 0 && searchQuery.trim().length < 3 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Search className="w-16 h-16 text-orange-300 mx-auto mb-4" />
          <p className="text-gray-600">
            Please enter at least 3 characters to search
          </p>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-600">
            {writerId || categoryId 
              ? `No books found${searchQuery.trim().length >= 3 ? ` matching "${debouncedQuery}"` : ''} with this filter` 
              : `No books found matching "${debouncedQuery}"`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {searchResults.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onViewBook(book.id)}
            >
              <div className="flex gap-4">
                {/* Book Cover Thumbnail */}
                <div className="w-24 h-32 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {book.imageUrl ? (
                    <ImageWithFallback
                      src={book.imageUrl}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Book Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 mb-1">{book.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {book.writerIds.map(wId => {
                      const writer = getWriter(wId);
                      return writer ? (
                        <button
                          key={wId}
                          className="text-blue-600 hover:text-blue-700 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToWriter?.(wId);
                          }}
                        >
                          {writer.name}
                        </button>
                      ) : null;
                    })}
                    {book.writerIds.length === 0 && <span className="text-gray-600">Unknown author</span>}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-gray-600 mb-2">
                    <span>ISBN: {book.isbn}</span>
                    {book.labelNumber && <span>Rack: {book.labelNumber}</span>}
                    {book.barcode && <span>Chip ID: {book.barcode}</span>}
                    <span>Year: {book.publicationYear}</span>
                    <span>Type: {book.bookType || 'Paperback'}</span>
                    <span>
                      Available: {book.availableCopies}/{book.totalCopies}
                    </span>
                  </div>

                  {book.categoryIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {book.categoryIds.map(catId => {
                        const category = getCategory(catId);
                        return category ? (
                          <button
                            key={catId}
                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToCategory?.(catId);
                            }}
                          >
                            {category.name}
                          </button>
                        ) : null;
                      })}
                    </div>
                  )}

                  <div className="text-gray-600 mt-2">
                    <MarkdownContent content={book.description} maxLines={2} />
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full ${
                      book.availableCopies > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {book.availableCopies > 0 ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Book Modal */}
      {showRequestModal && (
        <RequestBook onClose={() => setShowRequestModal(false)} />
      )}
    </div>
  );
}

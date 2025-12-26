import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, X, BookOpen, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Book, Category, Writer, User as UserType } from '../App';
import { booksApi, categoriesApi, writersApi, usersApi } from '../utils/api';

type BooksProps = {
  onViewBook: (bookId: string) => void;
};

export function Books({ onViewBook }: BooksProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<UserType | null>(null);
  const [writerSearchQuery, setWriterSearchQuery] = useState('');
  const [showWriterDropdown, setShowWriterDropdown] = useState(false);
  const [selectedWriters, setSelectedWriters] = useState<Writer[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    isbn: '',
    labelNumber: '',
    barcode: '',
    publicationYear: new Date().getFullYear(),
    totalCopies: 1,
    availableCopies: 1,
    imageUrl: '',
    description: '',
    categoryIds: [] as string[],
    writerIds: [] as string[],
    ownerId: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    bookType: 'Paperback',
  });
  const [errors, setErrors] = useState({ titleWriter: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Calculate pagination
  const totalPages = useMemo(() => Math.ceil(books.length / itemsPerPage), [books.length]);
  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return books.slice(startIndex, endIndex);
  }, [books, currentPage]);

  // Reset to page 1 when books change (e.g., after delete)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    loadBooks();
    loadCategories();
    loadWriters();
    loadUsers();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await booksApi.getAll();
      setBooks(data);
    } catch (error) {
      console.error('Error loading books:', error);
      alert('Failed to load books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadWriters = async () => {
    try {
      const data = await writersApi.getAll();
      setWriters(data);
    } catch (error) {
      console.error('Error loading writers:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({ titleWriter: '' });
    
    // Validate required fields
    if (formData.categoryIds.length === 0) {
      alert('Please select at least one category');
      return;
    }
    
    if (formData.writerIds.length === 0) {
      alert('Please select at least one writer');
      return;
    }
    
    if (!formData.ownerId) {
      alert('Please select a book owner');
      return;
    }
    
    // Check for duplicate title + writers combination (case-insensitive title)
    const normalizedTitle = formData.title.trim().toLowerCase();
    const sortedWriterIds = [...formData.writerIds].sort();
    
    const duplicateBook = books.find(book => {
      // Skip the book being edited
      if (editingBook && book.id === editingBook.id) return false;
      
      // Check if title matches (case-insensitive)
      if (book.title.trim().toLowerCase() !== normalizedTitle) return false;
      
      // Check if writers match (same set of writers)
      const bookWriterIds = [...book.writerIds].sort();
      if (bookWriterIds.length !== sortedWriterIds.length) return false;
      
      return bookWriterIds.every((id, index) => id === sortedWriterIds[index]);
    });
    
    if (duplicateBook) {
      setErrors({ titleWriter: 'A book with this title and writer(s) combination already exists' });
      return;
    }
    
    try {
      setLoading(true);
      if (editingBook) {
        await booksApi.update(editingBook.id, { ...formData, id: editingBook.id });
      } else {
        const newBook = {
          ...formData,
          id: Date.now().toString(),
        };
        await booksApi.create(newBook);
      }
      resetForm();
      await loadBooks();
      // Reset to first page after adding a new book
      setCurrentPage(1);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to save book. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    
    // If book has an owner, set the selected owner
    if (book.ownerId) {
      const owner = users.find(u => u.id === book.ownerId);
      if (owner) {
        setSelectedOwner(owner);
      }
    } else {
      setSelectedOwner(null);
    }
    
    // Load selected writers
    const bookWriters = book.writerIds
      .map(id => writers.find(w => w.id === id))
      .filter((w): w is Writer => w !== undefined);
    setSelectedWriters(bookWriters);
    
    setFormData({
      title: book.title,
      isbn: book.isbn,
      labelNumber: book.labelNumber || '',
      barcode: book.barcode || '',
      publicationYear: book.publicationYear,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      imageUrl: book.imageUrl,
      description: book.description,
      categoryIds: book.categoryIds,
      writerIds: book.writerIds,
      ownerId: book.ownerId || '',
      ownerName: book.ownerName || '',
      ownerPhone: book.ownerPhone || '',
      ownerEmail: book.ownerEmail || '',
      bookType: book.bookType || 'Paperback',
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this book?')) {
      try {
        await booksApi.delete(id);
        loadBooks();
      } catch (error) {
        console.error('Error deleting book:', error);
        alert('Failed to delete book. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      isbn: '',
      labelNumber: '',
      barcode: '',
      publicationYear: new Date().getFullYear(),
      totalCopies: 1,
      availableCopies: 1,
      imageUrl: '',
      description: '',
      categoryIds: [],
      writerIds: [],
      ownerId: '',
      ownerName: '',
      ownerPhone: '',
      ownerEmail: '',
      bookType: 'Paperback',
    });
    setEditingBook(null);
    setSelectedOwner(null);
    setOwnerSearchQuery('');
    setShowOwnerDropdown(false);
    setSelectedWriters([]);
    setWriterSearchQuery('');
    setShowWriterDropdown(false);
    setErrors({ titleWriter: '' });
    setIsFormOpen(false);
  };

  const getCategoryNames = (categoryIds: string[]) => {
    return categoryIds
      .map(id => categories.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const getWriterNames = (writerIds: string[]) => {
    return writerIds
      .map(id => writers.find(w => w.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const handleOwnerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setOwnerSearchQuery(query);
    if (query) {
      setShowOwnerDropdown(true);
    } else {
      setShowOwnerDropdown(false);
    }
  };

  const handleOwnerSelect = (user: UserType) => {
    setSelectedOwner(user);
    setFormData({
      ...formData,
      ownerId: user.id,
      ownerName: user.name,
      ownerPhone: user.phone,
      ownerEmail: user.email,
    });
    setOwnerSearchQuery('');
    setShowOwnerDropdown(false);
  };

  const filteredOwners = users.filter(user => {
    const query = ownerSearchQuery.toLowerCase().trim();
    if (!query) return false;
    
    return (
      user.name.toLowerCase().includes(query) ||
      user.phone.includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const handleWriterSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setWriterSearchQuery(query);
    if (query) {
      setShowWriterDropdown(true);
    } else {
      setShowWriterDropdown(false);
    }
  };

  const handleWriterSelect = (writer: Writer) => {
    const index = selectedWriters.findIndex(w => w.id === writer.id);
    if (index === -1) {
      if (selectedWriters.length < 4) {
        setSelectedWriters([...selectedWriters, writer]);
        setFormData({
          ...formData,
          writerIds: [...formData.writerIds, writer.id],
        });
      } else {
        alert('You can select up to 4 writers');
      }
    }
    setWriterSearchQuery('');
    setShowWriterDropdown(false);
  };

  const handleWriterRemove = (writerId: string) => {
    setSelectedWriters(selectedWriters.filter(w => w.id !== writerId));
    setFormData({
      ...formData,
      writerIds: formData.writerIds.filter(id => id !== writerId),
    });
  };

  const filteredWriters = writers.filter(writer => {
    const query = writerSearchQuery.toLowerCase().trim();
    if (!query) return false;
    
    return (
      writer.name.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-gray-900">Books</h1>
          {books.length > 0 && (
            <span className="text-gray-600 text-sm font-normal">
              (Showing {books.length <= itemsPerPage 
                ? `1-${books.length}` 
                : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, books.length)}`} of {books.length})
            </span>
          )}
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Book
        </button>
      </div>

      {/* Book Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-gray-900">
                {editingBook ? 'Edit Book' : 'Add Book'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto p-6 space-y-4">
                {errors.titleWriter && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">{errors.titleWriter}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Book Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">ISBN</label>
                    <input
                      type="text"
                      value={formData.isbn}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Publication Year</label>
                    <input
                      type="number"
                      value={formData.publicationYear}
                      onChange={(e) => setFormData({ ...formData, publicationYear: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Total Copies</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalCopies}
                      onChange={(e) => setFormData({ ...formData, totalCopies: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Available Copies</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.availableCopies}
                      onChange={(e) => setFormData({ ...formData, availableCopies: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Rack Label</label>
                  <input
                    type="text"
                    value={formData.labelNumber}
                    onChange={(e) => setFormData({ ...formData, labelNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Chip ID</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Book Type</label>
                  <select
                    value={formData.bookType}
                    onChange={(e) => setFormData({ ...formData, bookType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Paperback">Paperback</option>
                    <option value="Hardcover">Hardcover</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/book-cover.jpg"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Categories (Select up to 4) <span className="text-red-500">*</span>
                  </label>
                  <select
                    multiple
                    value={formData.categoryIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      if (selected.length <= 4) {
                        setFormData({ ...formData, categoryIds: selected });
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-40"
                    size={6}
                    required
                  >
                    {categories.length === 0 ? (
                      <option disabled>No categories available</option>
                    ) : (
                      categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-gray-600 mt-1">Hold Ctrl/Cmd to select multiple (max 4) - Required</p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Writers (Select up to 4) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={writerSearchQuery}
                      onChange={handleWriterSearch}
                      onFocus={() => setShowWriterDropdown(true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search by name..."
                    />
                    {showWriterDropdown && filteredWriters.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredWriters.map((writer) => (
                          <button
                            key={writer.id}
                            type="button"
                            onClick={() => handleWriterSelect(writer)}
                            className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                          >
                            <p className="text-gray-900">{writer.name}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">Search and select writers from the database - Required</p>
                  
                  {selectedWriters.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mt-3">
                      <div className="space-y-1 text-gray-600">
                        {selectedWriters.map(writer => (
                          <div key={writer.id} className="flex items-center justify-between">
                            <p>{writer.name}</p>
                            <button
                              type="button"
                              onClick={() => handleWriterRemove(writer.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Book Owner <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      value={ownerSearchQuery}
                      onChange={(e) => {
                        setOwnerSearchQuery(e.target.value);
                        setShowOwnerDropdown(true);
                      }}
                      onFocus={() => setShowOwnerDropdown(true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search by name, phone, or email..."
                    />
                    {showOwnerDropdown && filteredOwners.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredOwners.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleOwnerSelect(user)}
                            className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                          >
                            <p className="text-gray-900">{user.name}</p>
                            <p className="text-gray-600">{user.phone} | {user.email}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">Search and select a user from the database - Required</p>
                  
                  {selectedOwner && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mt-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-900">{selectedOwner.name}</p>
                          <p className="text-gray-600">ID: {selectedOwner.id}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-gray-600">
                        <p>Phone: {selectedOwner.phone}</p>
                        <p>Email: {selectedOwner.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 p-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingBook ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg">
            Loading books...
          </div>
        ) : books.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg">
            No books yet. Click "Add Book" to create one.
          </div>
        ) : (
          paginatedBooks.map((book) => (
            <div key={book.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-[3/4] bg-gray-100 relative">
                {book.imageUrl ? (
                  <ImageWithFallback
                    src={book.imageUrl}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
                <p className="text-gray-600 mb-2">{getWriterNames(book.writerIds) || 'Unknown author'}</p>
                <p className="text-gray-500 mb-2">{getCategoryNames(book.categoryIds)}</p>
                <div className="flex flex-wrap gap-2 text-gray-600 mb-3">
                  <span>ISBN: {book.isbn}</span>
                  {book.labelNumber && <span>Label: {book.labelNumber}</span>}
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600">Available: {book.availableCopies}/{book.totalCopies}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewBook(book.id)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(book)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {books.length > itemsPerPage && (
        <div className="mt-8 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-sm">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, books.length)} of {books.length} books
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* First Page Button */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="First page"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
            
            {/* Previous Page Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            {/* Next Page Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            {/* Last Page Button */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Last page"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
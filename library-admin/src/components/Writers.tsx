import { useState, useEffect } from 'react';
import { Plus, Edit2, X, Search, BookOpen, User } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MarkdownContent } from './MarkdownContent';
import type { Writer, Book, Category } from '../App';
import { writersApi, booksApi, categoriesApi } from '../utils/api';

export function Writers() {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWriter, setEditingWriter] = useState<Writer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    nationality: '',
    bio: '',
    imageUrl: '',
  });
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedWriter, setSelectedWriter] = useState<Writer | null>(null);
  const [writerBooks, setWriterBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadWriters();
    loadCategories();
  }, []);

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
      setLoading(true);
      const data = await writersApi.getAll();
      setWriters(data);
    } catch (error) {
      console.error('Error loading writers:', error);
      alert('Failed to load writers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Frontend validation: Check for duplicate name + nationality
    const duplicate = writers.find(
      writer => 
        writer.name.toLowerCase() === formData.name.toLowerCase() &&
        writer.nationality.toLowerCase() === formData.nationality.toLowerCase() &&
        writer.id !== editingWriter?.id
    );
    
    if (duplicate) {
      setError(`A writer named "${formData.name}" from "${formData.nationality}" already exists`);
      return;
    }
    
    try {
      setLoading(true);
      if (editingWriter) {
        const updated = { ...editingWriter, ...formData };
        await writersApi.update(editingWriter.id, updated);
      } else {
        const newWriter: Writer = {
          id: Date.now().toString(),
          ...formData,
        };
        await writersApi.create(newWriter);
      }
      await loadWriters();
      resetForm();
    } catch (error: any) {
      console.error('Error saving writer:', error);
      // Show backend error message if available
      setError(error.message || 'Failed to save writer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (writer: Writer) => {
    setEditingWriter(writer);
    setFormData({
      name: writer.name,
      nationality: writer.nationality,
      bio: writer.bio,
      imageUrl: writer.imageUrl || '',
    });
    setError('');
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', nationality: '', bio: '', imageUrl: '' });
    setEditingWriter(null);
    setError('');
    setIsFormOpen(false);
  };

  const filteredWriters = writers.filter(writer => {
    const query = searchQuery.toLowerCase().trim();
    if (!query || query.length < 3) return false;
    
    return (
      writer.name.toLowerCase().includes(query) ||
      writer.nationality.toLowerCase().includes(query) ||
      writer.bio.toLowerCase().includes(query)
    );
  });

  const handleViewWriter = async (writer: Writer) => {
    setSelectedWriter(writer);
    setIsDetailOpen(true);
    await loadWriterBooks(writer.id);
  };

  const loadWriterBooks = async (writerId: string) => {
    try {
      setDetailLoading(true);
      const allBooks = await booksApi.getAll();
      const books = allBooks.filter(book => book.writerIds.includes(writerId));
      setWriterBooks(books);
    } catch (error) {
      console.error('Error loading writer books:', error);
      alert('Failed to load books. Please try again.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedWriter(null);
    setWriterBooks([]);
  };

  const getCategoryNames = (categoryIds: string[]) => {
    return categoryIds
      .map(id => categories.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-gray-900">Writers</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Writer
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, nationality, or bio (min 3 characters)..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {searchQuery && searchQuery.trim().length >= 3 && (
          <p className="text-gray-600 mt-2">
            Found {filteredWriters.length} {filteredWriters.length === 1 ? 'writer' : 'writers'}
          </p>
        )}
        {searchQuery && searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
          <p className="text-orange-600 mt-2">
            Please enter at least 3 characters to search
          </p>
        )}
      </div>

      {/* Writer Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-900">
                {editingWriter ? 'Edit Writer' : 'Add Writer'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Writer Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Nationality *</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Biography *</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/writer-photo.jpg"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingWriter ? 'Update' : 'Create'}
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

      {/* Writers List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {searchQuery.trim().length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>Enter at least 3 characters to search for writers</p>
          </div>
        ) : searchQuery.trim().length < 3 ? (
          <div className="p-12 text-center text-gray-500">
            <p>Please enter at least 3 characters to search</p>
          </div>
        ) : loading && filteredWriters.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Loading writers...
          </div>
        ) : filteredWriters.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No writers found matching your search
          </div>
        ) : (
          <div className="divide-y">
            {filteredWriters.map((writer) => (
              <div 
                key={writer.id} 
                className="p-4 hover:bg-gray-50 flex justify-between items-start cursor-pointer"
                onClick={() => handleViewWriter(writer)}
              >
                <div className="flex-1 flex items-start gap-4">
                  {/* Writer Image */}
                  {writer.imageUrl ? (
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-300 shadow-sm">
                      <ImageWithFallback
                        src={writer.imageUrl}
                        alt={writer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center flex-shrink-0 border-2 border-gray-400 shadow-sm">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-gray-900 mb-1 font-medium">{writer.name}</h3>
                    <p className="text-gray-600 mb-2">{writer.nationality}</p>
                    <p className="text-gray-600 line-clamp-2">{writer.bio}</p>
                  </div>
                </div>
                <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleEdit(writer)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit writer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Writer Detail Modal */}
      {isDetailOpen && selectedWriter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex-1 flex items-start gap-4">
                {/* Writer Image */}
                {selectedWriter.imageUrl ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-300 shadow-sm">
                    <ImageWithFallback
                      src={selectedWriter.imageUrl}
                      alt={selectedWriter.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center flex-shrink-0 border-2 border-gray-400 shadow-sm">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-gray-900 text-2xl font-bold mb-1">{selectedWriter.name}</h2>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-600 font-medium">{selectedWriter.nationality}</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="text-gray-400 hover:text-gray-600 hover:bg-white rounded-full p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Writer Info */}
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-gray-900 font-semibold text-lg mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                  Biography
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  <MarkdownContent content={selectedWriter.bio} />
                </div>
              </div>

              {/* Books Section */}
              <div className="p-6">
                <h3 className="text-gray-900 font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                  Books
                  <span className="ml-2 px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {writerBooks.length}
                  </span>
                </h3>
                {detailLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading books...</p>
                  </div>
                ) : writerBooks.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No books found for this writer</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {writerBooks.map((book) => (
                      <div
                        key={book.id}
                        className="group bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex gap-4 p-5">
                          {/* Book Cover */}
                          <div className="w-24 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                            {book.imageUrl ? (
                              <ImageWithFallback
                                src={book.imageUrl}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                <BookOpen className="w-10 h-10 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Book Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-gray-900 font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {book.title}
                            </h4>
                            
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3 text-sm">
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-500 font-medium">ISBN:</span>
                                <span className="text-gray-700">{book.isbn}</span>
                              </div>
                              {book.labelNumber && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-500 font-medium">Rack:</span>
                                  <span className="text-gray-700">{book.labelNumber}</span>
                                </div>
                              )}
                              {book.publicationYear && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-500 font-medium">Year:</span>
                                  <span className="text-gray-700">{book.publicationYear}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-500 font-medium">Copies:</span>
                                <span className="text-gray-700">{book.availableCopies}/{book.totalCopies}</span>
                              </div>
                            </div>

                            {book.categoryIds.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {book.categoryIds.slice(0, 3).map(catId => {
                                  const category = categories.find(c => c.id === catId);
                                  return category ? (
                                    <span
                                      key={catId}
                                      className="text-purple-700 text-xs font-bold"
                                    >
                                      {category.name}
                                    </span>
                                  ) : null;
                                })}
                                {book.categoryIds.length > 3 && (
                                  <span className="text-gray-500 text-xs font-medium">
                                    +{book.categoryIds.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}

                            {book.description && (
                              <div className="text-gray-600 text-sm leading-relaxed mb-3">
                                <MarkdownContent content={book.description} maxLines={2} />
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <span
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                  book.availableCopies > 0
                                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200'
                                    : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200'
                                }`}
                              >
                                {book.availableCopies > 0 ? '✓ Available' : '✗ Unavailable'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

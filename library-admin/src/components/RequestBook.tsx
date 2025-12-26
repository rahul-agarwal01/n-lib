import { useState, useEffect } from 'react';
import { X, BookPlus } from 'lucide-react';
import type { Category, BookRequest } from '../App';
import { categoriesApi, bookRequestsApi } from '../utils/api';

type RequestBookProps = {
  onClose: () => void;
};

export function RequestBook({ onClose }: RequestBookProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [bookName, setBookName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Failed to load categories. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookName.trim()) {
      alert('Please enter a book name');
      return;
    }

    if (!categoryId) {
      alert('Please select a category');
      return;
    }

    try {
      setLoading(true);

      const selectedCategory = categories.find(c => c.id === categoryId);
      // Handle "other" category - send null for categoryId
      const actualCategoryId = categoryId === 'other' ? null : categoryId;
      
      const newRequest: BookRequest = {
        id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        bookName: bookName.trim(),
        categoryId: actualCategoryId,
        categoryName: selectedCategory?.name || (categoryId === 'other' ? 'Other' : categoryId),
        authorName: authorName.trim() || undefined,
        requestDate: new Date().toISOString().split('T')[0],
        status: 'pending',
      };

      await bookRequestsApi.create(newRequest);
      
      setSubmitStatus('success');
      // Close modal after showing success message
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting book request:', error);
      setSubmitStatus('error');
      setErrorMessage('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <BookPlus className="w-6 h-6 text-blue-600" />
            <h2 className="text-gray-900">Request a Book</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {submitStatus === 'success' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-700 font-medium">Request submitted successfully!</p>
              <p className="text-green-600 text-sm mt-1">The library admin will review your request.</p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{errorMessage}</p>
            </div>
          )}

          <div>
            <label className="block text-gray-700 mb-2">
              Book Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter book name"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              Author Name <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter author name"
            />
          </div>

          {submitStatus !== 'success' && (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

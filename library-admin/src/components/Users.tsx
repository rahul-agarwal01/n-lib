import { useState, useEffect } from 'react';
import { Plus, Edit2, X, User as UserIcon, Search, History, BookOpen } from 'lucide-react';
import type { User, BookIssue, Book } from '../App';
import { usersApi, issuesApi, booksApi } from '../utils/api';

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ phone: '', email: '' });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [isIssueHistoryOpen, setIsIssueHistoryOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [issueHistory, setIssueHistory] = useState<(BookIssue & { bookTitle: string })[]>([]);
  const [issueHistoryLoading, setIssueHistoryLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({ phone: '', email: '' });
    
    // Check for duplicate phone (excluding current user when editing)
    const phoneExists = users.find(
      user => user.phone === formData.phone && user.id !== editingUser?.id
    );
    
    // Check for duplicate email (excluding current user when editing)
    const emailExists = users.find(
      user => user.email === formData.email && user.id !== editingUser?.id
    );
    
    // Set errors if duplicates found
    if (phoneExists || emailExists) {
      setErrors({
        phone: phoneExists ? 'This phone number is already registered to another user' : '',
        email: emailExists ? 'This email is already registered to another user' : '',
      });
      return; // Don't submit if there are errors
    }
    
    try {
      setLoading(true);
      if (editingUser) {
        const updated = { ...editingUser, ...formData };
        await usersApi.update(editingUser.id, updated);
      } else {
        const newUser: User = {
          id: Date.now().toString(),
          ...formData,
        };
        await usersApi.create(newUser);
      }
      await loadUsers();
      resetForm();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      phone: user.phone,
      email: user.email,
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
    });
    setEditingUser(null);
    setErrors({ phone: '', email: '' });
    setIsFormOpen(false);
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase().trim();
    if (!query || query.length < 3) return false;
    
    return (
      user.name.toLowerCase().includes(query) ||
      user.phone.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const loadUserIssueHistory = async (userId: string) => {
    try {
      setIssueHistoryLoading(true);
      const [issues, books] = await Promise.all([
        issuesApi.getAll(),
        booksApi.getAll(),
      ]);

      const userIssues = issues
        .filter(issue => issue.userId === userId)
        .map(issue => {
          const book = books.find(b => b.id === issue.bookId);
          return {
            ...issue,
            bookTitle: book?.title || 'Unknown Book',
          };
        })
        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

      setIssueHistory(userIssues);
    } catch (error) {
      console.error('Error loading issue history:', error);
      alert('Failed to load issue history. Please try again.');
    } finally {
      setIssueHistoryLoading(false);
    }
  };

  const handleViewIssueHistory = async (user: User) => {
    setSelectedUser(user);
    setIsIssueHistoryOpen(true);
    await loadUserIssueHistory(user.id);
  };

  const closeIssueHistory = () => {
    setIsIssueHistoryOpen(false);
    setSelectedUser(null);
    setIssueHistory([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-gray-900">Users</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add User
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
            placeholder="Search by name, phone, or email (min 3 characters)..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {searchQuery && searchQuery.trim().length >= 3 && (
          <p className="text-gray-600 mt-2">
            Found {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          </p>
        )}
        {searchQuery && searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
          <p className="text-orange-600 mt-2">
            Please enter at least 3 characters to search
          </p>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <form onSubmit={handleSubmit}>
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-gray-900">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h2>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1-555-0101"
                    required
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="user@example.com"
                    required
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="flex gap-2 p-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingUser ? 'Update' : 'Create'}
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

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-gray-700">Phone</th>
                <th className="px-6 py-3 text-left text-gray-700">Email</th>
                <th className="px-6 py-3 text-right text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {searchQuery.trim().length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>Enter at least 3 characters to search for users</p>
                  </td>
                </tr>
              ) : searchQuery.trim().length < 3 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <p>Please enter at least 3 characters to search</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No users found matching your search
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.phone}</td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewIssueHistory(user)}
                          className="px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-2 border border-green-200"
                          title="View Issue History"
                        >
                          <History className="w-4 h-4" />
                          <span>History</span>
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      {users.length > 0 && searchQuery.trim().length >= 3 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900">
            Total Users: {users.length}
          </p>
          <p className="text-blue-700">
            Showing: {filteredUsers.length} of {users.length}
          </p>
        </div>
      )}

      {/* Issue History Modal */}
      {isIssueHistoryOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-gray-900 text-xl font-semibold">Issue History</h2>
                <p className="text-gray-600 text-sm mt-1">{selectedUser.name}</p>
              </div>
              <button
                type="button"
                onClick={closeIssueHistory}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {issueHistoryLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading issue history...</p>
                </div>
              ) : issueHistory.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No issue history found for this user</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-700 font-semibold">Book Title</th>
                        <th className="px-4 py-3 text-left text-gray-700 font-semibold">Issue Date</th>
                        <th className="px-4 py-3 text-left text-gray-700 font-semibold">Due Date</th>
                        <th className="px-4 py-3 text-left text-gray-700 font-semibold">Return Date</th>
                        <th className="px-4 py-3 text-left text-gray-700 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {issueHistory.map((issue) => (
                        <tr key={issue.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{issue.bookTitle}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(issue.issueDate)}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(issue.dueDate)}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {issue.returnDate ? formatDate(issue.returnDate) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                issue.status === 'returned'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {issue.status === 'returned' ? 'Returned' : 'Issued'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
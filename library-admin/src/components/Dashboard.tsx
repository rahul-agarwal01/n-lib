import { useEffect, useState } from 'react';
import { BookOpen, Users, FolderTree, Upload, Download, Search } from 'lucide-react';
import type { Book, Writer, Category, BookIssue } from '../App';
import { booksApi, categoriesApi, writersApi, issuesApi } from '../utils/api';

type DashboardProps = {
  onNavigate: (page: any) => void;
};

export function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    issuedBooks: 0,
    totalCategories: 0,
    totalWriters: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [books, categories, writers, issues] = await Promise.all([
        booksApi.getAll(),
        categoriesApi.getAll(),
        writersApi.getAll(),
        issuesApi.getAll(),
      ]);

      const totalCopies = books.reduce((sum, book) => sum + book.totalCopies, 0);
      const availableCopies = books.reduce((sum, book) => sum + book.availableCopies, 0);
      const issuedCount = issues.filter(issue => issue.status === 'issued').length;

      setStats({
        totalBooks: books.length,
        availableBooks: availableCopies,
        issuedBooks: issuedCount,
        totalCategories: categories.length,
        totalWriters: writers.length,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: Upload, label: 'Issue Book', color: 'bg-green-500', onClick: () => onNavigate({ type: 'issue-book' }) },
    { icon: Download, label: 'Receive Book', color: 'bg-blue-500', onClick: () => onNavigate({ type: 'receive-book' }) },
    { icon: Search, label: 'Search Books', color: 'bg-purple-500', onClick: () => onNavigate({ type: 'search' }) },
  ];

  return (
    <div>
      <h1 className="text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Total Books</p>
              <p className="text-gray-900">{stats.totalBooks}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Available Copies</p>
              <p className="text-gray-900">{stats.availableBooks}</p>
            </div>
            <BookOpen className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Issued</p>
              <p className="text-gray-900">{stats.issuedBooks}</p>
            </div>
            <Upload className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Categories</p>
              <p className="text-gray-900">{stats.totalCategories}</p>
            </div>
            <FolderTree className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Writers</p>
              <p className="text-gray-900">{stats.totalWriters}</p>
            </div>
            <Users className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className={`${action.color} p-3 rounded-lg`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-gray-900">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
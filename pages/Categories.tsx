import React, { useEffect, useState } from 'react';
import { getCategories } from '../services/db';
import { Category } from '../types';
import * as Icons from 'lucide-react';
import * as ReactRouterDOM from 'react-router-dom';

const { Link } = ReactRouterDOM;

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      const data = await getCategories();
      setCategories(data);
    };
    fetchCats();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-16 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Explore Topics</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Dive deep into the subjects that matter most to you. From coding to culture, we have it covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            // Dynamic Icon rendering
            const IconComponent = (Icons as any)[category.icon] || Icons.Hash;
            
            return (
              <Link 
                key={category.id} 
                to={`/categories`} // Ideally /category/:id
                className="group p-8 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center mb-6 shadow-sm group-hover:bg-primary-500 group-hover:text-white transition-colors text-primary-600 dark:text-primary-400">
                  <IconComponent size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{category.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{category.description}</p>
                <span className="inline-block px-3 py-1 bg-white dark:bg-gray-900 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                  {category.count} Articles
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
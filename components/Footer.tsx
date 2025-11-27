import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Twitter, Github, Linkedin, Mail } from 'lucide-react';

const { Link } = ReactRouterDOM;

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent mb-4 inline-block">
              Bigyann.com.np
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Illuminating ideas in technology, design, and modern living. Built for the curious mind.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-4">Categories</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link to="/categories" className="hover:text-primary-600 transition-colors">Technology</Link></li>
              <li><Link to="/categories" className="hover:text-primary-600 transition-colors">Design</Link></li>
              <li><Link to="/categories" className="hover:text-primary-600 transition-colors">Lifestyle</Link></li>
              <li><Link to="/categories" className="hover:text-primary-600 transition-colors">Business</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link to="/about" className="hover:text-primary-600 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary-600 transition-colors">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-primary-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/rss" className="hover:text-primary-600 transition-colors">RSS Feed</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-4">Newsletter</h3>
            <p className="text-xs text-gray-500 mb-3">Get the latest articles delivered to your inbox.</p>
            <form className="flex flex-col space-y-2" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="you@example.com"
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-none text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-gray-200"
              />
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">© 2024 Bigyann. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Twitter size={18} /></a>
            <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Github size={18} /></a>
            <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Linkedin size={18} /></a>
            <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Mail size={18} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

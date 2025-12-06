import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Twitter, Github, Linkedin, Mail, User as UserIcon, LogOut, ArrowRight } from 'lucide-react';

const { Link } = ReactRouterDOM;

// Assuming useAuth and handleLogout exist in the scope where this component is used, 
// similar to the Header component provided earlier.
// For this standalone component, we'll simulate the user state.
interface User {
  name: string;
  email: string;
}

// Placeholder for context hooks (replace with actual imports if integrated)
const useAuth = () => ({
    user: null as User | null, // Replace null with an actual user object if logged in
    logout: () => console.log('User logged out'), // Placeholder function
});

export const Footer: React.FC = () => {
  const { user, logout } = useAuth();
  
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* --- Main Grid Section (Desktop) --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-12 gap-x-8 mb-16">
          
          {/* Logo & Description */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4 inline-block transition-colors">
              Bigyann
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-sm">
              Illuminating ideas in technology, design, and modern living. Built for the curious mind.
            </p>
          </div>

          {/* Categories */}
          <div className="col-span-1">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100 mb-5">
              Categories
            </h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li><Link to="/categories" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Technology</Link></li>
              <li><Link to="/categories" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Design</Link></li>
              <li><Link to="/categories" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Lifestyle</Link></li>
              <li><Link to="/categories" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Business</Link></li>
            </ul>
          </div>

          {/* Quick Links (Legal & Info) */}
          <div className="col-span-1">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100 mb-5">
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li><Link to="/about" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Contact</Link></li>
              <li className="pt-2 border-t border-gray-100 dark:border-gray-800/50"><Link to="/privacy-policy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/disclaimer" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Disclaimer</Link></li>
            </ul>
          </div>

          {/* Newsletter (Col-span 1 on desktop) */}
          <div className="col-span-2 md:col-span-2 lg:col-span-1">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100 mb-5">
              Stay Updated
            </h3>
            <p className="text-xs text-gray-500 mb-4">
                Join our newsletter for fresh insights every week.
            </p>
            <form className="flex flex-col space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email"
                aria-label="Email for newsletter"
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
              />
              <button className="flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary-600/30 hover:shadow-lg hover:shadow-primary-600/40">
                Subscribe <ArrowRight size={16} className="ml-2" />
              </button>
            </form>
          </div>
        </div>

        {/* --- Divider --- */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
            {/* --- Auth/Mobile Action Row (Added for consistency with Header) --- */}
            <div className="flex justify-between items-center mb-6 lg:hidden">
                {user ? (
                    <div className="flex items-center space-x-3">
                        <UserIcon size={20} className="text-primary-600 dark:text-primary-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.name}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center space-x-3">
                         <UserIcon size={20} className="text-gray-500 dark:text-gray-400" />
                         <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                             Account
                         </span>
                    </div>
                )}
                
                {user ? (
                    <button 
                        onClick={handleLogout}
                        className="flex items-center text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                        <LogOut size={16} className="mr-1" /> Sign Out
                    </button>
                ) : (
                    <div className="flex space-x-3">
                        <Link to="/login" className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            Log in
                        </Link>
                        <Link to="/signup" className="px-3 py-1.5 text-xs font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
                            Sign up
                        </Link>
                    </div>
                )}
            </div>
            
            {/* --- Copyright & Social Links --- */}
            <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-sm text-gray-500 order-2 md:order-1 mt-6 md:mt-0">
                    © 2024 Bigyann. All rights reserved.
                </p>
                <div className="flex space-x-5 order-1 md:order-2">
                    <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        <Twitter size={20} />
                    </a>
                    <a href="#" aria-label="Github" className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        <Github size={20} />
                    </a>
                    <a href="#" aria-label="LinkedIn" className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        <Linkedin size={20} />
                    </a>
                    <a href="#" aria-label="Email" className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        <Mail size={20} />
                    </a>
                </div>
            </div>
        </div>
      </div>
    </footer>
  );
};
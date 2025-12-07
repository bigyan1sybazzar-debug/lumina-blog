import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Twitter, Github, Linkedin, Mail, User as UserIcon, LogOut, Link as LinkIcon } from 'lucide-react';

const { Link } = ReactRouterDOM;

// Placeholder for user structure (Maintaining original structure)
interface User {
  name: string;
  email: string;
}

// Placeholder for context hooks (Maintaining original structure)
const useAuth = () => ({
    user: null as User | null, 
    logout: () => console.log('User logged out'), 
});

// Base64 logo for the icon
const ICON_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAe1BMVEX////78vL45ufrlZvbACPcFDLcFTLbACLdK0LdLkTdKEDcJD745OX45+jcHTriYmzngYLbESngTVz21tfdJzPjdX/ur7LcGTbqmqD++fnYAAD33uDvt7voiIvbISrhW1/dMjr1ztLdNUvfRFbso6Tng4vhWWTmfH7lc3pUlbFDAAAApklEQVR4AbWSAw7AAAxFO9u2cf8Tzu4W7oU/NeBPCPIGATsUzbAXGI7a42heuMNtsSQ7a1EaEVcjI8OCMhtVTR/RDB4xiuYiLJt/GlUHFlwPN/qSE4wKN1JcqED0Ehk7MUCivteMUty4kkl4Q3meABQe3hAjSQqQJY9GllU9rgGPXGieRrFaRFAzyOKlthvpS2NdPHIyib+djOA+jj3uFH+T7wf7hwE23xD0wroPdwAAAABJRU5ErkJggg==';

export const Footer: React.FC = () => {
  const { user, logout } = useAuth();
  
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  return (
    // Base styling kept identical to original
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* --- Main Grid Section (Consolidated: 3 Columns on desktop, stacking on mobile) --- */}
        {/* Original gap and mb kept for theme consistency */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-y-12 gap-x-8 mb-16">
          
          {/* 1. Logo & Description (Takes 2/4 columns on md, 2/4 on lg) */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center text-3xl font-extrabold text-gray-900 dark:text-white mb-4 transition-colors">
              <img src={ICON_BASE64} alt="Bigyann Logo" className="h-7 w-7 mr-2" />
              <span className="bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Bigyann
              </span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-sm">
              Illuminating ideas in technology, design, and modern living. Built for the curious mind.
            </p>
          </div>

          {/* 2. Quick Links (Takes 1/4 column on md/lg) */}
          <div className="col-span-1">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100 mb-5">
              Information
            </h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li><Link to="/about" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center"><LinkIcon size={14} className="mr-2 opacity-50"/>About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center"><LinkIcon size={14} className="mr-2 opacity-50"/>Contact</Link></li>
              <li className="pt-2 border-t border-gray-100 dark:border-gray-800/50"><Link to="/privacy-policy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center"><LinkIcon size={14} className="mr-2 opacity-50"/>Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center"><LinkIcon size={14} className="mr-2 opacity-50"/>Terms of Service</Link></li>
              <li><Link to="/disclaimer" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center"><LinkIcon size={14} className="mr-2 opacity-50"/>Disclaimer</Link></li>
            </ul>
          </div>

          {/* 3. Account Actions (Takes 1/4 column on md/lg) */}
          <div className="col-span-1">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100 mb-5">
              Account
            </h3>
            <ul className="space-y-3 text-sm font-medium">
              {user ? (
                <>
                  <li>
                    <Link to="/dashboard" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      <UserIcon size={16} className="mr-2" /> Dashboard
                    </Link>
                  </li>
                  <li>
                    <button 
                      onClick={handleLogout}
                      // Kept original red text styling
                      className="flex items-center text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      <LogOut size={16} className="mr-2" /> Sign Out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li><Link to="/login" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Log In</Link></li>
                  <li><Link to="/signup" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Sign Up</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* --- Divider --- */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
            
            {/* --- Copyright & Social Links (Responsive: stacked on mobile, side-by-side on desktop) --- */}
            <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-sm text-gray-500 order-2 md:order-1 mt-6 md:mt-0">
                    © 2024 Bigyann. All rights reserved.
                </p>
                {/* Social links use the gray/primary color scheme from the original component */}
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
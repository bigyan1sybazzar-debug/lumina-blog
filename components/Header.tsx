'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Menu, X, Sun, Moon, LogOut, User as UserIcon, ChevronDown } from 'lucide-react'; // Added ChevronDown
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// --- DATA STRUCTURES ---

// Define standard navigation links
const STANDARD_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'Articles', path: '/categories' },
  { name: 'AI Chat', path: '/chat' },
  { name: 'About', path: '/about' },
  { name: 'Voting', path: '/voting' },
  { name: 'Contact', path: '/contact' },
];

// Define dropdown links (Tools)
const TOOL_LINKS = [
  { name: 'My Phone Price', path: '/price/my-phone-price' },
  { name: 'EMI Calculator', path: '/tools/emi-calculator' },
  { name: 'Exchange Offer', path: '/tools/exchange-offer' },
  { name: 'AI Humanizer', path: '/ai-humanizer' },
  { name: 'Electronic Voting', path: '/voting' },
];

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false); // State for the new Tools dropdown
  const [searchQuery, setSearchQuery] = useState(''); // Search state
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Close menu and dropdowns on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    setIsToolsDropdownOpen(false); // Close tools dropdown on route change
  }, [pathname]);

  // Combined links for mobile menu (filtered to remove duplicate paths)
  const mobileLinks = [...STANDARD_LINKS, ...TOOL_LINKS].filter((link, index, self) =>
    index === self.findIndex((l) => l.path === link.path)
  );

  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      // Direct community/user search to categories/search with a 'community' flag or just the query
      // By default redirect to search results page
      router.push(`/categories?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          <Link href="https://bigyann.com.np/" className="flex items-center space-x-2 flex-shrink-0">
            <img
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAe1BMVEX////78vL45ufrlZvbACPcFDLcFTLbACLdK0LdLkTdKEDcJD745OX45+jcHTriYmzngYLbESngTVz21tfdJzPjdX/ur7LcGTbqmqD++fnYAAD33uDvt7voiIvbISrhW1/dMjr1ztLdNUvfRFbso6Tng4vhWWTmfH7lc3pUlbFDAAAApklEQVR4AbWSAw7AAAxFO9u2cf8Tzu4W7oU/NeBPCPIGATsUzbAXGI7a42heuMNtsSQ7a1EaEVcjI8OCMhtVTR/RDB4xiuYiLJt/GlUHFlwPN/qSE4wKN1JcqED0Ehk7MUCivteMUty4kkl4Q3meABQe3hAjSQqQJY9GllU9rgGPXGieRrFaRFAzyOKlthvpS2NdPHIyib+djOA+jj3uFH+T7wf7hwE23xD0wroPdwAAAABJRU5ErkJggg=="
              alt="Bigyann.com.np Logo"
              className="h-9 w-auto"
            />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">
              Bigyann
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-8">
            {STANDARD_LINKS.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary-600 dark:hover:text-primary-400 ${isActive(link.path)
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300'
                  }`}
              >
                {link.name}
              </Link>
            ))}

            {/* NEW: Tools Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
                className={`flex items-center text-sm font-medium transition-colors hover:text-primary-600 dark:hover:text-primary-400 ${isToolsDropdownOpen || TOOL_LINKS.some(link => isActive(link.path))
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300'
                  }`}
              >
                Tools
                <ChevronDown size={16} className={`ml-1 transition-transform duration-200 ${isToolsDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>

              {isToolsDropdownOpen && (
                <div className="absolute left-1/2 transform -translate-x-1/2 mt-3 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-1 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
                  {TOOL_LINKS.map((link) => (
                    <Link
                      key={link.path}
                      href={link.path}
                      className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${isActive(link.path) ? 'font-bold bg-primary-50 dark:bg-primary-900/20' : ''
                        }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Dashboard Link for Logged In Users */}
            {user && (
              <Link
                href="/admin"
                className={`text-sm font-medium transition-colors hover:text-primary-600 dark:hover:text-primary-400 ${isActive('/admin')
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300'
                  }`}
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-9 pr-4 py-1.5 text-sm rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 border-none w-36 focus:w-60 transition-all duration-300"
              />
              <button
                aria-label="Search"
                onClick={handleSearch}
                className="absolute left-3 top-2 h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Auth State */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 focus:outline-none ring-offset-2 focus:ring-2 focus:ring-primary-500 rounded-full"
                >
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 object-cover" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-1 capitalize">{user.role}</p>
                    </div>
                    <Link
                      href="/Profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600">
                  Log in
                </Link>
                <Link href="/signup" className="px-4 py-2 text-sm font-bold text-white bg-primary-600 rounded-full hover:bg-primary-700 transition-colors shadow-sm hover:shadow-primary-600/30">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile/Tablet Actions */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xl animate-in slide-in-from-top-4 duration-200">
          <div className="px-4 pt-4 pb-6 space-y-2">

            {/* Added Search Bar to Mobile/Tablet Menu */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-4 py-2.5 text-base rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Search
                className="absolute left-3 top-3 h-5 w-5 text-gray-400 cursor-pointer"
                onClick={handleSearch}
              />
            </div>

            {/* Use the combined mobileLinks for the mobile menu */}
            {mobileLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`block px-3 py-3 rounded-lg text-base font-medium ${isActive(link.path)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                {link.name}
              </Link>
            ))}

            {user && (
              <Link
                href="/admin"
                className={`block px-3 py-3 rounded-lg text-base font-medium ${isActive('/admin')
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                Dashboard
              </Link>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {user ? (
                <div className="space-y-4 px-3">
                  <div className="flex items-center space-x-3">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="pt-2 space-y-1">
                    <Link
                      href="/Profile"
                      className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      My Profile
                    </Link>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-base font-medium text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    <LogOut size={18} className="mr-2" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 px-3">
                  <Link
                    href="/login"
                    className="flex justify-center items-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="flex justify-center items-center px-4 py-3 bg-primary-600 rounded-xl text-sm font-bold text-white hover:bg-primary-700 shadow-lg shadow-primary-600/20"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
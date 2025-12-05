import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { BlogPostPage } from './pages/BlogPost';
import { Categories } from './pages/Categories';
import { Admin } from './pages/Admin';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HelmetProvider } from 'react-helmet-async';
// URL from Admin.tsx
const SITEMAP_URL = 'https://ulganzkpfwuuglxj.public.blob.vercel-storage.com/sitemap.xml';

const SitemapRedirect = () => {
  useEffect(() => {
    window.location.href = SITEMAP_URL;
  }, []);
  return (
    <div className="flex items-center justify-center min-h-screen text-gray-500">
      Redirecting to sitemap...
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isSitemap = location.pathname === '/sitemap.xml';
  return (
    <div className="flex flex-col min-h-screen">
      {!isAdmin && !isAuthPage && !isSitemap && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {!isAdmin && !isAuthPage && !isSitemap && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <HelmetProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              {/* *** REDIRECT IMPLEMENTATION START ***
                
                The old path (relative to the base URL bigyann.com.np) is:
                /2025/11/Yono-tv-live.html
                
                The new path (relative to the base URL bigyann.com.np) is:
                /blog/yono-tv-npl-live-streaming
                
                We use the <Navigate /> component to redirect the user.
              */}
              <Route 
                path="/2025/11/Yono-tv-live.html" 
                element={<Navigate to="/blog/yono-tv-npl-live-streaming" replace />} 
              />
              {/* *** REDIRECT IMPLEMENTATION END ***
              */}
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/categories" element={<Categories />} />
                            <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
                            {/* Redirect /sitemap.xml to the actual blob URL */}
              <Route path="/sitemap.xml" element={<SitemapRedirect />} />
              {/* Admin/Dashboard Route: Accessible to any logged in user, role checks inside */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin={false}>
                    <Admin />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
        </BrowserRouter>
      </HelmetProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

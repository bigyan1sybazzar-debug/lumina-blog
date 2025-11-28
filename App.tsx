import React, { Children } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { BlogPostPage } from './pages/BlogPost';
import { Categories } from './pages/Categories';
import { CategoryPage } from './pages/CategoryPage';
import { Admin } from './pages/Admin';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ProtectedRoute } from './components/ProtectedRoute';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdmin && !isAuthPage && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {!isAdmin && !isAuthPage && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/blog/:id" element={<BlogPostPage />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/category/:categoryName" element={<CategoryPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
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
        </HashRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
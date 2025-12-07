import React from 'react';
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
import ChatAssistant from "./pages/ChatAssistant"// Your added pages
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Disclaimer from './pages/Disclaimer';
import LiveFootball from './pages/LiveFootball';

// Slick Carousel CSS (optional, keep if you're using carousels)
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Layout component — hides Header/Footer on admin, auth, and pure asset routes
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const noLayoutPaths = [
    '/login',
    '/signup',
    '/sitemap.xml',        // even if someone hits it via React (won't happen with public file)
    '/robots.txt',
  ];

  const isAdmin = location.pathname.startsWith('/admin');
  const shouldHideLayout = isAdmin || noLayoutPaths.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {!shouldHideLayout && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {!shouldHideLayout && <Footer />}
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
                {/* Core Pages */}
                <Route path="/" element={<Home />} />
                <Route path="/live-football" element={<LiveFootball />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/chat" element={<ChatAssistant />} />
                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Legal & Info Pages */}
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/disclaimer" element={<Disclaimer />} />

                {/* Legacy Redirects */}
                <Route
                  path="/2025/11/Yono-tv-live.html"
                  element={<Navigate to="/blog/yono-tv-npl-live-streaming" replace />}
                />

                {/* Admin Dashboard */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute requireAdmin={false}>
                      <Admin />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </HelmetProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
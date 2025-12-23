import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
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
import { HelmetProvider, Helmet } from 'react-helmet-async';
import ChatAssistant from "./pages/ChatAssistant";
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Disclaimer from './pages/Disclaimer';
import LiveFootball from './pages/LiveFootball';
import { MyPhonePrice } from './pages/My-phone-price';
import { Emicalculator } from './pages/Emicalculator';
import { ExchangeOffer } from './pages/ExchangeOffer';
import { SubmissionGuidePage } from './pages/Submission-guide';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const SITE_URL = 'https://bigyann.com.np';

// ------------------------------------------------------------------
// Main Layout – Applies to most pages (header, footer, base canonical)
// ------------------------------------------------------------------
const MainLayout: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // 1. HARD REDIRECT LOGIC
  // This catches any URL ending in /default and moves it to the clean version
  useEffect(() => {
    if (pathname.toLowerCase().endsWith('/default')) {
      // Remove '/default' from the end. If the result is empty, go to '/'
      const cleanPath = pathname.replace(/\/default$/i, '') || '/';
      
      // Use replace: true so it doesn't mess up the browser history
      navigate(cleanPath, { replace: true });
    }
  }, [pathname, navigate]);

  // 2. CANONICAL URL GENERATION
  // We ensure the canonical is always the clean, non-www version
  const cleanPathname = pathname.replace(/\/+$/, '') || '';
  const canonicalUrl = `${SITE_URL}${cleanPathname}`;

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <Header />
      <main className="flex-grow">
        <Outlet />  {/* Renders the matched child route */}
      </main>
      <Footer />
    </div>
  );
};

// ------------------------------------------------------------------
// Minimal Layout – For auth pages (no header/footer)
// ------------------------------------------------------------------
const MinimalLayout: React.FC = () => {
  return <Outlet />;
};

// ------------------------------------------------------------------
// App Component
// ------------------------------------------------------------------
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <HelmetProvider>
          <BrowserRouter>
            <Routes>
              {/* Pages with full layout (header + footer + base canonical) */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/:slug" element={<BlogPostPage />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/chat" element={<ChatAssistant />} />
                <Route path="/live-football" element={<LiveFootball />} />
                <Route path="/tools/emi-calculator" element={<Emicalculator />} />
                <Route path="/tools/exchange-offer" element={<ExchangeOffer />} />
                <Route path="/author-guide" element={<SubmissionGuidePage />} />
                <Route path="/price/my-phone-price" element={<MyPhonePrice />} />

                {/* Legal pages */}
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/disclaimer" element={<Disclaimer />} />

                {/* Legacy redirects */}
                <Route
                  path="/2025/11/Yono-tv-live.html"
                  element={<Navigate to="/blog/yono-tv-npl-live-streaming" replace />}
                />
                <Route
                  path="/blog/fm3g9qgx4JGycFGkc3M3"
                  element={<Navigate to="/blog/samsung-galaxy-a24-price-in-nepal" replace />}
                />
              </Route>

              {/* Pages with minimal/no layout */}
              <Route element={<MinimalLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Admin */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute requireAdmin={false}>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* 404 Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </HelmetProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
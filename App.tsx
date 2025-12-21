import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
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
  const location = useLocation();
  const pathname = location.pathname;

  let canonicalUrl = SITE_URL + pathname;

  // Special case: treat /default as homepage
  if (pathname === '/default') {
    canonicalUrl = SITE_URL + '/';
  }

  // Remove trailing slashes (except for root)
  canonicalUrl = canonicalUrl.replace(/\/+$/, '') || SITE_URL + '/';

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <link rel="canonical" href={canonicalUrl} data-rh="true" />
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
// Minimal Layout – For auth pages, sitemap, robots.txt, etc. (no header/footer)
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

                {/* Admin – protected but minimal layout (or you can make a separate AdminLayout if needed) */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute requireAdmin={false}>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Static files (optional – if served separately, remove these) */}
              {/* <Route path="/sitemap.xml" element={<Sitemap />} /> */}
              {/* <Route path="/robots.txt" element={<Robots />} /> */}

              {/* 404 Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </HelmetProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
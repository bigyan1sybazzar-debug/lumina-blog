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
import { HelmetProvider, Helmet } from 'react-helmet-async';
import ChatAssistant from "./pages/ChatAssistant"
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

// Layout component — handles canonical & hides Header/Footer on specific paths
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const noLayoutPaths = [
    '/login',
    '/signup',
    '/sitemap.xml',
    '/robots.txt',
    '/price/my-phone-price',
  ];

  const isAdmin = pathname.startsWith('/admin');
  const shouldHideLayout = isAdmin || noLayoutPaths.includes(pathname);

  // --- Canonical URL logic ---
  let canonicalUrl = SITE_URL + pathname;

  if (pathname === '/default') {
    canonicalUrl = SITE_URL + '/';
  }

  canonicalUrl = canonicalUrl.replace(/\/+$/, ''); // Remove trailing slash

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <link rel="canonical" href={canonicalUrl} data-rh="true" />
      </Helmet>

      {!shouldHideLayout && <Header />}
      <main className="flex-grow">{children}</main>
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
                <Route path="/author-guide" element={<SubmissionGuidePage />} />
                <Route path="/tools/exchange-offer" element={<ExchangeOffer />} />
                <Route path="/" element={<Home />} />
                <Route path="/live-football" element={<LiveFootball />} />
                <Route path="/:slug" element={<BlogPostPage />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/chat" element={<ChatAssistant />} />
                <Route path="/tools/emi-calculator" element={<Emicalculator />} />
                <Route path="/price/my-phone-price" element={<MyPhonePrice />} />

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
                <Route
                  path="/blog/fm3g9qgx4JGycFGkc3M3"
                  element={<Navigate to="/blog/samsung-galaxy-a24-price-in-nepal" replace />}
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

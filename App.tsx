import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate, Link } from 'react-router-dom';
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
import VideoDownloader from './pages/VideoDownloader';
import TempMailTool from './pages/TempMailTool';
import AITranslator from'./pages/AITranslator';
import ResumeChecker from './pages/ResumeChecker';
import { notifyIndexNow } from './services/indexingService';

const SITE_URL = 'https://www.bigyann.com.np';

// ------------------------------------------------------------------
// Main Layout: Handles Header, Footer, SEO, and IndexNow notifications
// ------------------------------------------------------------------
const MainLayout: React.FC = () => {
  const { pathname } = useLocation();

  /**
   * IndexNow Integration:
   * Notifies engines whenever a user (or crawler) lands on a page.
   */
  useEffect(() => {
    notifyIndexNow([pathname]);
  }, [pathname]);

  /**
   * SEO FIX: Universal Canonical URL Logic
   * This ensures EVERY page (blog, tool, or home) has a <link rel="canonical" />
   * It removes trailing slashes and combines with your SITE_URL.
   */
  const cleanPathname = pathname === "/" ? "" : pathname.replace(/\/+$/, '');
  const canonicalUrl = `${SITE_URL}${cleanPathname}`;

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        {/* FIX: Always provide a canonical link to avoid "No canonical link tag found" errors */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Universal indexing allowed tag */}
        <meta name="robots" content="index, follow" />
      </Helmet>
      
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// ------------------------------------------------------------------
// App Component: Central Routing
// ------------------------------------------------------------------
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <HelmetProvider>
          <BrowserRouter>
            <Routes>
              {/* Pages using the standard layout */}
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
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
                <Route path="/tools/temp-mail" element={<TempMailTool />} />
                <Route path="/tools/video-downloader" element={<VideoDownloader />} />
                <Route path="/tools/ai-translator" element={<AITranslator />} />
                <Route path="/tools/resume-checker" element={<ResumeChecker />} />
              </Route>

              {/* Auth & Admin Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />

              {/* 404 Handling with SEO No-Index */}
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-gray-50 dark:bg-gray-900">
                  <Helmet>
                    <title>404 - Page Not Found | Bigyann</title>
                    <meta name="robots" content="noindex, nofollow" />
                    {/* No canonical for 404 pages */}
                  </Helmet>
                  <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
                  <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">Page Not Found</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    The link might be broken or the page has been moved.
                  </p>
                  <Link 
                    to="/" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-full transition-all"
                  >
                    Return Home
                  </Link>
                </div>
              } />
            </Routes>
          </BrowserRouter>
        </HelmetProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
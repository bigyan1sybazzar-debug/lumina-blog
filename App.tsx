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

const MainLayout: React.FC = () => {
  const { pathname } = useLocation();

  // Canonical logic: Force non-www and remove trailing slashes
  const cleanPathname = pathname === "/" ? "" : pathname.replace(/\/+$/, '');
  const canonicalUrl = `${SITE_URL}${cleanPathname}`;

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <HelmetProvider>
          <BrowserRouter>
            <Routes>
              {/* Main Site Routes */}
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
              </Route>

              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/admin/*" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

              {/* 404 Fallback: Instead of redirecting to '/', show a 404 message. 
                  This stops Google from indexing random URLs as duplicates of the homepage. */}
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                  <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                  <p className="mb-8 text-gray-600">The page you're looking for doesn't exist.</p>
                  <a href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg">Go Home</a>
                </div>
              } />
            </Routes>
          </BrowserRouter>
        </HelmetProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
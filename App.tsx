import React from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'

import HelmetProviderWrapper from './src/providers/HelmetProviderWrapper'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ProtectedRoute } from './components/ProtectedRoute'

// Pages
import { Home } from './pages/Home'
import { BlogPostPage } from './pages/BlogPost'
import { Categories } from './pages/Categories'
import { Admin } from './pages/Admin'
import { About } from './pages/About'
import { Contact } from './pages/Contact'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import ChatAssistant from './pages/ChatAssistant'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Disclaimer from './pages/Disclaimer'
import LiveFootball from './pages/LiveFootball'
import { MyPhonePrice } from './pages/My-phone-price'
import { Emicalculator } from './pages/Emicalculator'
import { ExchangeOffer } from './pages/ExchangeOffer'
import { SubmissionGuidePage } from './pages/Submission-guide'

// Slick Carousel CSS
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

/**
 * Layout Component
 * Wrapped by HelmetProvider at App root (SSG + SSR safe)
 */
const Layout: React.FC = () => {
  const location = useLocation()

  const noLayoutPaths = [
    '/login',
    '/signup',
    '/sitemap.xml',
    '/robots.txt',
    '/price/my-phone-price',
  ]

  const cleanPath = location.pathname?.split('?')[0].split('#')[0] || '/'
  const isAdmin = cleanPath.startsWith('/admin')
  const shouldHideLayout = isAdmin || noLayoutPaths.includes(cleanPath)

  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
          {!shouldHideLayout && (
            <header className="bg-white/80 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-50 shadow-sm">
              <div className="max-w-7xl mx-auto px-4">
                <Header />
              </div>
            </header>
          )}

          <main className="flex-grow">
            <Outlet />
          </main>

          {!shouldHideLayout && (
            <footer className="bg-gray-900/95 text-white/90 border-t border-gray-800/50 mt-auto py-8">
              <div className="max-w-7xl mx-auto px-4">
                <Footer />
              </div>
            </footer>
          )}
        </div>
      </ThemeProvider>
    </AuthProvider>
  )
}

/**
 * Root App Component
 * HelmetProvider MUST be here (Node 24 compatible)
 */
export default function App() {
  return (
    <HelmetProviderWrapper>
      <Outlet />
    </HelmetProviderWrapper>
  )
}

/**
 * Vite React SSG Routes
 */
export const routes: import('vite-react-ssg').RouteRecord[] = [
  {
    path: '/',
    Component: Layout,
    children: [
      { path: '/', Component: Home },
      { path: '/author-guide', Component: SubmissionGuidePage },
      { path: '/tools/exchange-offer', Component: ExchangeOffer },
      { path: '/live-football', Component: LiveFootball },
      { path: '/categories', Component: Categories },
      { path: '/about', Component: About },
      { path: '/contact', Component: Contact },
      { path: '/chat', Component: ChatAssistant },
      { path: '/tools/emi-calculator', Component: Emicalculator },
      { path: '/price/my-phone-price', Component: MyPhonePrice },
      { path: '/login', Component: Login },
      { path: '/signup', Component: Signup },
      { path: '/privacy-policy', Component: PrivacyPolicy },
      { path: '/terms-of-service', Component: TermsOfService },
      { path: '/disclaimer', Component: Disclaimer },
      { path: '/:slug', Component: BlogPostPage },

      // Legacy redirects
      {
        path: '/2025/11/Yono-tv-live.html',
        Component: () => <Navigate to="/yono-tv-npl-live-streaming" replace />,
      },
      {
        path: '/blog/fm3g9qgx4JGycFGkc3M3',
        Component: () => <Navigate to="/samsung-galaxy-a24-price-in-nepal" replace />,
      },

      // Admin (Protected)
      {
        path: '/admin/*',
        Component: () => (
          <ProtectedRoute requireAdmin={false}>
            <Admin />
          </ProtectedRoute>
        ),
      },

      // 404 fallback
      {
        path: '*',
        Component: () => <Navigate to="/" replace />,
      },
    ],
  },
]

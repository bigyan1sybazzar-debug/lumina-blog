import React from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteRecord } from 'vite-react-ssg';

import { Home } from '../pages/Home';
import { BlogPostPage } from '../pages/BlogPost';
import { Categories } from '../pages/Categories';
import { Admin } from '../pages/Admin';
import { About } from '../pages/About';
import { Contact } from '../pages/Contact';
import { Login } from '../pages/Login';
import { Signup } from '../pages/Signup';
import ChatAssistant from "../pages/ChatAssistant";
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfService from '../pages/TermsOfService';
import Disclaimer from '../pages/Disclaimer';
import LiveFootball from '../pages/LiveFootball';
import { MyPhonePrice } from '../pages/My-phone-price';
import { Emicalculator } from '../pages/Emicalculator';
import { ExchangeOffer } from '../pages/ExchangeOffer';
import { SubmissionGuidePage } from '../pages/Submission-guide';

// Optional: Create reusable redirect components if you have many
const RedirectToYonoTv = () => <Navigate to="/yono-tv-npl-live-streaming" replace />;
const RedirectToSamsung = () => <Navigate to="/samsung-galaxy-a24-price-in-nepal" replace />;
const RedirectToHome = () => <Navigate to="/" replace />;

export const routes: RouteRecord[] = [
  { path: "/", Component: Home },
  { path: "/author-guide", Component: SubmissionGuidePage },
  { path: "/tools/exchange-offer", Component: ExchangeOffer },
  { path: "/live-football", Component: LiveFootball },
  { path: "/categories", Component: Categories },
  { path: "/about", Component: About },
  { path: "/contact", Component: Contact },
  { path: "/chat", Component: ChatAssistant },
  { path: "/tools/emi-calculator", Component: Emicalculator },
  { path: "/price/my-phone-price", Component: MyPhonePrice },
  { path: "/login", Component: Login },
  { path: "/signup", Component: Signup },
  { path: "/privacy-policy", Component: PrivacyPolicy },
  { path: "/terms-of-service", Component: TermsOfService },
  { path: "/disclaimer", Component: Disclaimer },
  { path: "/:slug", Component: BlogPostPage },

  // Redirect routes - now using Component
  {
    path: "/2025/11/Yono-tv-live.html",
    Component: RedirectToYonoTv,
  },
  {
    path: "/fm3g9qgx4JGycFGkc3M3",
    Component: RedirectToSamsung,
  },

  // Admin wildcard route
  { path: "/admin/*", Component: Admin },

  // Catch-all 404 redirect
  { path: "*", Component: RedirectToHome },
];
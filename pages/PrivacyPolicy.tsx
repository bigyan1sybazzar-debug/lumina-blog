// pages/PrivacyPolicy.tsx
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline mb-8 text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: December 2025</p>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
              <p>
                Welcome to <strong>Bigyann</strong>. We respect your privacy and are committed to protecting your personal data.
                This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Data We Collect</h2>
              <p>We may collect, use, store and transfer different kinds of personal data about you:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Identity Data:</strong> first name, last name, username</li>
                <li><strong>Contact Data:</strong> email address</li>
                <li><strong>Technical Data:</strong> IP address, browser type, timezone, operating system</li>
                <li><strong>Usage Data:</strong> information about how you use our website and services</li>
                <li><strong>Profile Data:</strong> your interests, preferences, feedback</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. How We Use Your Data</h2>
              <p>We use your data to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Deliver and improve our content and services</li>
                <li>Send you personalized recommendations and newsletters (with consent)</li>
                <li>Analyze how visitors use our site</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Data Security</h2>
              <p>
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way.
                We use HTTPS, secure authentication, and limit access to your data to authorized personnel only.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Third-Party Services</h2>
              <p>
                We use Firebase (Google) for authentication, hosting, and analytics. Your data is processed according to Google's Privacy Policy.
                We do not sell your personal data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt out of marketing communications</li>
              </ul>
              <p className="mt-4">Contact us at: <a href="mailto:privacy@bigyann.com.np" className="text-primary-600 underline">privacy@bigyann.com.np</a></p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:<br />
                <strong>Email:</strong> <a href="mailto:hello@bigyann.com.np" className="text-primary-600 underline">hello@bigyann.com.np</a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500">
            © 2025 Bigyann. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
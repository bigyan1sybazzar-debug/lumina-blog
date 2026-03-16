// pages/Disclaimer.tsx
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const Disclaimer = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline mb-8 text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Disclaimer
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: December 2025</p>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. No Professional Advice</h2>
              <p>Content on **Bigyann** is for **informational purposes only** and is not intended as a substitute for professional advice (e.g., financial, legal, medical, or technical). Always seek the advice of a qualified professional for any specific questions or concerns.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. AI-Generated Content</h2>
              <p>Some articles or sections of content on this website may be partially or fully **AI-generated**. While we strive for accuracy and review content, errors or outdated information may occur. Always verify important information from primary sources.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. External Links</h2>
              <p>We provide links to third-party websites for convenience. These links do not imply endorsement, and we are **not responsible for the content, accuracy, or availability** of these external sites.</p>
            </section>

            {/* --- ADSense-Specific Section Added --- */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Advertisement Disclaimer (Google AdSense)</h2>
              <p>
                This website uses **Google AdSense** to serve advertisements. Google, as a third-party vendor, uses cookies to serve ads based on a user's prior visits to this website or other websites.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our sites and/or other sites on the Internet.</li>
                <li>You may **opt out** of personalized advertising by visiting the <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">Google Ads Settings page</a>.</li>
                <li>We have **no control** over the cookies placed by third-party advertisers.</li>
              </ul>
            </section>
            {/* --- ADSense-Specific Section End --- */}

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. No Guarantees</h2>
              <p>The site and all content, services, and features are provided **"as is"** and **"as available"** without any warranties of any kind, either express or implied, including, but not limited to, the implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee the accuracy, completeness, or availability of the site.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Contact</h2>
              <p>If you have any questions about this Disclaimer, please contact us:</p>
              <p>Email: <a href="mailto:hello@bigyann.com.np" className="text-primary-600 underline">hello@bigyann.com.np</a></p>
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

export default Disclaimer;
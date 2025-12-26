// pages/TermsOfService.tsx
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline mb-8 text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Effective: December 2025</p>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
              <p>By accessing or using **Bigyann**, you agree to be bound by these Terms of Service and our **Privacy Policy**. If you do not agree to these terms, please do not use the site.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Use of Service and Prohibited Conduct</h2>
              <p>You agree to use the platform lawfully and respectfully. You must not use the site to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Engage in spamming, harassment, or illegal activities.</li>
                <li>Post content that is defamatory, obscene, sexually explicit, abusive, or promotes hate speech or discrimination.</li>
                <li>Infringe upon the intellectual property or proprietary rights of others.</li>
                <li>Distribute viruses or other malicious computer code.</li>
              </ul>
              <p className="mt-4">**Violations of these rules may lead to immediate account termination.**</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Content Ownership and License</h2>
              <p>You retain **ownership** of any content you submit, post, or display on or through the service. By posting content, you grant **Bigyann** a worldwide, non-exclusive, royalty-free license (with the right to sublicense) to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute such content in any and all media or distribution methods (now known or later developed) for the purpose of operating, promoting, and improving the service.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Termination</h2>
              <p>We may suspend or terminate your access to the service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you **breach these Terms**.</p>
            </section>

            {/* --- Added Legal Sections for robustness --- */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Disclaimers</h2>
              <p>
                The service is provided on an **"AS IS"** and **"AS AVAILABLE"** basis. Bigyann makes no warranties, expressed or implied, regarding the operation or availability of the site or the content provided. We do not warrant that the service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Limitation of Liability</h2>
              <p>
                In no event shall **Bigyann**, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use, or alteration of your transmissions or content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Governing Law</h2>
              <p>These Terms shall be governed and construed in accordance with the laws of **[Insert Your Jurisdiction/Country]**, without regard to its conflict of law provisions.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Changes to Terms</h2>
              <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Contact Information</h2>
              <p>If you have any questions about these Terms, please contact us:</p>
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

export default TermsOfService;
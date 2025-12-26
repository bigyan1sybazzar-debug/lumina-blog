'use client';

import React, { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';

export const Contact: React.FC = () => {
    // 1. State to capture form inputs
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    // The target WhatsApp number (must be encoded)
    const whatsappNumber = '9779805671898';

    // 2. Handle form submission (redirect to WhatsApp)
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Construct the pre-filled message content
        const prefilledMessage = `Hello Bigyann!%0A%0A*Name:* ${name}%0A*Email:* ${email}%0A*Message:* ${message}`;

        // Create the WhatsApp link
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(prefilledMessage)}`;

        // Open the WhatsApp link in a new tab
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Let's Talk</h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-12">
                            Have a project in mind, a question about an article, or just want to say hi? Fill out the form or reach out directly.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                    <Mail className="text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Email</h3>
                                    <p className="text-gray-600 dark:text-gray-400">bigyan.neupane6@gmail.com</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                    <MapPin className="text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Location</h3>
                                    <p className="text-gray-600 dark:text-gray-400">kathmandu,Nepal</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
                        {/* 3. Attach new handleSubmit function */}
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                    placeholder="John Doe"
                                    // 4. Bind value and update state on change
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                    placeholder="john@example.com"
                                    // 4. Bind value and update state on change
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
                                <textarea
                                    id="message"
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                    placeholder="How can we help?"
                                    // 4. Bind value and update state on change
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                ></textarea>
                            </div>
                            {/* The button will now trigger the handleSubmit function which opens WhatsApp */}
                            <button
                                type="submit" // Important to keep this as submit to trigger the form onSubmit handler
                                className="w-full py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Send Message
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};
export default Contact;
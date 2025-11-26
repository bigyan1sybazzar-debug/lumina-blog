import React from 'react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-16 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <img 
            src="https://picsum.photos/200/200?random=50" 
            alt="Author" 
            className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-white dark:border-gray-800 shadow-xl"
          />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Hey, I'm Alex.</h1>
          <p className="text-xl text-primary-600 dark:text-primary-400 font-medium">Developer, Writer, & Creator</p>
        </div>

        <div className="prose prose-lg dark:prose-invert mx-auto">
          <p>
            Welcome to Lumina! I started this blog as a way to document my journey through the ever-evolving landscape of technology. What began as a simple collection of coding notes has grown into a platform for sharing deep dives into web development, design systems, and the future of tech.
          </p>
          <p>
            My mission is simple: <strong>Make complex topics accessible.</strong> Whether you're a junior developer trying to understand React hooks or a product manager looking to leverage AI, I write for you.
          </p>
          
          <h3>My Background</h3>
          <ul>
            <li>Senior Frontend Engineer at TechCorp (2020-Present)</li>
            <li>Open Source Contributor</li>
            <li>Speaker at JSConf 2023</li>
          </ul>

          <blockquote>
            "The best way to learn is to teach."
          </blockquote>
        </div>

        <div className="mt-16 text-center">
          <button className="px-8 py-3 bg-primary-600 text-white rounded-full font-bold hover:bg-primary-700 transition-colors shadow-lg">
            Work With Me
          </button>
        </div>

      </div>
    </div>
  );
};

import React from "react";
import { Briefcase, MapPin, Calendar } from "lucide-react";

export const About: React.FC = () => {
  const experiences = [
    {
      role: "Search Engine Optimization Specialist",
      company: "AxcessRent",
      type: "Part-time",
      period: "Dec 2024 - Present · 1 yr",
      location: "United States · Remote",
      description: [
        "Conducting thorough website audits to resolve technical SEO issues.",
        "Boosting Google rankings with targeted keyword optimization.",
        "Implementing latest SEO tactics for better traffic & conversions.",
        "Running content gap analysis & developing SEO plans.",
        "Monitoring traffic using GA4, GSC & Bing Webmaster Tools.",
        "Optimizing existing content for relevancy and conversions.",
      ],
    },
    {
      role: "Chief Technology Officer (Web Developer & SEO Manager)",
      company: "AppFlicks",
      type: "Contract",
      period: "Mar 2024 - Present · 1 yr 9 mos",
      location: "Singapore · Remote",
      description: [
        "Advanced full-stack development with SEO specialization.",
        "Custom WordPress theme & plugin development.",
        "End-to-end website development with UX-focused design.",
        "Creating scalable, SEO-optimized systems for high performance.",
      ],
    },
    {
      role: "SEO Expert & Ads Manager",
      company: "Sybazzar.com",
      type: "Full-time",
      period: "Jun 2023 - Nov 2024 · 1 yr 6 mos",
      location: "Pepsicola Kathmandu · On-site",
      description: [
        "Ranked 4000+ keywords on Google.",
        "Conducted full SEO audits & implemented ranking strategies.",
        "Managed Google Ads & Meta Ads for best ROI.",
        "Developed SEO plans & optimized site performance.",
      ],
    },
    {
      role: "SEO Expert & Ads Manager",
      company: "Digital Marina",
      type: "Part-time",
      period: "Oct 2023 - Oct 2024 · 1 yr 1 mo",
      location: "Dubai · Remote",
      description: [
        "Improved organic traffic & rankings with complete SEO strategy.",
        "Managed Google Ads campaigns & optimized ad budgets.",
        "Performed audits & technical SEO improvements.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-20 pb-24">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <img
            src="https://appflicks.com/wp-content/uploads/2025/08/FB_IMG_16036454436998781.jpg"
            alt="Bigyan Neupane"
            className="w-36 h-36 rounded-full mx-auto mb-6 border-4 border-primary-500 shadow-xl object-cover"
          />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Hey, I'm Bigyan Neupane</h1>
          <p className="text-primary-500 text-lg font-medium mt-2">
            SEO Expert • Full Stack Developer • Digital Strategist
          </p>
        </div>

        {/* Bio */}
        <div className="prose prose-lg dark:prose-invert mx-auto mb-16">
          <p>
            I'm a passionate <strong>SEO expert and full-stack developer</strong> with years of experience transforming businesses online.  
            From ranking thousands of keywords on Google to building fast, scalable WordPress platforms — I help brands grow through
            clean development, advanced SEO, and high-performing ad strategies.
          </p>

          <blockquote>
            “Your website is your biggest digital asset — optimize it like one.”
          </blockquote>
        </div>

        {/* Work Experience Cards */}
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Work Experience
        </h2> 

        <div className="grid gap-8">
          {experiences.map((exp, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl shadow-lg bg-gray-50 dark:bg-gray-800 hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{exp.role}</h3>
              <p className="text-primary-600 dark:text-primary-400 font-semibold mt-1">
                {exp.company} · {exp.type}
              </p>

              <div className="flex flex-wrap gap-6 mt-4 text-gray-600 dark:text-gray-300 text-sm">
                <span className="flex items-center gap-2">
                  <Calendar size={16} /> {exp.period}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={16} /> {exp.location}
                </span>
              </div>

              <ul className="list-disc ml-6 mt-4 space-y-2 text-gray-700 dark:text-gray-300">
                {exp.description.map((item, i) => (
                  <li key={i}>{item}</li>    
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <button className="px-10 py-4 bg-primary-600 text-white rounded-full font-bold hover:bg-primary-700 transition-colors shadow-xl text-lg">
            Work With Me
          </button>
          <button className="px-10 py-4 bg-primary-600 text-white rounded-full font-bold hover:bg-primary-700 transition-colors shadow-xl text-lg">
            Work With Me
          </button>
        </div>
      </div>
    </div>
  );
};

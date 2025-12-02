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
        <a
  href="https://wa.me/9779805671898?text=Hi!%20I'm%20interested%20in%20working%20with%20you%20-%20saw%20your%20Lumina%20Blog%20"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-[#25D366] hover:bg-[#128C7E] active:bg-[#0DA66B] text-white font-bold rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-200"
>
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 21.5c-2.5 0-4.8-.9-6.6-2.4l-.4-.3-4.1.9 1-4-.3-.4C3.9 12.8 3 10.5 3 8c0-5 4-9 9-9s9 4 9 9-4 9-9 9zm0-16c-3.9 0-7 3.1-7 7 0 1.5.5 2.9 1.3 4.1l.8 1.2-1.1.7.7-1.1 1.2.8c1.2.8 2.6 1.3 4.1 1.3 3.9 0 7-3.1 7-7s-3.1-7-7-7z"/>
  </svg>
  Work With Me on WhatsApp
</a>
        </div>
      </div>
    </div>
  );
};

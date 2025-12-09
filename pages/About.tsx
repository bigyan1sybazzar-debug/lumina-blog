import React, { useState, useEffect, useRef } from "react";
import {
  Briefcase, MapPin, Calendar, ChevronDown, ChevronUp,
  Award, Trophy, Target, Code, Globe, TrendingUp,
  Laptop, Palette, Sparkles, CheckCircle
} from "lucide-react";
import { Helmet } from "react-helmet-async";

// Define an interface for type safety (optional but good practice)
interface Skill {
    name: string;
    level: number;
    color: string; // Added color property
}

interface Experience {
    role: string;
    company: string;
    type: string;
    period: string;
    location: string;
    description: string[];
    icon: JSX.Element;
    metrics: string[];
}

export const About: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  // Initialize animatedSkills to false so the animation starts when the observer hits
  const [animatedSkills, setAnimatedSkills] = useState<boolean[]>([]);

  const skillsRef = useRef<HTMLDivElement>(null);

  const experiences: Experience[] = [
    {
      role: "Search Engine Optimization Specialist",
      company: "AxcessRent",
      type: "Part-time",
      period: "Dec 2024 – Present",
      location: "United States · Remote",
      description: [
        "Conducting in-depth technical SEO audits to resolve critical issues.",
        "Performing advanced keyword research and ranking high-intent terms on Google Page 1.",
        "Implementing cutting-edge SEO strategies aligned with latest algorithm updates.",
        "Driving 150%+ organic traffic growth using data-driven content & technical optimization.",
        "Monitoring performance via GA4, Google Search Console, and advanced tracking tools.",
        "Optimizing content for user intent, E-E-A-T, and maximum conversion impact.",
        "Collaborating with dev teams to implement Core Web Vitals improvements."
      ],
      icon: <Target className="w-5 h-5 text-indigo-500" />,
      metrics: ["95% Audit Score", "150% Traffic Growth", "Page 1 Rankings"]
    },
    {
      role: "Chief Technology Officer (Web Developer & SEO Manager)",
      company: "AppFlicks",
      type: "Contract",
      period: "Mar 2024 – Present",
      location: "Singapore · Remote",
      description: [
        "Leading full-stack development with built-in SEO architecture.",
        "Building custom WordPress themes & plugins with 0.8s average load time.",
        "Delivering 30+ high-performance, mobile-first, SEO-optimized websites.",
        "Ensuring 100% Core Web Vitals passing scores and flawless user experience."
      ],
      icon: <Code className="w-5 h-5 text-red-500" />,
      metrics: ["30+ Projects", "0.8s Load Time", "100% Satisfaction"]
    },
    {
      role: "SEO Expert & Ads Manager",
      company: "Sybazzar.com",
      type: "Full-time",
      period: "Jun 2023 – Nov 2024",
      location: "Kathmandu, Nepal · On-site",
      description: [
        "Ranked over 4,000+ keywords on Google Page 1 in competitive Nepali market.",
        "Managed high-ROI Google Ads & Meta Ads campaigns for e-commerce brands.",
        "Led full SEO strategy from audit to execution with measurable growth.",
        "Improved site speed, mobile UX, and structured data implementation."
      ],
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
      metrics: ["4000+ Keywords", "85% ROI", "Top 3 Rankings"]
    },
    {
      role: "SEO Expert & Ads Manager",
      company: "Digital Marina",
      type: "Part-time",
      period: "Oct 2023 – Oct 2024",
      location: "Dubai, United Arab Emirates · Remote",
      description: [
        "Increased organic traffic and rankings through complete SEO overhauls.",
        "Managed Google Ads campaigns with budget optimization and high conversion focus.",
        "Performed technical audits, fixed crawl errors, and improved site architecture.",
        "Delivered monthly reports with actionable insights and growth tracking."
      ],
      icon: <Globe className="w-5 h-5 text-blue-500" />,
      metrics: ["200% Traffic Growth", "40% Ad Cost Reduction", "Global Reach"]
    },
    {
      role: "Digital Marketing & Web Developer",
      company: "VANI Engineering and IT Solution",
      type: "Full-time",
      period: "May 2020 – Apr 2023",
      location: "Shantinagar, Kathmandu · On-site",
      description: [
        "Built 20+ websites for NGOs, businesses, and e-commerce brands.",
        "Designed graphics, logos, and marketing materials aligned with brand identity.",
        "Ran targeted Meta & Google Ads campaigns to boost leads and sales.",
        "Managed bulk email marketing and customer outreach campaigns."
      ],
      icon: <Laptop className="w-5 h-5 text-yellow-500" />,
      metrics: ["20+ Websites", "High Conversion Ads", "Full Digital Solutions"]
    },
    {
      role: "Web Developer & SEO Expert",
      company: "Building Materials Nepal",
      type: "Part-time",
      period: "Feb 2019 – Nov 2020",
      location: "Sattobato, Kathmandu · Hybrid",
      description: [
        "Designed and developed user-friendly, SEO-optimized websites.",
        "Improved site structure, speed, and keyword performance for better rankings.",
        "Ran Google and Facebook ad campaigns to increase inquiries and sales.",
        "Implemented on-page, off-page, and technical SEO best practices."
      ],
      icon: <Palette className="w-5 h-5 text-pink-500" />,
      metrics: ["Faster Sites", "Higher Sales", "Better Visibility"]
    },
    {
      role: "Web Developer (Intern)",
      company: "Greenmandu.com",
      type: "Internship",
      period: "Nov 2018 – Feb 2019",
      location: "Balkumari, Nepal · Remote",
      description: [
        "Learned professional WordPress development and theme customization.",
        "Got introduced to SEO fundamentals and social media advertising.",
        "Assisted in building and maintaining client websites."
      ],
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      metrics: ["First Step", "Solid Foundation", "Real Projects"]
    }
  ];

  // Added distinct color gradients for each skill
  const skills: Skill[] = [
    { name: "Technical SEO & AEO", level: 97, color: "from-indigo-600 to-sky-500" },
    { name: "WordPress Development", level: 94, color: "from-fuchsia-600 to-red-500" },
    { name: "Google Ads & Meta Ads", level: 90, color: "from-lime-500 to-green-500" },
    { name: "Full-Stack Web Development", level: 88, color: "from-teal-500 to-cyan-500" },
    { name: "Keyword & Competitor Research", level: 95, color: "from-yellow-500 to-orange-500" },
    { name: "Analytics (GA4, GSC, Looker)", level: 92, color: "from-blue-600 to-purple-600" },
    { name: "Content Strategy & Optimization", level: 89, color: "from-pink-500 to-red-400" },
    { name: "JavaScript / React", level: 85, color: "from-gray-700 to-gray-400" }
  ];

  const achievements = [
    "Ranked 4,000+ keywords on Google Page 1",
    "Built & optimized 50+ high-performance websites",
    "Achieved 200%+ average organic traffic growth",
    "Reduced client ad spend by up to 40% while increasing ROI",
    "95%+ client satisfaction across all projects",
    "Expert in international & local SEO strategies",
    "Core Web Vitals & mobile-first optimization specialist"
  ];

  // Animate skills when in view
  useEffect(() => {
    // Initialize animatedSkills array to match the length of skills
    setAnimatedSkills(skills.map(() => false));

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Trigger animation for all skills when the skill section enters view
          setAnimatedSkills(skills.map(() => true));
        } else {
          // Optional: Reset animation when scrolling away
          setAnimatedSkills(skills.map(() => false));
        }
      },
      { threshold: 0.3 }
    );

    if (skillsRef.current) {
      observer.observe(skillsRef.current);
    }

    return () => observer.disconnect();
  }, []); // Dependency array ensures this runs once

  const schemaPerson = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Bigyan Neupane",
    "alternateName": ["Bigyann", "Bigyan SEO", "SEO Expert Nepal"],
    "jobTitle": "SEO Expert in Nepal | Full-Stack Developer | Digital Growth Strategist",
    "url": "https://bigyann.com.np/about",
    "image": "https://appflicks.com/wp-content/uploads/2025/08/FB_IMG_16036454436998781.jpg",
    "description": "Bigyan Neupane is a leading SEO expert in Nepal specializing in technical SEO, WordPress development, Google Ads, and digital growth strategies. Ranked 4000+ keywords and built 50+ high-performance websites.",
    "sameAs": [
      "https://www.linkedin.com/in/bigyan-neupane",
      "https://wa.me/9779805671898"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Kathmandu",
      "addressRegion": "Bagmati",
      "addressCountry": "NP"
    },
    "knowsAbout": ["Search Engine Optimization", "Technical SEO", "WordPress", "Google Ads", "SEO in Nepal"]
  };

  const schemaFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Who is the best SEO expert in Nepal?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Bigyan Neupane is widely recognized as one of the top SEO experts in Nepal with proven results ranking over 4,000+ keywords and helping businesses dominate Google search results in Nepal and worldwide."
        }
      },
      {
        "@type": "Question",
        "name": "Where can I hire an SEO freelancer in Kathmandu?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Bigyan Neupane offers professional SEO services in Kathmandu and remotely worldwide. Contact via WhatsApp: +977 9805671898"
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Bigyan Neupane SEO Expert in Nepal | Top SEO Freelancer Kathmandu</title>
        <meta name="description" content="Bigyan Neupane is a leading SEO expert in Nepal with 5+ years of experience. Ranked 4000+ keywords, built 50+ websites, and helped businesses grow online. Available for SEO, web development & digital marketing projects." />
        <link rel="canonical" href="https://bigyann.com.np/about" />
        
        <meta property="og:title" content="Bigyan Neupane - Best SEO Expert in Nepal | Kathmandu Freelancer" />
        <meta property="og:description" content="Top-rated SEO expert in Nepal helping businesses rank #1 on Google. Expert in technical SEO, WordPress, Google Ads & web performance." />
        <meta property="og:image" content="https://appflicks.com/wp-content/uploads/2025/08/FB_IMG_16036454436998781.jpg" />
        <meta property="og:url" content="https://bigyann.com.np/about" />
        <meta property="og:type" content="profile" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Bigyan Neupane - SEO Expert in Nepal" />
        <meta name="twitter:description" content="4000+ keywords ranked | 50+ websites built | 200%+ traffic growth" />
        <meta name="twitter:image" content="https://appflicks.com/wp-content/uploads/2025/08/FB_IMG_16036454436998781.jpg" />
        <link 
    rel="icon" 
    type="image/png" 
    sizes="28x28"
    href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAe1BMVEX////78vL45ufrlZvbACPcFDLcFTLbACLdK0LdLkTdKEDcJD745OX45+jcHTriYmzngYLbESngTVz21tfdJzPjdX/ur7LcGTbqmqD++fnYAAD33uDvt7voiIvbISrhW1/dJjr1ztLdNUvfRFbso6Tng4vhWWTmfH7lc3pUlbFDAAAApklEQVR4AbWSAw7AAAxFO9u2cf8Tzu4W7oU/NeBPCPIGATsUzbAXGI7a42heuMNtsSQ7a1EaEVcjI8OCMhtVTR/RDB4xiuYiLJt/GlUHFlwPN/qSE4wKN1JcqED0Ehk7MUCivteMUty4kkl4Q3meABQe3hAjSQqQJY9GllU9rgGPXGieRrFaRFAzyOKlthvpS2NdPHIyib+djOA+jj3uFH+T7wf7hwE23xD0wroPdwAAAABJRU5ErkJggg=="
/>
        <script type="application/ld+json">{JSON.stringify(schemaPerson)}</script>
        <script type="application/ld+json">{JSON.stringify(schemaFAQ)}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 pt-24 pb-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Hero */}
          <section className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Bigyan Neupane <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">SEO Expert in Nepal</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Top-rated <strong>SEO freelancer in Kathmandu</strong> helping businesses dominate Google with proven strategies. 
              Ranked <strong>4,000+ keywords</strong>, built <strong>50+ high-performance websites</strong>, and delivered <strong>200%+ traffic growth</strong> for clients worldwide.
            </p>
          </section>

          {/* Profile Card with Social Links & Email */}
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800 p-10 md:p-12 mb-16 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row items-center gap-10">
              {/* Profile Photo */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/30 to-purple-500/30 rounded-full blur-xl opacity-70 animate-pulse" />
                <img
                  src="https://appflicks.com/wp-content/uploads/2025/08/FB_IMG_16036454436998781.jpg"
                  alt="Bigyan Neupane - SEO Expert in Nepal"
                  className="relative w-40 h-40 rounded-full border-8 border-white dark:border-gray-800 shadow-2xl object-cover ring-4 ring-primary-500/20"
                  loading="eager"
                />
                {/* Online Indicator */}
                <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-green-500 border-4 border-white dark:border-gray-800 shadow-lg animate-pulse"></div>
              </div>

              {/* Text & Social Links */}
              <div className="text-center lg:text-left flex-1 space-y-6">
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
                    Hi, I'm <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Bigyan Neupane</span>
                  </h2>
                  <p className="text-xl text-primary-600 dark:text-primary-400 font-semibold">
                    SEO Expert in Nepal • Full-Stack Developer • Growth Strategist
                  </p>
                </div>

                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                  A passionate <strong>SEO freelancer based in Kathmandu, Nepal</strong> helping businesses rank #1 on Google with proven technical SEO, lightning-fast websites, and high-ROI digital strategies.
                </p>

                {/* Contact Info & Social Links */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                  {/* Email */}
                  <a
                    href="mailto:bigyan.neupane6@gmail.com"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    bigyan.neupane6@gmail.com
                  </a>

                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/9779805671898?text=Hi%20Bigyan!%20I%20found%20you%20from%20your%20website%20-%20let's%20talk%20about%20SEO!"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#25D366] text-white font-medium rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 21.5c-2.5 0-4.8-.9-6.6-2.4l-.4-.3-4.1.9 1-4-.3-.4C3.9 12.8 3 10.5 3 8c0-5 4-9 9-9s9 4 9 9-4 9-9 9zm0-16c-3.9 0-7 3.1-7 7 0 1.5.5 2.9 1.3 4.1l.8 1.2-1.1.7.7-1.1 1.2.8c1.2.8 2.6 1.3 4.1 1.3 3.9 0 7-3.1 7-7s-3.1-7-7-7z"/>
                    </svg>
                    WhatsApp Me
                  </a>
                </div>

                {/* Social Icons */}
                <div className="flex justify-center lg:justify-start gap-4 pt-2">
                  <a
                    href="https://www.linkedin.com/in/bigyanneupane1/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all hover:scale-110"
                    aria-label="LinkedIn Profile"
                  >
                    <svg className="w-6 h-6 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9.5h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9.5h3.564v10.952zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.771-.773 1.771-1.729V1.729C24 .774 23.208 0 22.229 0h-.004z"/>
                    </svg>
                  </a>

                  <a
                    href="https://www.facebook.com/beglesss"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all hover:scale-110"
                    aria-label="Facebook Profile"
                  >
                    <svg className="w-6 h-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>

                  <a
                    href="https://github.com/bigyann"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-800 dark:hover:bg-white/10 transition-all hover:scale-110"
                    aria-label="GitHub Profile"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {["4000+", "50+", "200%+", "95%"].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">{stat}</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {["Keywords Ranked", "Websites Built", "Avg Traffic Growth", "Client Satisfaction"][i]}
                </div>
              </div>
            ))}
          </div>

          {/* Skills with Animated Progress Bars */}
          <div ref={skillsRef} className="mb-16">
            <div className="flex items-center gap-3 mb-10">
              <Award className="w-8 h-8 text-primary-500" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Core Expertise</h2>
            </div>
            <div className="grid gap-6">
              {skills.map((skill, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
                  <div className="flex justify-between mb-3">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">{skill.name}</span>
                    <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{skill.level}%</span>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      // **Key Fix**: Dynamic gradient class added here
                      className={`h-full bg-gradient-to-r ${skill.color} rounded-full transition-all duration-1000 ease-out`}
                      style={{
                        // **Key Fix**: Applied transition to the width property
                        width: animatedSkills[i] ? `${skill.level}%` : "0%"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="my-16 border-gray-200 dark:border-gray-700" />

          {/* Key Achievements */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500" />
              Key Achievements
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {achievements.map((ach, i) => (
                <div key={i} className="flex items-start gap-4 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{ach}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className="my-16 border-gray-200 dark:border-gray-700" />

          {/* Work Experience */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-10">
              <Briefcase className="w-8 h-8 text-primary-500" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Professional Journey</h2>
            </div>

            <div className="space-y-8">
              {experiences.map((exp, index) => (
                <div
                  key={index}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${
                    expandedIndex === index ? 'shadow-2xl ring-2 ring-primary-500/20' : 'shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div
                    className="p-6 md:p-8 cursor-pointer flex items-start justify-between"
                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  >
                    <div className="flex items-start gap-5 flex-1">
                      <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/30">
                        {exp.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{exp.role}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="text-primary-600 dark:text-primary-400 font-semibold text-lg">
                            {exp.company}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium">
                            {exp.type}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-4 text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> {exp.period}
                          </span>
                          <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> {exp.location}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-5">
                          {exp.metrics.map((m, i) => (
                            <span
                              key={i}
                              className="px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button className="ml-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors" aria-expanded={expandedIndex === index}>
                      {expandedIndex === index ? (
                        <ChevronUp className="w-6 h-6" />
                      ) : (
                        <ChevronDown className="w-6 h-6" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  <div className={`transition-all duration-500 overflow-hidden ${expandedIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 md:px-8 pb-8 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <ul className="space-y-4 mt-6">
                        {exp.description.map((item, i) => (
                          <li key={i} className="flex items-start gap-4 text-gray-700 dark:text-gray-300">
                            <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="my-16 border-gray-200 dark:border-gray-700" />

          {/* Philosophy */}
          <div className="mb-16 p-10 bg-gradient-to-br from-primary-600 to-purple-700 rounded-3xl text-white shadow-2xl">
            <Trophy className="w-12 h-12 text-amber-300 mb-4" />
            <h3 className="text-3xl font-bold mb-4">
              "Your website isn’t just a page — it’s your most powerful growth engine."
            </h3>
            <p className="text-xl opacity-90">
              I don’t just build websites. I build digital empires — optimized, fast, and designed to dominate search and convert visitors into customers.
            </p>
          </div>

          {/* Final CTA */}
          <div className="text-center py-16">
              <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Ready to Rank #1 on Google?
              </h3>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
                Let’s grow your business with proven SEO, fast websites, and smart digital strategies.
              </p>
              <a
                href="https://wa.me/9779805671898?text=Hi%20Bigyan!%20I'm%20ready%20to%20rank%20higher%20on%20Google!"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-4 px-10 py-5 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 21.5c-2.5 0-4.8-.9-6.6-2.4l-.4-.3-4.1.9 1-4-.3-.4C3.9 12.8 3 10.5 3 8c0-5 4-9 9-9s9 4 9 9-4 9-9 9zm0-16c-3.9 0-7 3.1-7 7 0 1.5.5 2.9 1.3 4.1l.8 1.2-1.1.7.7-1.1 1.2.8c1.2.8 2.6 1.3 4.1 1.3 3.9 0 7-3.1 7-7s-3.1-7-7-7z"/>
                </svg>
                Hire Me on WhatsApp
              </a>
              <p className="mt-4 text-gray-500 font-medium">Replies in under 30 mins</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
'use client';

import React from 'react';
import {
  FaArrowRight,
  FaDiscord,
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaLinkedinIn,
  FaPinterestP,
  FaSoundcloud,
  FaSpotify,
  FaTelegramPlane,
  FaTiktok,
  FaTwitter,
  FaYoutube,
} from 'react-icons/fa';

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  icon,
  title,
  description,
}) => (
  <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl dark:shadow-lg dark:shadow-black/20 hover:dark:shadow-purple-500/10 transition-all duration-300 h-full hover:-translate-y-1 group">
    <div className="mb-4">
      <div className="w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
        <div className="text-white text-2xl">{icon}</div>
      </div>
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-200">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed transition-colors duration-200">
      {description}
    </p>
  </div>
);

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  bgColor?: 'white' | 'gray';
}

const Section: React.FC<SectionProps> = ({
  children,
  className = '',
  bgColor = 'gray',
}) => (
  <section
    className={`${className}`}
  >
    <div className="max-w-[1200px] mx-auto px-4">{children}</div>
  </section>
);

export default function Services() {
  const services = [
    {
      icon: <FaFacebookF />,
      title: 'Facebook SMM Panel',
      description: 'Maximizing engagement and reach.',
    },
    {
      icon: <FaInstagram />,
      title: 'Instagram SMM Panel',
      description: 'Enhancing visibility and follower growth.',
    },
    {
      icon: <FaTwitter />,
      title: 'Twitter SMM Panel',
      description: 'Building influence and brand recognition.',
    },
    {
      icon: <FaYoutube />,
      title: 'YouTube SMM Panel',
      description: 'Increasing views and subscriber numbers.',
    },
    {
      icon: <FaLinkedinIn />,
      title: 'LinkedIn SMM Panel',
      description: 'Professional networking and lead generation.',
    },
    {
      icon: <FaTiktok />,
      title: 'TikTok SMM Panel',
      description: 'Tapping into viral marketing.',
    },
    {
      icon: <FaTelegramPlane />,
      title: 'Telegram SMM Panel',
      description: 'Expanding messaging and community engagement.',
    },
    {
      icon: <FaSpotify />,
      title: 'Spotify SMM Panel',
      description: 'Boosting music streaming and artist visibility.',
    },
    {
      icon: <FaDiscord />,
      title: 'Discord SMM Panel',
      description: 'Community building and interaction.',
    },
    {
      icon: <FaPinterestP />,
      title: 'Pinterest SMM Panel',
      description: 'Driving traffic through visual content.',
    },
    {
      icon: <FaSoundcloud />,
      title: 'SoundCloud SMM Panel',
      description: 'Enhancing audio content reach.',
    },
    {
      icon: <FaGlobe />,
      title: 'Website Traffic',
      description: 'Improving online visibility and digital footfall.',
    },
  ];

  return (
    <Section className="pt-[30px] lg:pt-[60px] pb-[60px] bg-white dark:bg-[#0d0712] transition-colors duration-200">
      <div className="text-left lg:text-center mb-6">
        <h4 className="text-2xl font-bold text-[var(--primary)] dark:text-[var(--secondary)] mb-2 transition-colors duration-200">
          Our Services
        </h4>
        <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-4 transition-colors duration-200">
          Comprehensive Solutions for <br />
          Every{' '}
          <span className="text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200">
            Social Media
          </span>{' '}
          Need
        </h2>
        <p className="text-gray-600 dark:text-gray-300  leading-relaxed max-w-3xl mx-auto transition-colors duration-200">
          At SMMDOC, we offer a broad spectrum of social media marketing
          services. <br /> Our solutions are designed to cater to the unique
          requirements of each platform:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
        {services.map((service, index) => (
          <ServiceCard
            key={index}
            icon={service.icon}
            title={service.title}
            description={service.description}
          />
        ))}
      </div>

      <div className="text-left lg:text-center">
        <p className="text-gray-600 dark:text-gray-300  mb-6 max-w-2xl mx-auto transition-colors duration-200">
          Each service is backed by thorough research and tailored strategies,{' '}
          <br />
          ensuring optimal results and client satisfaction.
        </p>
        <a
          href="/services"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold px-8 py-4 rounded-lg hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1"
        >
          <span>Our All Services</span>
          <FaArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </a>
      </div>
    </Section>
  );
}
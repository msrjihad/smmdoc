'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaLinkedin,
  FaTiktok,
  FaTelegram,
  FaSpotify,
  FaDiscord,
  FaPinterest,
  FaGlobe,
  FaSoundcloud,
} from 'react-icons/fa';
import { Platform, platformsData } from '@/data/frontend/homepage/platforms';

const Platforms: React.FC = () => {
  const [activeTab, setActiveTab] = useState('facebook');

  const renderIcon = (iconName: string) => {
    const iconClass =
      'w-6 h-6 text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200';

    switch (iconName) {
      case 'facebook':
        return <FaFacebook className={iconClass} />;
      case 'instagram':
        return <FaInstagram className={iconClass} />;
      case 'twitter':
        return <FaTwitter className={iconClass} />;
      case 'youtube':
        return <FaYoutube className={iconClass} />;
      case 'linkedin':
        return <FaLinkedin className={iconClass} />;
      case 'tiktok':
        return <FaTiktok className={iconClass} />;
      case 'telegram':
        return <FaTelegram className={iconClass} />;
      case 'spotify':
        return <FaSpotify className={iconClass} />;
      case 'discord':
        return <FaDiscord className={iconClass} />;
      case 'pinterest':
        return <FaPinterest className={iconClass} />;
      case 'globe':
        return <FaGlobe className={iconClass} />;
      case 'soundcloud':
        return <FaSoundcloud className={iconClass} />;
      default:
        return <FaGlobe className={iconClass} />;
    }
  };

  const activePlatform =
    platformsData.find((p) => p.id === activeTab) || platformsData[0];

  return (
    <section
      id="our_services"
      className="pt-[30px] pb-[30px] lg:pt-[60px] lg:pb-[60px] transition-colors duration-200"
    >
      <div className="container mx-auto px-4 max-w-[1200px]">
        <div className="lg:text-center text-left mb-6">
          <h4 className="text-2xl font-bold text-[var(--primary)] dark:text-[var(--secondary)] mb-2 transition-colors duration-200">
            Our Services
          </h4>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
            Comprehensive{' '}
            <span className="text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200">
              SMM
            </span>{' '}
            Solutions
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto transition-colors duration-200">
            Our budget-friendly and top-notch social media marketing solutions.
          </p>
        </div>
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm p-5 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-full overflow-x-auto transition-all duration-200">
            <div className="flex flex-wrap justify-center gap-2 min-w-max">
              {platformsData.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setActiveTab(platform.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-300 whitespace-nowrap ${
                    activeTab === platform.id
                      ? 'bg-white dark:bg-gray-700/70 border-[var(--primary)] dark:border-[var(--secondary)] shadow-lg text-gray-900 dark:text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-[var(--primary)] dark:hover:border-[var(--secondary)] hover:shadow-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  }`}
                >
                  {renderIcon(platform.icon)}
                  {activeTab === platform.id && (
                    <span className="font-semibold text-sm">
                      {platform.name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-12 items-center mt-8">
          <div>
            <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
              {activePlatform.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed text-justify transition-colors duration-200">
              {activePlatform.description}
            </p>
            <a
              href="/services"
              className="inline-block bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold px-8 py-4 rounded-lg hover:from-[#4F0FD8] hover:to-[#A121E8] hover:shadow-lg dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1"
            >
              Our Services
            </a>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative group">
              <Image
                src="/smm-panel-services.webp"
                alt="SMM Panel Services"
                width={500}
                height={400}
                className="w-full max-w-lg mx-auto lg:mx-0 rounded-lg transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Platforms;
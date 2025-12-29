import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { FaArrowRight } from 'react-icons/fa';

const Hero: React.FC = () => {
  return (
    <section className="pt-[60px] lg:pt-[120px] pb-[30px] lg:pb-[60px] transition-colors duration-200">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight transition-colors duration-200">
              Services & Pricing
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-justify text-lg mb-6 leading-relaxed transition-colors duration-200">
              Discover your ideal social media strategy with SMMDOC's Service
              & Pricing List. This page offers a clear, concise table of our
              services across various platforms, along with transparent
              pricing to fit your budget. From boosting your Facebook presence
              to enhancing your YouTube channel, our services are tailored to
              meet your needs. For more about our mission and approach, visit
              our About Us page. Make an informed choice with SMMDOC, where
              quality meets affordability in social media marketing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold px-8 py-4 rounded-lg hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1 group"
              >
                <span>Get Started</span>
                <FaArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 border-2 border-[var(--primary)] dark:border-[var(--secondary)] text-[var(--primary)] dark:text-[var(--secondary)] font-semibold px-8 py-4 rounded-lg hover:bg-[var(--primary)] hover:text-white dark:hover:bg-[var(--secondary)] transition-all duration-300 hover:-translate-y-1"
              >
                <span>Learn More</span>
              </Link>
            </div>
          </div>
          <div className="text-center lg:text-right">
            <div className="relative">
              <Image
                src="/smmpanel-service-banner.webp"
                alt="SMM Panel Provider in Bangladesh"
                width={600}
                height={500}
                className="w-full max-w-lg mx-auto lg:mx-0 rounded-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
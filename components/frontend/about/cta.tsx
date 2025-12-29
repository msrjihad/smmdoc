'use client';

import Link from 'next/link';
import React from 'react';
import { FaArrowRight } from 'react-icons/fa';

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

export default function CTA() {
  return (
    <Section className="pt-[30px] lg:pt-[60px] pb-[30px] lg:pb-[60px] bg-gray-50 dark:bg-gray-900/50 transition-colors duration-200">
      <div className="text-left lg:text-center">
        <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight transition-colors duration-200">
          Ready to{' '}
          <span className="text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200">
            Transform
          </span>{' '}
          Your Social Media Presence?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed transition-colors duration-200">
          Join thousands of satisfied customers who have boosted their social
          media engagement with our premium SMM panel services. Start your
          journey to social media success today!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold px-8 py-4 rounded-lg hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1"
          >
            <span>Get Started Now</span>
            <FaArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center justify-center gap-2 border-2 border-[var(--primary)] dark:border-[var(--secondary)] text-[var(--primary)] dark:text-[var(--secondary)] font-semibold px-8 py-4 rounded-lg hover:bg-[var(--primary)] hover:text-white dark:hover:bg-[var(--secondary)] dark:hover:text-white transition-all duration-300 hover:-translate-y-1"
          >
            <span>View Services</span>
          </Link>
        </div>
      </div>
    </Section>
  );
}
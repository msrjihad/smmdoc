'use client';

import Image from 'next/image';
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

export default function WhyDifferent() {
  return (
    <Section className="pt-[30px] lg:pt-[60px] pb-[30px] lg:pb-[60px] bg-white dark:bg-[#0d0712] transition-colors duration-200">
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 items-center">
        <div className="order-1 lg:order-1">
          <h4 className="text-2xl font-bold text-[var(--primary)] dark:text-[var(--secondary)] mb-2 transition-colors duration-200">
            Why Different
          </h4>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight transition-colors duration-200">
            What Sets{' '}
            <span className="text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200">
              SMMDOC
            </span>{' '}
            Apart?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-justify leading-relaxed transition-colors duration-200">
            In a crowded market of SMM panels, SMMDOC distinguishes itself
            through unparalleled service quality, innovative solutions, and
            customer-centric approach. Our commitment to excellence is evident
            in every aspect of our service - from the user-friendly interface
            to the lightning-fast delivery times. We don't just provide
            services; we build partnerships that foster long-term success for
            our clients.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold px-8 py-4 rounded-lg hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1"
          >
            <span>Experience the Difference</span>
            <FaArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
        <div className="order-2 lg:order-2 text-center lg:text-right">
          <div className="relative">
            <Image
              src="/vision-banner-image.webp"
              alt="smmpanel why different banner"
              width={600}
              height={500}
              className="w-full max-w-lg mx-auto lg:mx-0 rounded-lg"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
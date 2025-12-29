'use client';

import Image from 'next/image';
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

export default function Mission() {
  return (
    <Section className="pt-[30px] lg:pt-[60px] pb-[30px] lg:pb-[60px] bg-white dark:bg-[#0d0712] transition-colors duration-200">
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 text-center lg:text-left">
          <div className="relative">
            <Image
              src="/smm-panel-mission.webp"
              alt="smm panel mission"
              width={600}
              height={500}
              className="w-full max-w-lg mx-auto lg:mx-0 rounded-lg"
            />
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <h4 className="text-2xl font-bold text-[var(--primary)] dark:text-[var(--secondary)] mb-2 transition-colors duration-200">
            Mission
          </h4>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 dark:text-white leading-tight transition-colors duration-200">
            Empowering Businesses with Affordable{' '}
            <span className="text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200">
              Social Media
            </span>{' '}
            Strategies
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-justify leading-relaxed text-justify transition-colors duration-200">
            Our mission at SMMDOC is straightforward – to provide
            high-quality, cost-effective social media marketing services that
            drive business growth and enhance online visibility. We are
            committed to helping businesses in Bangladesh and beyond to unlock
            their full potential on social media platforms. By offering the
            cheapest SMM panels, we ensure that even small businesses and
            startups can compete effectively in the digital arena.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold px-8 py-4 rounded-lg hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1"
          >
            <span>Learn More</span>
            <FaArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </Section>
  );
}
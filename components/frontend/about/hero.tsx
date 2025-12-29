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

export default function Hero() {
  return (
    <Section className="pt-[80px] pb-[30px] lg:pb-[60px] bg-white dark:bg-[#0d0712] transition-colors duration-200">
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h4 className="text-2xl font-bold text-[var(--primary)] dark:text-[var(--secondary)] mb-2 transition-colors duration-200">
            Company Overview
          </h4>
          <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight transition-colors duration-200">
            <span className="text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200">
              SMMDOC:
            </span>{' '}
            Pioneering Social Media{' '}
            <span className="text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200">
              Marketing{' '}
            </span>
            in Bangladesh and Beyond
          </h1>
          <div className="space-y-4 text-gray-600 dark:text-gray-300 text-justify mb-6 text-justify leading-relaxed transition-colors duration-200">
            <p>
              Founded in 2018, SMMDOC has swiftly risen to prominence as a
              leading provider of social media marketing (SMM) services in
              Bangladesh and neighboring regions. With a focus on offering the
              most affordable yet effective SMM panels, we have revolutionized
              the way businesses approach their online presence. Our extensive
              range of services, including platforms like Facebook, Instagram,
              Twitter, YouTube, LinkedIn, TikTok, Telegram, Spotify, Discord,
              Pinterest, and SoundCloud, cater to diverse digital marketing
              needs.
            </p>
            <p>
              Our journey began with a vision to democratize social media
              marketing, making it accessible and affordable for businesses of
              all sizes. We recognized the immense potential of social media
              in reshaping brand-customer interactions and set out to harness
              this power for our clients. Today, SMMDOC stands as a testament
              to innovative solutions, customer-centric approaches, and
              results-driven strategies in the world of social media
              marketing.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold px-8 py-4 rounded-lg hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1"
          >
            <span>Get Started</span>
            <FaArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="-mt-[30px] lg:-mt-[0px] text-center lg:text-right">
          <div className="relative">
            <Image
              src="/smmdoc-about-us.webp"
              alt="SMMDOC about us"
              width={600}
              height={400}
              className="w-full max-w-lg mx-auto lg:mx-0 rounded-lg"
              priority
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
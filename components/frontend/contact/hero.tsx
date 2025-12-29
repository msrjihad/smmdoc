'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { FaArrowRight } from 'react-icons/fa';

const Hero: React.FC = () => {
  return (
    <section className="pt-[60px] pb-[60px] bg-white dark:bg-[#0d0712] transition-colors duration-200">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h4 className="text-2xl font-bold text-[var(--primary)] dark:text-[var(--secondary)] mb-2 transition-colors duration-200">
              Contact Us
            </h4>
            <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 dark:text-white leading-tight transition-colors duration-200">
              Reach Out to{' '}
              <span className="text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200">
                SMMDOC{' '}
              </span>
              for Your Social Media Solutions
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg text-justify mb-6 leading-relaxed transition-colors duration-200">
              At SMMDOC, we're always eager to connect with you and discuss
              how we can elevate your social media presence. Whether you have
              questions about our services, need assistance in choosing the
              right strategy, or want to discuss a customized plan, we're here
              to help. Learn more about our journey and ethos on our About Us
              page.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold px-8 py-4 rounded-lg hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1"
            >
              <span>Get Started</span>
              <FaArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="text-center lg:text-right">
            <div className="relative">
              <Image
                src="/smm-panel-provider-in-bd.webp"
                alt="smm panel provider in bd"
                width={600}
                height={500}
                className="w-full max-w-lg mx-auto lg:mx-0 rounded-lg"
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
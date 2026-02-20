'use client';
import React from 'react';
import { FaUserPlus, FaSearch, FaWallet, FaRocket } from 'react-icons/fa';
import { Step, stepsData } from '@/data/frontend/homepage/how-it-works';

const iconMap = {
  FaUserPlus: FaUserPlus,
  FaSearch: FaSearch,
  FaWallet: FaWallet,
  FaRocket: FaRocket,
};

const HowItWorks: React.FC = () => {
  return (
    <section className="py-0 pb-[30px] lg:pb-[60px] transition-colors duration-200">
      <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-purple-800/10 dark:from-purple-400/5 dark:to-purple-600/5"></div>

        <div className="container mx-auto px-4 text-center max-w-7xl relative z-10">
          <h2
            className="text-3xl lg:text-5xl font-extrabold text-white mb-4"
            data-aos="fade-up"
            data-aos-duration="600"
          >
            How to Order
          </h2>
          <p
            className="text-xl text-purple-100 dark:text-purple-200 mb-16 transition-colors duration-200"
            data-aos="fade-up"
            data-aos-duration="800"
          >
            Our Simple 4-Step Work Order Process
          </p>
        </div>
      </div>
      <div className="container mx-auto px-4 -mt-16 relative z-10 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stepsData.map((step, index) => {
            const IconComponent = iconMap[step.iconName as keyof typeof iconMap];
            return (
              <div
                key={index}
                className={`bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl dark:shadow-lg dark:shadow-black/20 hover:dark:shadow-purple-500/10 transition-all duration-300 relative pb-16 group hover:-translate-y-2 ${index !== 0 ? 'mt-10 lg:mt-0' : ''}`}
                data-aos="fade-up"
                data-aos-duration="600"
                data-aos-delay={index * 150}
              >
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-500 rounded-full flex flex-col items-center justify-center text-white border-4 border-white dark:border-gray-800 shadow-lg group-hover:scale-110 transition-all duration-300">
                    <span className="text-lg font-bold">{step.number}</span>
                    <span className="text-xs font-medium">STEP</span>
                  </div>
                </div>
                <div className="text-center mt-12 mb-6">
                  <div className="mx-auto flex justify-center items-center w-16 h-16 group-hover:scale-110 transition-transform duration-300">
                    {IconComponent && (
                      <IconComponent className="w-12 h-12 text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200" />
                    )}
                  </div>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white text-center mb-4 transition-colors duration-200">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed transition-colors duration-200">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
        <div className="text-center -mt-8">
          <a
            href="/sign-up"
            className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white px-10 py-4 rounded-lg text-xl font-bold inline-flex items-center hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1"
            data-aos="fade-up"
            data-aos-duration="800"
          >
            Create An Account
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
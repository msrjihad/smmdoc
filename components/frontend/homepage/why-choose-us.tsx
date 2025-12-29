'use client';

import { features } from '@/data/frontend/homepage/features';

export default function WhyChooseUs() {
  return (
    <section
      id="whyChooseUs"
      className="py-12 lg:py-24 pb-[60px] lg:pb-[120px] transition-colors duration-200"
    >
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="text-left lg:text-center mb-6">
          <h4 className="text-2xl font-bold text-[var(--primary)] dark:text-[var(--secondary)] mb-2 transition-colors duration-200">
            Why Choose Us?
          </h4>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
            Unparalleled Quality in <br />
            <span className="text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200">
              SMM Service
            </span>{' '}
            and Customer Satisfaction
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl dark:shadow-lg dark:shadow-black/20 hover:dark:shadow-purple-500/10 transition-all duration-300 h-full hover:-translate-y-1 group"
              >
                <div className="mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-200">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed transition-colors duration-200 text-justify">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
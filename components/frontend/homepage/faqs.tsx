'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { FAQ, faqData } from '@/data/frontend/homepage/faqs';

function FAQs() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    setOpenItems((prevOpenItems) =>
      prevOpenItems.includes(id)
        ? prevOpenItems.filter((item) => item !== id)
        : [...prevOpenItems, id]
    );
  };

  return (
    <section className="pt-[30px] lg:pt-[60px] pb-[120px] transition-colors duration-200">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="text-left lg:text-center mb-6">
          <h4 className="text-2xl font-bold text-[var(--primary)] dark:text-[var(--secondary)] mb-2 transition-colors duration-200">
            FAQ's
          </h4>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
            People Also Asked to{' '}
            <span className="text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200">
              SMMDOC
            </span>
          </h2>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {faqData.map((faq) => (
              <div
                key={`faq-${faq.id}`}
                className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl dark:shadow-lg dark:shadow-black/20 hover:dark:shadow-purple-500/10 transition-all duration-300"
              >
                <button
                  className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200 rounded-lg focus:outline-none"
                  onClick={() => toggleItem(faq.id)}
                >
                  <span className="font-medium text-gray-900 dark:text-white pr-4">
                    {faq.question}
                  </span>
                  <div
                    className={`transform transition-transform duration-200 ${
                      openItems.includes(faq.id) ? 'rotate-180' : 'rotate-0'
                    }`}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  </div>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openItems.includes(faq.id)
                      ? 'max-h-96 opacity-100'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 transition-colors duration-200">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-3">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FAQs;
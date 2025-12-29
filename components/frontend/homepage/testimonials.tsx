'use client';
import React, { useEffect, useState } from 'react';
import { Testimonial, testimonialsData } from '@/data/frontend/homepage/testimonials';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Testimonials: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const itemsPerPage = 3;
  const maxSlide = testimonialsData.length - itemsPerPage;
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const nextSlide = prev + 1;
        return nextSlide > maxSlide ? 0 : nextSlide;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, maxSlide]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => {
      const nextSlide = prev + 1;
      return nextSlide > maxSlide ? 0 : nextSlide;
    });
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => {
      const prevSlideIndex = prev - 1;
      return prevSlideIndex < 0 ? maxSlide : prevSlideIndex;
    });
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        className={`w-4 h-4 transition-colors duration-200 ${
          index < rating
            ? 'text-[var(--primary)] dark:text-[var(--secondary)]'
            : 'text-gray-300 dark:text-gray-600'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <section
      className="pt-[30px] pb-[30px] lg:pt-[60px] lg:pb-[60px] relative transition-colors duration-200"
    >
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h4 className="text-2xl font-bold text-[var(--primary)] dark:text-[var(--secondary)] mb-2 transition-colors duration-200">
              Success Stories
            </h4>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
              Transforming{' '}
              <span className="text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200">
                Social Media
              </span>{' '}
              Landscapes
            </h2>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              onClick={prevSlide}
              className="w-10 h-10 rounded-full bg-white dark:bg-gray-800/70 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-all duration-200 group"
              aria-label="Previous testimonial"
            >
              <FaChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-[var(--primary)] dark:group-hover:text-[var(--secondary)] transition-colors duration-200" />
            </button>
            <button
              onClick={nextSlide}
              className="w-10 h-10 rounded-full bg-white dark:bg-gray-800/70 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-all duration-200 group"
              aria-label="Next testimonial"
            >
              <FaChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-[var(--primary)] dark:group-hover:text-[var(--secondary)] transition-colors duration-200" />
            </button>
          </div>
        </div>
        <div className="overflow-hidden mb-8 -mx-4">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${
                currentSlide * (isMobile ? 100 : (100 / itemsPerPage))
              }%)`,
            }}
          >
            {testimonialsData.map((testimonial) => (
              <div key={testimonial.id} className="w-full md:w-1/3 flex-shrink-0 px-4">
                <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 h-80 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-justify text-sm leading-relaxed line-clamp-6 transition-colors duration-200">
                      "{testimonial.content}"
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-auto">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-0 transition-colors duration-200">
                        {testimonial.name}
                      </h4>
                      <small className="text-gray-500 dark:text-gray-400 text-xs transition-colors duration-200">
                        ~{testimonial.position} of {testimonial.company}
                      </small>
                    </div>

                    <div className="flex items-center gap-1 bg-white dark:bg-gray-700/50 shadow-sm px-3 py-1 rounded-full border border-gray-100 dark:border-gray-600 transition-all duration-200">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center mt-8 gap-3">
          {Array.from({ length: maxSlide + 1 }, (_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentSlide === index
                  ? 'bg-[var(--primary)] dark:bg-[var(--secondary)] scale-110 shadow-lg shadow-[var(--primary)]/40 dark:shadow-[var(--secondary)]/40'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 shadow-md hover:shadow-lg hover:scale-105'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        <div className="flex md:hidden justify-center gap-4 mt-6">
          <button
            onClick={prevSlide}
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-800/70 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-all duration-200 group"
            aria-label="Previous testimonial"
          >
            <FaChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-[var(--primary)] dark:group-hover:text-[var(--secondary)] transition-colors duration-200" />
          </button>
          <button
            onClick={nextSlide}
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-800/70 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-all duration-200 group"
            aria-label="Next testimonial"
          >
            <FaChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-[var(--primary)] dark:group-hover:text-[var(--secondary)] transition-colors duration-200" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
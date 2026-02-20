'use client';
import Footer from '@/components/frontend/footer';
import Header from '@/components/frontend/header';
import { handleError } from '@/lib/utils';
import { useEffect } from 'react';
import { FaArrowLeft, FaRedo } from 'react-icons/fa';

interface ErrorProps {
  error: Error;
}

export default function GlobalError({ error }: ErrorProps) {
  useEffect(() => {
    handleError(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#0d0712] transition-colors duration-200 px-4 py-[120px]">
        <div className="text-center max-w-2xl mx-auto">
          <h4 className="text-2xl font-bold text-[var(--primary)] dark:text-[var(--secondary)] mb-2 transition-colors duration-200">
            Oops! Something went wrong
          </h4>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight transition-colors duration-200">
            An{' '}
            <span className="text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200">
              Error
            </span>{' '}
            Occurred
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed transition-colors duration-200">
            We're sorry, but something unexpected happened. Don't worry though -
            you can try refreshing the page or go back to our homepage to
            continue exploring our services.
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">
              Error: {error.message}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold px-8 py-4 rounded-lg hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1"
              onClick={() => (window.location.href = '/')}
            >
              <FaArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
              <span>Go Back to Home</span>
            </button>

            <button
              className="inline-flex items-center gap-2 bg-white dark:bg-gray-700 border-2 border-[var(--primary)] dark:border-[var(--secondary)] text-[var(--primary)] dark:text-[var(--secondary)] font-semibold px-8 py-4 rounded-lg hover:bg-[var(--primary)] hover:text-white dark:hover:bg-[var(--secondary)] dark:hover:text-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              onClick={() => window.location.reload()}
            >
              <FaRedo className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import {
  FaEnvelope,
  FaFacebookF,
  FaTelegram,
  FaWhatsapp,
} from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [supportEmail, setSupportEmail] = useState<string>('');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [siteLogo, setSiteLogo] = useState<string>('/logo.png');
  const [siteDarkLogo, setSiteDarkLogo] = useState<string>('');
  const [siteIcon, setSiteIcon] = useState<string>('/favicon.png');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/public/general-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.generalSettings) {
            if (data.generalSettings.supportEmail) {
              setSupportEmail(data.generalSettings.supportEmail);
            }
            if (data.generalSettings.whatsappNumber) {
              setWhatsappNumber(data.generalSettings.whatsappNumber);
            }
            if (data.generalSettings.siteLogo && data.generalSettings.siteLogo.trim() !== '') {
              setSiteLogo(data.generalSettings.siteLogo);
            }
            if (data.generalSettings.siteDarkLogo && data.generalSettings.siteDarkLogo.trim() !== '') {
              setSiteDarkLogo(data.generalSettings.siteDarkLogo);
            }
            if (data.generalSettings.siteIcon && data.generalSettings.siteIcon.trim() !== '') {
              setSiteIcon(data.generalSettings.siteIcon);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const formatWhatsAppLink = (phoneNumber: string): string => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      return '#';
    }
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    const numbersOnly = cleaned.replace(/^\+/, '');
    return `https://wa.me/${numbersOnly}`;
  };

  const formatWhatsAppDisplay = (phoneNumber: string): string => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      return 'Not defined';
    }
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+880') && cleaned.length >= 7) {
      const countryCode = cleaned.substring(0, 4);
      const rest = cleaned.substring(4);
      if (rest.length >= 7) {
        return `${countryCode} ${rest.substring(0, 4)}-${rest.substring(4)}`;
      }
    }
    return phoneNumber;
  };

  const socialLinks = [
    {
      name: 'Facebook',
      icon: FaFacebookF,
      url: '#',
    },
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      url: '#',
    },
    {
      name: 'Telegram',
      icon: FaTelegram,
      url: '#',
    },
  ];

  const companyLinks = [
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
    { name: 'Services', href: '/services' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const supportLinks = [
    { name: 'Ticket Support', href: '/support' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'WhatsApp Community', href: '#' },
    { name: 'Telegram Channel', href: '#' },
  ];

  const serviceLinks = [
    { name: 'Facebook Services', href: '/services/facebook' },
    { name: 'Instagram Services', href: '/services/instagram' },
    { name: 'Twitter Services', href: '/services/twitter' },
    { name: 'Telegram Services', href: '/services/telegram' },
    { name: 'YouTube Services', href: '/services/youtube' },
    { name: 'TikTok Services', href: '/services/tiktok' },
  ];

  const bottomLinks = [
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms', href: '/terms' },
  ];

  return (
    <footer className="bg-slate-900 relative pt-16 pb-8">
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-20 h-20 bg-slate-900 border-2 border-[var(--primary)] dark:border-[var(--secondary)] rounded-full flex items-center justify-center transition-colors duration-200">
          {siteIcon && siteIcon.trim() !== '' ? (
            <Image
              src={siteIcon}
              alt="Site Icon"
              width={50}
              height={50}
              className="w-12 h-12 object-contain"
            />
          ) : null}
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 pr-8">
            <div className="footer_txt">
              <Link href="/">
                {siteDarkLogo && siteDarkLogo.trim() !== '' ? (
                  <Image
                    src={siteDarkLogo}
                    alt="Site Dark Logo"
                    width={200}
                    height={60}
                    className="footer_logo mb-4 max-w-[200px] h-auto hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ) : siteLogo && siteLogo.trim() !== '' ? (
                  <Image
                    src={siteLogo}
                    alt="Site Logo"
                    width={200}
                    height={60}
                    className="footer_logo mb-4 max-w-[200px] h-auto hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ) : (
                  <Image
                    src="/logo.png"
                    alt="SMMDOC White Logo"
                    width={200}
                    height={60}
                    className="footer_logo mb-4 max-w-[200px] h-auto hover:opacity-80 transition-opacity cursor-pointer"
                  />
                )}
              </Link>
              <p className="text-white text-sm leading-relaxed mb-4">
                Boost your online presence today with our Cheap SMM Panel – the
                ultimate solution for social media success! Smmdoc is a SMM
                Panel with more then 3 years on the market and 21 Orders
                processed successfully until now!
              </p>
              <ul className="social_media_links flex gap-2 list-none p-0 m-0">
                {socialLinks.map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <li key={index}>
                      <Link
                        href={social.url}
                        className="social_link w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-[var(--primary)] dark:hover:bg-[var(--secondary)] transition-all duration-300 group"
                        aria-label={social.name}
                      >
                        <IconComponent className="w-5 h-5 text-slate-900 group-hover:text-white group-hover:scale-110 transition-all duration-200" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="footer_link_wrap">
                <h4 className="text-xl font-bold text-white mb-4">Company</h4>
                <ul className="footer_menu list-none p-0 m-0">
                  {companyLinks.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="footer_menu_item block text-white font-semibold text-base py-1 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] transition-colors duration-300"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="footer_link_wrap">
                <h4 className="text-xl font-bold text-white mb-4">Support</h4>
                <ul className="footer_menu list-none p-0 m-0">
                  {supportLinks.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="footer_menu_item block text-white font-semibold text-base py-1 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] transition-colors duration-300"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="footer_link_wrap">
              <h4 className="text-xl font-bold text-white mb-4">Reach Out</h4>
              <ul className="footer_contact list-none p-0 m-0">
                <li className="flex items-center gap-2 mb-3">
                  <div className="icon w-8 h-8 bg-white rounded-full flex items-center justify-center group hover:bg-[var(--primary)] dark:hover:bg-[var(--secondary)] transition-colors duration-200">
                    <FaWhatsapp className="w-4 h-4 text-slate-900 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <Link
                    href={formatWhatsAppLink(whatsappNumber)}
                    className="footer_menu_item text-white font-semibold text-sm hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] transition-colors duration-300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {formatWhatsAppDisplay(whatsappNumber)}
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <div className="icon w-8 h-8 bg-white rounded-full flex items-center justify-center group hover:bg-[var(--primary)] dark:hover:bg-[var(--secondary)] transition-colors duration-200">
                    <FaEnvelope className="w-4 h-4 text-slate-900 group-hover:text-white transition-colors duration-200" />
                  </div>
                  {supportEmail ? (
                    <Link
                      href={`mailto:${supportEmail}`}
                      className="footer_menu_item text-white font-semibold text-sm hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] transition-colors duration-300"
                    >
                      {supportEmail}
                    </Link>
                  ) : (
                    <span className="footer_menu_item text-white/50 font-semibold text-sm">
                      Not configured
                    </span>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-white/20 mt-8 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div className="order-2 lg:order-1">
              <p className="text-white text-sm text-center lg:text-left">
                © {currentYear} All Rights Reserved by{' '}
                <Link
                  href="/"
                  className="text-white font-bold hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] transition-colors duration-300"
                >
                  SMMDOC
                </Link>
                .
              </p>
            </div>
            <div className="order-1 lg:order-2 flex flex-wrap justify-center lg:justify-end gap-4 text-sm">
              {bottomLinks.map((link, index) => (
                <React.Fragment key={index}>
                  <Link
                    href={link.href}
                    className="text-white font-semibold hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                  {index < bottomLinks.length - 1 && (
                    <span className="text-white/50">|</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

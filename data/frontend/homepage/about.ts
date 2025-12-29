import { IconType } from 'react-icons';
import {
  FaBullseye,
  FaCogs,
  FaDollarSign,
  FaHeadset,
  FaTrophy,
  FaUsers
} from 'react-icons/fa';

export interface Feature {
  icon: IconType;
  title: string;
  description: string;
}

export const featuresData: Feature[] = [
  {
    icon: FaDollarSign,
    title: 'Unmatched Affordability',
    description:
      'At SMMDOC, we take pride in offering the most budget-friendly SMM services. Our competitive prices ensure that businesses of all sizes can get high-quality social media marketing solutions without exceeding their budgets. We are dedicated to delivering exceptional value without compromising quality, making us the perfect choice for cost-conscious yet ambitious brands.',
  },
  {
    icon: FaBullseye,
    title: 'Customized Strategies',
    description:
      'Every brand is unique, and so should its social media strategy. We at SMMDOC specialize in creating tailor-made strategies that match your business goals and target audience. Our personalized approach ensures that each campaign we run is as unique as your brand, maximizing impact and engagement.',
  },
  {
    icon: FaTrophy,
    title: 'Proven Results',
    description:
      'Our track record speaks to our expertise. With years of experience and many success stories, SMMDOC has demonstrated its ability to generate substantial results across various social media platforms. Our clients experience heightened visibility, engagement, and conversions, leading to tangible business growth.',
  },
  {
    icon: FaUsers,
    title: 'Expert Team',
    description:
      'Our team of social media experts is the backbone of our success. With deep insights into the ever-evolving digital landscape, they bring much knowledge and innovation. Their expertise ensures that your social media presence is vibrant and strategically aligned with the latest trends and best practices.',
  },
  {
    icon: FaCogs,
    title: 'Comprehensive Service Range',
    description:
      'SMMDOC provides a wide array of services encompassing major social media platforms such as Facebook, Instagram, Twitter, YouTube, and more. This comprehensive service spectrum ensures a one-stop solution for all your social media marketing needs, promoting consistency and convenience.',
  },
  {
    icon: FaHeadset,
    title: 'Dedicated Customer Support',
    description:
      'We focus on creating long-term relationships with our clients. Our committed customer support team is always ready to assist, ensuring your experience with us is smooth and satisfactory. We value your feedback and are committed to continuous improvement, making us a reliable partner in your social media journey.',
  },
];
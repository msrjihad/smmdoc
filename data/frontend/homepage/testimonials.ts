export interface Testimonial {
  id: number;
  name: string;
  position: string;
  company: string;
  content: string;
  rating: number;
}

export const testimonialsData: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Johnson',
    position: 'Marketing Director',
    company: 'TechStart Inc.',
    content:
      'SMMDOC has transformed our social media presence completely. Their affordable pricing and exceptional results have made them our go-to partner for all social media marketing needs.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Michael Chen',
    position: 'CEO',
    company: 'Digital Solutions',
    content:
      'The team at SMMDOC understands our business goals perfectly. Their customized strategies have significantly increased our engagement and conversions across all platforms.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    position: 'Brand Manager',
    company: 'Fashion Forward',
    content:
      'Working with SMMDOC has been a game-changer for our brand. Their expert team delivers consistent results and their customer support is always there when we need them.',
    rating: 5,
  },
  {
    id: 4,
    name: 'David Thompson',
    position: 'Founder',
    company: 'StartUp Hub',
    content:
      'SMMDOC provides incredible value for money. Their comprehensive service range covers all our social media needs, making them a one-stop solution for our marketing requirements.',
    rating: 5,
  },
  {
    id: 5,
    name: 'Lisa Wang',
    position: 'Social Media Manager',
    company: 'Creative Agency',
    content:
      'The proven results speak for themselves. SMMDOC has helped us achieve remarkable growth across multiple social media platforms with their innovative strategies.',
    rating: 5,
  },
  {
    id: 6,
    name: 'James Miller',
    position: 'Business Owner',
    company: 'Local Business',
    content:
      'As a small business owner, I appreciate SMMDOC\'s affordable pricing without compromising on quality. Their dedicated support team makes the entire process smooth and hassle-free.',
    rating: 5,
  },
];
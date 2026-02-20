export interface Step {
  number: string;
  iconName: string;
  title: string;
  description: string;
}

export const stepsData: Step[] = [
  {
    number: '01',
    iconName: 'FaUserPlus',
    title: 'Free Sign Up',
    description:
      'Create your account in seconds with our simple registration process. No hidden fees or commitments.',
  },
  {
    number: '02',
    iconName: 'FaSearch',
    title: 'Choose Service',
    description:
      'Browse our extensive catalog of social media services and select the perfect package for your needs.',
  },
  {
    number: '03',
    iconName: 'FaWallet',
    title: 'Add Funds',
    description:
      'Securely add funds to your account using our multiple payment methods including crypto and traditional options.',
  },
  {
    number: '04',
    iconName: 'FaRocket',
    title: 'Watch Growth',
    description:
      'Sit back and watch your social media presence grow with our high-quality, fast delivery services.',
  },
];
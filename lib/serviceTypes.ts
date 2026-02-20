export enum ServicePackageType {
  DEFAULT = 1,
  PACKAGE = 2,
  SPECIAL_COMMENTS = 3,
  PACKAGE_COMMENTS = 4,
  AUTO_LIKES = 11,
  AUTO_VIEWS = 12,
  AUTO_COMMENTS = 13,
  LIMITED_AUTO_LIKES = 14,
  LIMITED_AUTO_VIEWS = 15
}

export function servicePackageType(type: number): string {
  switch (type) {
    case 1:
      return "Default";
    case 2:
      return "Package";
    case 3:
      return "Special comments";
    case 4:
      return "Package comments";
    case 11:
      return "Auto Likes";
    case 12:
      return "Auto Views";
    case 13:
      return "Auto Comments";
    case 14:
      return "Limited Auto Likes";
    case 15:
      return "Limited Auto Views";
    default:
      return "Subscriptions";
  }
}

export interface ServiceTypeConfig {
  id: number;
  name: string;
  description: string;
  requiresQuantity: boolean;
  requiresLink: boolean;
  requiresComments: boolean;
  requiresUsername: boolean;
  requiresPosts: boolean;
  isSubscription: boolean;
  isLimited: boolean;
  fixedQuantity: boolean;
  allowsDelay: boolean;
  allowsRuns: boolean;
  allowsInterval: boolean;
  icon?: string;
  color?: string;
}

export const SERVICE_TYPE_CONFIGS: Record<number, ServiceTypeConfig> = {
  1: {
    id: 1,
    name: "Default",
    description: "Standard quantity-based service",
    requiresQuantity: true,
    requiresLink: true,
    requiresComments: false,
    requiresUsername: false,
    requiresPosts: false,
    isSubscription: false,
    isLimited: false,
    fixedQuantity: false,
    allowsDelay: false,
    allowsRuns: false,
    allowsInterval: false,
    icon: "📊",
    color: "blue"
  },
  2: {
    id: 2,
    name: "Package",
    description: "Fixed quantity package service",
    requiresQuantity: false,
    requiresLink: true,
    requiresComments: false,
    requiresUsername: false,
    requiresPosts: false,
    isSubscription: false,
    isLimited: false,
    fixedQuantity: true,
    allowsDelay: false,
    allowsRuns: false,
    allowsInterval: false,
    icon: "📦",
    color: "green"
  },
  3: {
    id: 3,
    name: "Special Comments",
    description: "Service with custom comments",
    requiresQuantity: true,
    requiresLink: true,
    requiresComments: true,
    requiresUsername: false,
    requiresPosts: false,
    isSubscription: false,
    isLimited: false,
    fixedQuantity: false,
    allowsDelay: false,
    allowsRuns: false,
    allowsInterval: false,
    icon: "💬",
    color: "purple"
  },
  4: {
    id: 4,
    name: "Package Comments",
    description: "Package with custom comments",
    requiresQuantity: false,
    requiresLink: true,
    requiresComments: true,
    requiresUsername: false,
    requiresPosts: false,
    isSubscription: false,
    isLimited: false,
    fixedQuantity: true,
    allowsDelay: false,
    allowsRuns: false,
    allowsInterval: false,
    icon: "📦💬",
    color: "indigo"
  },
  11: {
    id: 11,
    name: "Auto Likes",
    description: "Subscription auto likes service",
    requiresQuantity: true,
    requiresLink: false,
    requiresComments: false,
    requiresUsername: true,
    requiresPosts: true,
    isSubscription: true,
    isLimited: false,
    fixedQuantity: false,
    allowsDelay: true,
    allowsRuns: true,
    allowsInterval: true,
    icon: "❤️",
    color: "red"
  },
  12: {
    id: 12,
    name: "Auto Views",
    description: "Subscription auto views service",
    requiresQuantity: true,
    requiresLink: false,
    requiresComments: false,
    requiresUsername: true,
    requiresPosts: true,
    isSubscription: true,
    isLimited: false,
    fixedQuantity: false,
    allowsDelay: true,
    allowsRuns: true,
    allowsInterval: true,
    icon: "👁️",
    color: "orange"
  },
  13: {
    id: 13,
    name: "Auto Comments",
    description: "Subscription auto comments service",
    requiresQuantity: true,
    requiresLink: false,
    requiresComments: true,
    requiresUsername: true,
    requiresPosts: true,
    isSubscription: true,
    isLimited: false,
    fixedQuantity: false,
    allowsDelay: true,
    allowsRuns: true,
    allowsInterval: true,
    icon: "💭",
    color: "yellow"
  },
  14: {
    id: 14,
    name: "Limited Auto Likes",
    description: "Limited subscription auto likes",
    requiresQuantity: true,
    requiresLink: false,
    requiresComments: false,
    requiresUsername: true,
    requiresPosts: true,
    isSubscription: true,
    isLimited: true,
    fixedQuantity: false,
    allowsDelay: true,
    allowsRuns: true,
    allowsInterval: true,
    icon: "❤️⏰",
    color: "pink"
  },
  15: {
    id: 15,
    name: "Limited Auto Views",
    description: "Limited subscription auto views",
    requiresQuantity: true,
    requiresLink: false,
    requiresComments: false,
    requiresUsername: true,
    requiresPosts: true,
    isSubscription: true,
    isLimited: true,
    fixedQuantity: false,
    allowsDelay: true,
    allowsRuns: true,
    allowsInterval: true,
    icon: "👁️⏰",
    color: "teal"
  }
};

export function getServiceTypeConfig(typeId: number): ServiceTypeConfig | null {
  return SERVICE_TYPE_CONFIGS[typeId] || null;
}

export function getAllServiceTypes(): ServiceTypeConfig[] {
  return Object.values(SERVICE_TYPE_CONFIGS);
}

export function getSubscriptionTypes(): ServiceTypeConfig[] {
  return Object.values(SERVICE_TYPE_CONFIGS).filter(config => config.isSubscription);
}

export function getPackageTypes(): ServiceTypeConfig[] {
  return Object.values(SERVICE_TYPE_CONFIGS).filter(config => config.fixedQuantity);
}

export function getCommentTypes(): ServiceTypeConfig[] {
  return Object.values(SERVICE_TYPE_CONFIGS).filter(config => config.requiresComments);
}

export function validateOrderByType(typeConfig: ServiceTypeConfig, orderData: any): string[] {
  const errors: string[] = [];

  if (typeConfig.requiresLink && !orderData.link) {
    errors.push('Link is required for this service type');
  }

  if (typeConfig.requiresQuantity && (!orderData.qty || orderData.qty <= 0)) {
    errors.push('Quantity is required for this service type');
  }

  if (typeConfig.requiresComments && !orderData.comments) {
    errors.push('Comments are required for this service type');
  }

  if (typeConfig.requiresUsername && !orderData.username) {
    errors.push('Username is required for this service type');
  }

  if (typeConfig.requiresPosts && (!orderData.posts || orderData.posts <= 0)) {
    errors.push('Number of posts is required for this service type');
  }

  if (typeConfig.isSubscription) {
    if (typeConfig.allowsRuns && (!orderData.runs || orderData.runs <= 0)) {
      errors.push('Number of runs is required for subscription services');
    }

    if (typeConfig.allowsInterval && (!orderData.intervalTime || orderData.intervalTime <= 0)) {
      errors.push('Interval time is required for subscription services');
    }
  }

  return errors;
}

export function calculatePrice(service: any, typeConfig: ServiceTypeConfig, quantity: number): number {
  if (typeConfig.fixedQuantity) {
    const fixedQty = service.typeParameters?.fixedQuantity || 1;
    return parseFloat(service.rate) * fixedQty;
  }

  return parseFloat(service.rate) * quantity;
}

export function getOrderProcessingData(typeConfig: ServiceTypeConfig, orderData: any) {
  return {
    serviceType: typeConfig.id,
    isSubscription: typeConfig.isSubscription,
    isLimited: typeConfig.isLimited,
    requiresComments: typeConfig.requiresComments,
    requiresUsername: typeConfig.requiresUsername,
    requiresPosts: typeConfig.requiresPosts,
    allowsDelay: typeConfig.allowsDelay,
    allowsRuns: typeConfig.allowsRuns,
    allowsInterval: typeConfig.allowsInterval,
    processingPriority: typeConfig.isSubscription ? 'high' : 'normal'
  };
}

export interface ServiceTypeResponse {
  id: number;
  name: string;
  description: string;
  parameters: any;
  validationRules: any;
  processingLogic: any;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    services: number;
  };
}

export interface ServiceWithType {
  id: number;
  name: string;
  rate: number;
  min_order: number;
  max_order: number;
  description: string;
  categoryId: number;
  serviceTypeId: number;
  typeParameters: any;
  status: boolean;
  cancel: boolean;
  refill: boolean;
  createdAt: Date;
  updatedAt: Date;
  serviceType: ServiceTypeResponse;
  category: any;
}

export interface OrderWithType {
  id: number;
  serviceId: number;
  userId: number;
  link: string | null;
  qty: number;
  price: number;
  status: string;
  typeData: any;
  comments: string | null;
  username: string | null;
  posts: number | null;
  delay: number | null;
  runs: number | null;
  intervalTime: number | null;
  createdAt: Date;
  updatedAt: Date;
  service: ServiceWithType;
  category: any;
  user: any;
}
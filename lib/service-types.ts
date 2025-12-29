
export enum ServiceType {
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

export interface ServiceTypeField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'checkbox';
  required: boolean;
  placeholder?: string;
  description?: string;
  min?: number;
  max?: number;
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
  fields: ServiceTypeField[];
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
    fields: []
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
    fields: []
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
    fields: [
      {
        name: 'comments',
        label: 'Comments',
        type: 'textarea',
        required: true,
        placeholder: 'Enter comments (one per line)',
        description: 'Enter each comment on a new line'
      }
    ]
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
    fields: [
      {
        name: 'comments',
        label: 'Comments',
        type: 'textarea',
        required: true,
        placeholder: 'Enter comments (one per line)',
        description: 'Enter each comment on a new line'
      }
    ]
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
    fields: [
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        placeholder: 'Enter username',
        description: 'Username to monitor for new posts'
      },
      {
        name: 'posts',
        label: 'Number of Posts',
        type: 'number',
        required: true,
        placeholder: 'Enter number of posts',
        description: 'Number of new posts to process',
        min: 1,
        max: 100
      },
      {
        name: 'delay',
        label: 'Delay (minutes)',
        type: 'number',
        required: false,
        placeholder: 'Enter delay in minutes',
        description: 'Delay between processing posts',
        min: 0,
        max: 1440
      },
      {
        name: 'isDripfeed',
        label: 'Enable Drip-feed',
        type: 'checkbox',
        required: false,
        description: 'Enable drip-feed delivery'
      },
      {
        name: 'dripfeedRuns',
        label: 'Drip-feed Runs',
        type: 'number',
        required: false,
        placeholder: 'Number of runs',
        description: 'Number of drip-feed runs',
        min: 1,
        max: 100
      },
      {
        name: 'dripfeedInterval',
        label: 'Drip-feed Interval (minutes)',
        type: 'number',
        required: false,
        placeholder: 'Interval in minutes',
        description: 'Interval between drip-feed runs',
        min: 1,
        max: 1440
      },
      {
        name: 'isSubscription',
        label: 'Subscription Service',
        type: 'checkbox',
        required: false,
        description: 'This is a subscription service'
      }
    ]
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
    fields: [
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        placeholder: 'Enter username',
        description: 'Username to monitor for new posts'
      },
      {
        name: 'posts',
        label: 'Number of Posts',
        type: 'number',
        required: true,
        placeholder: 'Enter number of posts',
        description: 'Number of new posts to process',
        min: 1,
        max: 100
      },
      {
        name: 'delay',
        label: 'Delay (minutes)',
        type: 'number',
        required: false,
        placeholder: 'Enter delay in minutes',
        description: 'Delay between processing posts',
        min: 0,
        max: 1440
      },
      {
        name: 'isDripfeed',
        label: 'Enable Drip-feed',
        type: 'checkbox',
        required: false,
        description: 'Enable drip-feed delivery'
      },
      {
        name: 'dripfeedRuns',
        label: 'Drip-feed Runs',
        type: 'number',
        required: false,
        placeholder: 'Number of runs',
        description: 'Number of drip-feed runs',
        min: 1,
        max: 100
      },
      {
        name: 'dripfeedInterval',
        label: 'Drip-feed Interval (minutes)',
        type: 'number',
        required: false,
        placeholder: 'Interval in minutes',
        description: 'Interval between drip-feed runs',
        min: 1,
        max: 1440
      },
      {
        name: 'isSubscription',
        label: 'Subscription Service',
        type: 'checkbox',
        required: false,
        description: 'This is a subscription service'
      }
    ]
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
    fields: [
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        placeholder: 'Enter username',
        description: 'Username to monitor for new posts'
      },
      {
        name: 'posts',
        label: 'Number of Posts',
        type: 'number',
        required: true,
        placeholder: 'Enter number of posts',
        description: 'Number of new posts to process',
        min: 1,
        max: 100
      },
      {
        name: 'comments',
        label: 'Comments',
        type: 'textarea',
        required: true,
        placeholder: 'Enter comments (one per line)',
        description: 'Enter each comment on a new line'
      },
      {
        name: 'delay',
        label: 'Delay (minutes)',
        type: 'number',
        required: false,
        placeholder: 'Enter delay in minutes',
        description: 'Delay between processing posts',
        min: 0,
        max: 1440
      },
      {
        name: 'isDripfeed',
        label: 'Enable Drip-feed',
        type: 'checkbox',
        required: false,
        description: 'Enable drip-feed delivery'
      },
      {
        name: 'dripfeedRuns',
        label: 'Drip-feed Runs',
        type: 'number',
        required: false,
        placeholder: 'Number of runs',
        description: 'Number of drip-feed runs',
        min: 1,
        max: 100
      },
      {
        name: 'dripfeedInterval',
        label: 'Drip-feed Interval (minutes)',
        type: 'number',
        required: false,
        placeholder: 'Interval in minutes',
        description: 'Interval between drip-feed runs',
        min: 1,
        max: 1440
      },
      {
        name: 'isSubscription',
        label: 'Subscription Service',
        type: 'checkbox',
        required: false,
        description: 'This is a subscription service'
      }
    ]
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
    fields: [
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        placeholder: 'Enter username',
        description: 'Username to monitor for new posts'
      },
      {
        name: 'posts',
        label: 'Number of Posts',
        type: 'number',
        required: true,
        placeholder: 'Enter number of posts',
        description: 'Number of new posts to process',
        min: 1,
        max: 100
      },
      {
        name: 'minQty',
        label: 'Minimum Quantity',
        type: 'number',
        required: true,
        placeholder: 'Enter minimum quantity',
        description: 'Minimum quantity per post',
        min: 1
      },
      {
        name: 'maxQty',
        label: 'Maximum Quantity',
        type: 'number',
        required: true,
        placeholder: 'Enter maximum quantity',
        description: 'Maximum quantity per post',
        min: 1
      },
      {
        name: 'delay',
        label: 'Delay (minutes)',
        type: 'number',
        required: false,
        placeholder: 'Enter delay in minutes',
        description: 'Delay between processing posts',
        min: 0,
        max: 1440
      },
      {
        name: 'isDripfeed',
        label: 'Enable Drip-feed',
        type: 'checkbox',
        required: false,
        description: 'Enable drip-feed delivery'
      },
      {
        name: 'dripfeedRuns',
        label: 'Drip-feed Runs',
        type: 'number',
        required: false,
        placeholder: 'Number of runs',
        description: 'Number of drip-feed runs',
        min: 1,
        max: 100
      },
      {
        name: 'dripfeedInterval',
        label: 'Drip-feed Interval (minutes)',
        type: 'number',
        required: false,
        placeholder: 'Interval in minutes',
        description: 'Interval between drip-feed runs',
        min: 1,
        max: 1440
      },
      {
        name: 'isSubscription',
        label: 'Subscription Service',
        type: 'checkbox',
        required: false,
        description: 'This is a subscription service'
      }
    ]
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
    fields: [
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        placeholder: 'Enter username',
        description: 'Username to monitor for new posts'
      },
      {
        name: 'posts',
        label: 'Number of Posts',
        type: 'number',
        required: true,
        placeholder: 'Enter number of posts',
        description: 'Number of new posts to process',
        min: 1,
        max: 100
      },
      {
        name: 'minQty',
        label: 'Minimum Quantity',
        type: 'number',
        required: true,
        placeholder: 'Enter minimum quantity',
        description: 'Minimum quantity per post',
        min: 1
      },
      {
        name: 'maxQty',
        label: 'Maximum Quantity',
        type: 'number',
        required: true,
        placeholder: 'Enter maximum quantity',
        description: 'Maximum quantity per post',
        min: 1
      },
      {
        name: 'delay',
        label: 'Delay (minutes)',
        type: 'number',
        required: false,
        placeholder: 'Enter delay in minutes',
        description: 'Delay between processing posts',
        min: 0,
        max: 1440
      },
      {
        name: 'isDripfeed',
        label: 'Enable Drip-feed',
        type: 'checkbox',
        required: false,
        description: 'Enable drip-feed delivery'
      },
      {
        name: 'dripfeedRuns',
        label: 'Drip-feed Runs',
        type: 'number',
        required: false,
        placeholder: 'Number of runs',
        description: 'Number of drip-feed runs',
        min: 1,
        max: 100
      },
      {
        name: 'dripfeedInterval',
        label: 'Drip-feed Interval (minutes)',
        type: 'number',
        required: false,
        placeholder: 'Interval in minutes',
        description: 'Interval between drip-feed runs',
        min: 1,
        max: 1440
      },
      {
        name: 'isSubscription',
        label: 'Subscription Service',
        type: 'checkbox',
        required: false,
        description: 'This is a subscription service'
      }
    ]
  }
};

export function getServiceTypeConfig(type: ServiceType | number): ServiceTypeConfig | null {
  const typeId = typeof type === 'number' ? type : type;
  return SERVICE_TYPE_CONFIGS[typeId] || null;
}

export function getServiceTypeName(type: ServiceType | number): string {
  return servicePackageType(typeof type === 'number' ? type : type);
}

export function isSubscriptionType(type: ServiceType | number): boolean {
  const config = getServiceTypeConfig(type);
  return config?.isSubscription || false;
}

export function requiresComments(type: ServiceType | number): boolean {
  const config = getServiceTypeConfig(type);
  return config?.requiresComments || false;
}

export function requiresUsername(type: ServiceType | number): boolean {
  const config = getServiceTypeConfig(type);
  return config?.requiresUsername || false;
}

export function requiresPosts(type: ServiceType | number): boolean {
  const config = getServiceTypeConfig(type);
  return config?.requiresPosts || false;
}

export function isFixedQuantity(type: ServiceType | number): boolean {
  const config = getServiceTypeConfig(type);
  return config?.fixedQuantity || false;
}

export function validateOrderByType(
  type: ServiceType | number,
  data: {
    link?: string;
    qty?: number;
    comments?: string;
    username?: string;
    posts?: number;
    delay?: number;
    minQty?: number;
    maxQty?: number;
    isDripfeed?: boolean;
    dripfeedRuns?: number;
    dripfeedInterval?: number;
    isSubscription?: boolean;
  }
): Record<string, string> {
  const errors: Record<string, string> = {};
  const config = getServiceTypeConfig(type);

  if (!config) {
    errors.general = 'Invalid service type';
    return errors;
  }

  if (config.requiresLink && !data.link) {
    errors.link = 'Link is required for this service type';
  }

  if (config.requiresQuantity && (!data.qty || data.qty <= 0)) {
    errors.qty = 'Quantity is required for this service type';
  }

  if (config.requiresComments && !data.comments) {
    errors.comments = 'Comments are required for this service type';
  }

  if (config.requiresUsername && !data.username) {
    errors.username = 'Username is required for this service type';
  }

  if (config.requiresPosts && (!data.posts || data.posts <= 0)) {
    errors.posts = 'Number of posts is required for this service type';
  }

  if (data.isDripfeed) {
    if (!data.dripfeedRuns || data.dripfeedRuns <= 0) {
      errors.dripfeedRuns = 'Drip-feed runs is required when drip-feed is enabled';
    }
    if (!data.dripfeedInterval || data.dripfeedInterval <= 0) {
      errors.dripfeedInterval = 'Drip-feed interval is required when drip-feed is enabled';
    }
  }

  if (config.isLimited) {
    if (!data.minQty || data.minQty <= 0) {
      errors.minQty = 'Minimum quantity is required for limited services';
    }
    if (!data.maxQty || data.maxQty <= 0) {
      errors.maxQty = 'Maximum quantity is required for limited services';
    }
    if (data.minQty && data.maxQty && data.minQty > data.maxQty) {
      errors.maxQty = 'Maximum quantity must be greater than minimum quantity';
    }
  }

  return errors;
}


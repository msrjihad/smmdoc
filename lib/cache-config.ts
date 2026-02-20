export const CACHE_TIMES = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000
} as const;

export const CACHE_PROFILES = {
  REALTIME: {
    stale: CACHE_TIMES.SECOND * 10,
    revalidate: CACHE_TIMES.SECOND * 30,
    expire: CACHE_TIMES.MINUTE
  },
  
  SERVICES: {
    stale: CACHE_TIMES.MINUTE,
    revalidate: CACHE_TIMES.MINUTE * 5,
    expire: CACHE_TIMES.MINUTE * 15
  },
  
  CURRENCY: {
    stale: CACHE_TIMES.MINUTE * 30,
    revalidate: CACHE_TIMES.HOUR,
    expire: CACHE_TIMES.HOUR * 6
  },
  
  SETTINGS: {
    stale: CACHE_TIMES.HOUR,
    revalidate: CACHE_TIMES.HOUR * 6,
    expire: CACHE_TIMES.DAY
  },
  
  STATIC: {
    stale: CACHE_TIMES.HOUR * 6,
    revalidate: CACHE_TIMES.DAY,
    expire: CACHE_TIMES.WEEK
  },

  ORDERS: {
    stale: CACHE_TIMES.SECOND * 30,
    revalidate: CACHE_TIMES.MINUTE * 2,
    expire: CACHE_TIMES.MINUTE * 5
  },

  USER_DATA: {
    stale: CACHE_TIMES.MINUTE,
    revalidate: CACHE_TIMES.MINUTE * 3,
    expire: CACHE_TIMES.MINUTE * 10
  },

  STATISTICS: {
    stale: CACHE_TIMES.MINUTE * 5,
    revalidate: CACHE_TIMES.MINUTE * 15,
    expire: CACHE_TIMES.HOUR
  },

  BLOG: {
    stale: CACHE_TIMES.HOUR * 12,
    revalidate: CACHE_TIMES.DAY,
    expire: CACHE_TIMES.WEEK
  }
} as const;

export const CACHE_PRESETS = {
  REALTIME: "seconds",
  FREQUENT: "minutes",
  HOURLY: "hours",
  DAILY: "days",
  STATIC: "weeks"
} as const;

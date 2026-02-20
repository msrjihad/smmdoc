
export async function getServiceStats() {
  try {
    return {
      totalServices: 2450,
      avgDeliveryTime: '2 Days',
      supportResponseTime: '1 Hour',
      totalCompletedOrders: 35690,
      customerSatisfactionRate: '98%',
    };
  } catch (error) {
    console.error('Error fetching service stats:', error);
    return {
      totalServices: 0,
      avgDeliveryTime: 'N/A',
      supportResponseTime: 'N/A',
    };
  }
} 
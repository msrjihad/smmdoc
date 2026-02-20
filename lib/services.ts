
export async function getServices() {
  try {
    return [
      { 
        id: '1', 
        name: 'Facebook Page Likes', 
        description: 'High quality Facebook page likes from real users', 
        price: 5.99, 
        category: { name: 'Facebook' },
        popular: true
      },
      { 
        id: '2', 
        name: 'Instagram Followers', 
        description: 'Organic Instagram followers for your profile', 
        price: 7.99, 
        category: { name: 'Instagram' },
        popular: true,
        new: true
      },
      { 
        id: '3', 
        name: 'YouTube Views', 
        description: 'Real and engaging YouTube views', 
        price: 3.99,
        category: { name: 'YouTube' },
        popular: true
      },
      { 
        id: '4', 
        name: 'TikTok Followers', 
        description: 'Increase your TikTok followers fast', 
        price: 6.99,
        category: { name: 'TikTok' },
        popular: true
      },
      { 
        id: '5', 
        name: 'Twitter Retweets', 
        description: 'Get more engagement with retweets', 
        price: 4.99,
        category: { name: 'Twitter' },
        popular: true
      },
      { 
        id: '6', 
        name: 'LinkedIn Connections', 
        description: 'Build your professional network', 
        price: 9.99,
        category: { name: 'LinkedIn' },
        popular: true
      }
    ];
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
}
export async function getServiceById(id: string) {
  try {
    const services = await getServices();
    return services.find(service => service.id === id);
  } catch (error) {
    console.error(`Error fetching service with ID ${id}:`, error);
    return null;
  }
}
export async function getServicesByCategory(categoryId: string) {
  try {
    const services = await getServices();
    return services.filter(service => service.category.name === categoryId);
  } catch (error) {
    console.error(`Error fetching services for category ${categoryId}:`, error);
    return [];
  }
} 
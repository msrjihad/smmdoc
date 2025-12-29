
export async function getCategories() {
  try {
    return [
      { 
        id: '1', 
        name: 'Facebook', 
        serviceCount: 124,
      },
      { 
        id: '2', 
        name: 'Instagram', 
        serviceCount: 86,
      },
      { 
        id: '3', 
        name: 'YouTube', 
        serviceCount: 54,
      },
      { 
        id: '4', 
        name: 'Twitter', 
        serviceCount: 42,
      },
      { 
        id: '5', 
        name: 'TikTok', 
        serviceCount: 68,
      },
      { 
        id: '6', 
        name: 'LinkedIn', 
        serviceCount: 28,
      },
      { 
        id: '7', 
        name: 'Website Traffic', 
        serviceCount: 34,
      },
      { 
        id: '8', 
        name: 'SEO', 
        serviceCount: 21,
      }
    ];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}
export async function getCategoryById(id: string) {
  try {
    const categories = await getCategories();
    return categories.find(category => category.id === id);
  } catch (error) {
    console.error(`Error fetching category with ID ${id}:`, error);
    return null;
  }
} 
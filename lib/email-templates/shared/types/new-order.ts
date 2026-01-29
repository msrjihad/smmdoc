

export interface NewOrderEmailData {
  userName: string;
  userEmail: string;
  orderId: string;
  orderTotal: string;
  currency?: string;
  orderDate: string;
  userId?: string;
  orderItems?: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  deliveryTime?: string;
  orderStatus?: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentMethod?: string;
}

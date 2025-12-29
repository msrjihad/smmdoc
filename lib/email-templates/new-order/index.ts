
import { createEmailTemplate, emailContentSections, EmailLayoutData } from '../shared/email-layout';

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

export const newOrderTemplates = {
  userOrderConfirmation: (data: NewOrderEmailData) => {
    const layoutData: EmailLayoutData = {
      title: 'Order Confirmed!',
      headerColor: 'primary-color',
      footerMessage: 'Thank you for choosing our services!',
      userEmail: data.userEmail
    };

    const content = `
      ${emailContentSections.greeting(data.userName)}
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Thank you for your order! We've received your request and our team is now processing it. You'll receive updates as your order progresses.
      </p>

      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">Order Details</h3>
        ${emailContentSections.infoTable([
          {label: 'Order ID', value: `#${data.orderId}`},
          {label: 'Order Total', value: `${data.orderTotal} ${data.currency || 'BDT'}`, valueColor: '#22c55e'},
          {label: 'Status', value: data.orderStatus || 'Processing', valueColor: '#f59e0b'},
          {label: 'Order Date', value: data.orderDate},
          ...(data.deliveryTime ? [{label: 'Estimated Delivery', value: data.deliveryTime}] : []),
          ...(data.paymentMethod ? [{label: 'Payment Method', value: data.paymentMethod}] : [])
        ])}
      </div>

            ${data.orderItems && data.orderItems.length > 0 ? `

            <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px;">Order Items:</h3>
              <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                ${data.orderItems.map(item => `
                <div style="padding: 15px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="color: #1f2937; font-weight: bold; margin-bottom: 4px;">${item.name}</div>
                    <div style="color: #6b7280; font-size: 14px;">Quantity: ${item.quantity}</div>
                  </div>
                  <div style="color: #22c55e; font-weight: bold;">${item.price} ${data.currency || 'BDT'}</div>
                </div>
                `).join('')}
              </div>
            </div>
            ` : ''}

            <div style="background-color: #e0f2fe; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">What happens next?</h3>
              <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Our team will review and process your order</li>
                <li style="margin-bottom: 8px;">You'll receive email updates on order progress</li>
                <li style="margin-bottom: 8px;">Order completion typically takes ${data.deliveryTime || '24-48 hours'}</li>
                <li style="margin-bottom: 8px;">You can track your order status in your dashboard</li>
              </ul>
            </div>

      ${emailContentSections.actionButtons([
        {text: 'Track Order Status', url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${data.orderId}`}
      ])}

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        Thank you for choosing our service! If you have any questions about your order, please don't hesitate to contact our support team.
      </p>
    `;

    return createEmailTemplate(layoutData, content);
  },
  adminNewOrder: (data: NewOrderEmailData) => {
    const layoutData: EmailLayoutData = {
      title: 'New Order Received',
      headerColor: 'primary-color',
      footerMessage: 'Admin notification - please process promptly',
      userEmail: data.userEmail
    };

    const content = `
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        A new order has been placed and requires processing.
      </p>

            <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Order Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Order ID:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">#${data.orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Customer:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${data.userName} (${data.userEmail})</td>
                </tr>
                ${data.userId ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">User ID:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${data.userId}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Order Total:</td>
                  <td style="padding: 8px 0; color: #22c55e; font-weight: bold; font-size: 18px;">${data.orderTotal} ${data.currency || 'BDT'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Status:</td>
                  <td style="padding: 8px 0; color: #f59e0b; font-weight: bold; text-transform: capitalize;">${data.orderStatus || 'Pending'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Order Date:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${data.orderDate}</td>
                </tr>
                ${data.paymentMethod ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Payment Method:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${data.paymentMethod}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            ${data.orderItems && data.orderItems.length > 0 ? `

            <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px;">Ordered Items:</h3>
              <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                ${data.orderItems!.map((item, index) => `
                <div style="padding: 15px; ${index < data.orderItems!.length - 1 ? 'border-bottom: 1px solid #f3f4f6;' : ''} display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="color: #1f2937; font-weight: bold; margin-bottom: 4px;">${item.name}</div>
                    <div style="color: #6b7280; font-size: 14px;">Qty: ${item.quantity}</div>
                  </div>
                  <div style="color: #22c55e; font-weight: bold;">${item.price} ${data.currency || 'BDT'}</div>
                </div>
                `).join('')}
              </div>
            </div>
            ` : ''}

            <div style="background-color: #fef3c7; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Action Required:</h3>
              <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Review order details and customer requirements</li>
                <li style="margin-bottom: 8px;">Verify payment status and customer balance</li>
                <li style="margin-bottom: 8px;">Begin order processing and update status</li>
                <li style="margin-bottom: 8px;">Notify customer of any delays or issues</li>
              </ul>
            </div>

      ${emailContentSections.actionButtons([
        {text: 'Process Order', url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${data.orderId}`}
      ])}

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        Please process this order promptly to maintain customer satisfaction.
      </p>
    `;

    return createEmailTemplate(layoutData, content);
  },
  userOrderStatusUpdate: (data: NewOrderEmailData) => {
    const statusColor = data.orderStatus === 'completed' ? 'green' : data.orderStatus === 'cancelled' ? 'red' : 'orange';
    const statusTitle = data.orderStatus === 'completed' ? 'Completed' : data.orderStatus === 'cancelled' ? 'Cancelled' : 'Updated';

    const layoutData: EmailLayoutData = {
      title: `Order ${statusTitle}!`,
      headerColor: 'primary-color',
      footerMessage: 'Thank you for choosing our services!',
      userEmail: data.userEmail
    };

    const content = `
      ${emailContentSections.greeting(data.userName)}
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        ${data.orderStatus === 'completed' ? 'Great news! Your order has been completed successfully.' : 
          data.orderStatus === 'cancelled' ? 'We regret to inform you that your order has been cancelled.' :
          data.orderStatus === 'processing' ? 'Your order is now being processed by our team.' :
          'Your order status has been updated.'}
      </p>

            <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid ${data.orderStatus === 'completed' ? '#22c55e' : data.orderStatus === 'cancelled' ? '#ef4444' : '#f59e0b'}; padding-bottom: 10px;">Order Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Order ID:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">#${data.orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Order Total:</td>
                  <td style="padding: 8px 0; color: #22c55e; font-weight: bold; font-size: 18px;">${data.orderTotal} ${data.currency || 'BDT'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Status:</td>
                  <td style="padding: 8px 0; color: ${data.orderStatus === 'completed' ? '#22c55e' : data.orderStatus === 'cancelled' ? '#ef4444' : '#f59e0b'}; font-weight: bold; text-transform: capitalize;">${data.orderStatus || 'Updated'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Updated:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${data.orderDate}</td>
                </tr>
              </table>
            </div>

            ${data.orderStatus === 'completed' ? `

            <div style="background-color: #ecfdf5; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #22c55e;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Order Completed Successfully!</h3>
              <p style="color: #4b5563; margin: 0;">Your order has been processed and completed. Thank you for choosing our service!</p>
            </div>
            ` : data.orderStatus === 'cancelled' ? `

            <div style="background-color: #fef2f2; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #ef4444;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Order Cancelled</h3>
              <p style="color: #4b5563; margin: 0;">If you have any questions about this cancellation, please contact our support team.</p>
            </div>
            ` : `

            <div style="background-color: #fef3c7; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Order in Progress</h3>
              <p style="color: #4b5563; margin: 0;">Our team is working on your order. You'll receive another update when it's completed.</p>
            </div>
            `}

      ${emailContentSections.actionButtons([
        {text: 'View Order Details', url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${data.orderId}`}
      ])}

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        ${data.orderStatus === 'completed' ? 'Thank you for your business! We hope to serve you again soon.' :
          data.orderStatus === 'cancelled' ? 'We apologize for any inconvenience. Please feel free to place a new order anytime.' :
          'Thank you for your patience as we process your order.'}
      </p>
    `;

    return createEmailTemplate(layoutData, content);
  },
};
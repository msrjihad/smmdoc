"use client";

import { PageContainer } from '@/components/layout/page-container';
import { GridLayout } from '@/components/ui/grid-layout';
import { InfoCard } from '@/components/ui/info-card';
import { PageHeader } from '@/components/ui/page-header';
import { useEffect, useState } from 'react';

interface Order {
  id: number;
  date: string;
  service: string;
  link: string;
  quantity: number;
  price: number;
  status: 'pending' | 'processing' | 'completed' | 'canceled' | 'refunded';
}

interface OrderStats {
  total: number;
  completed: number;
  pending: number;
  canceled: number;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    completed: 0,
    pending: 0,
    canceled: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);

        setTimeout(() => {
          setOrders([]);
          setStats({
            total: 0,
            completed: 0,
            pending: 0,
            canceled: 0
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading orders:', error);
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

  };

  return (
    <PageContainer title="My Orders" subtitle="View and manage all your orders">
      <section className="mb-8">
        <GridLayout cols={4} gap="md">
          <InfoCard
            title="Total Orders"
            value={stats.total.toString()}
            icon={<i className="ri-shopping-cart-2-line"></i>}
            iconColor="blue"
          />
          <InfoCard
            title="Completed"
            value={stats.completed.toString()}
            icon={<i className="ri-check-line"></i>}
            iconColor="green"
          />
          <InfoCard
            title="Pending"
            value={stats.pending.toString()}
            icon={<i className="ri-time-line"></i>}
            iconColor="orange"
          />
          <InfoCard
            title="Canceled"
            value={stats.canceled.toString()}
            icon={<i className="ri-close-circle-line"></i>}
            iconColor="red"
          />
        </GridLayout>
      </section>
      <section className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Search Orders</label>
              <input 
                type="text" 
                placeholder="Order ID or link"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Status</label>
              <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Date Range</label>
              <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </form>
        </div>
      </section>
      <section>
        <PageHeader 
          title="Order History" 
          action={
            <div className="flex space-x-2">
              <button className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-1 px-3 rounded-md text-sm">
                Export CSV
              </button>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm flex items-center gap-1"
                onClick={() => window.location.reload()}
              >
                {loading ? <i className="ri-loader-2-line animate-spin"></i> : <i className="ri-refresh-line"></i>}
                Refresh
              </button>
            </div>
          }
        />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Link</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr className="text-center">
                    <td colSpan={8} className="px-4 py-10 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <i className="ri-loader-2-line text-4xl mb-3 text-blue-500 animate-spin"></i>
                        <p>লোড হচ্ছে...</p>
                      </div>
                    </td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-4 text-sm">{order.id}</td>
                      <td className="px-4 py-4 text-sm">{order.date}</td>
                      <td className="px-4 py-4 text-sm">{order.service}</td>
                      <td className="px-4 py-4 text-sm truncate max-w-[150px]">
                        <a href={order.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          {order.link}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-sm">{order.quantity.toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm">৳{order.price.toFixed(2)}</td>
                      <td className="px-4 py-4 text-sm">
                        {order.status === 'completed' && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs">
                            Completed
                          </span>
                        )}
                        {order.status === 'pending' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-full text-xs">
                            Pending
                          </span>
                        )}
                        {order.status === 'processing' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs">
                            Processing
                          </span>
                        )}
                        {order.status === 'canceled' && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-full text-xs">
                            Canceled
                          </span>
                        )}
                        {order.status === 'refunded' && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 rounded-full text-xs">
                            Refunded
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <button className="text-blue-500 hover:text-blue-700 mr-2">
                          <i className="ri-eye-line"></i>
                        </button>
                        {['pending', 'processing'].includes(order.status) && (
                          <button className="text-red-500 hover:text-red-700">
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="text-center">
                    <td colSpan={8} className="px-4 py-10 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <i className="ri-inbox-line text-4xl mb-3 text-gray-400"></i>
                        <p>কোনো অর্ডার পাওয়া যায়নি</p>
                        <p className="text-xs mt-1">আপনি অর্ডার দিলে সেগুলো এখানে দেখা যাবে</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}

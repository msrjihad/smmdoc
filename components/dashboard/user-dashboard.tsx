'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/contexts/currency-context';
import { useGetUserStatsQuery } from '@/lib/services/dashboard-api';
import { Clock } from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';
import { FaDollarSign, FaShoppingCart, FaWallet } from 'react-icons/fa';

export default function UserDashboard() {
  const { data: response, error, isLoading } = useGetUserStatsQuery(undefined);
  const { currency, rate, availableCurrencies } = useCurrency();

  const formatCurrency = (amount: number) => {
    const currentCurrencyData = availableCurrencies?.find(c => c.code === currency);
    const symbol = currentCurrencyData?.symbol || '$';
    const currencyRate = currentCurrencyData?.rate || 1;
    
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    }
    
    const convertedAmount = amount * currencyRate;
    return `${symbol}${convertedAmount.toFixed(2)}`;
  };
  const stats = response?.data;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28 mb-2" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading dashboard!</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-purple-900 dark:to-indigo-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative p-6 rounded-2xl backdrop-blur-lg bg-white/70 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 border border-white/20 dark:border-slate-700/50 shadow-xl dark:shadow-2xl dark:shadow-purple-500/20 hover:shadow-2xl dark:hover:shadow-purple-500/30 transition-all duration-300 dark:hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-purple-500/10 dark:to-transparent opacity-50" />
            <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-purple-500/5 dark:to-blue-500/5 opacity-0 dark:opacity-100 rounded-2xl" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium dark:text-white dark:drop-shadow-lg">
                Balance
              </CardTitle>
              <FaWallet className="h-4 w-4 text-muted-foreground dark:text-emerald-400 dark:drop-shadow-sm" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold dark:text-white dark:drop-shadow-lg">
                {formatCurrency(stats?.balance || 0)}
              </div>
              <p className="text-xs text-muted-foreground dark:text-gray-300">
                Payment Method: UddoktaPay
              </p>
            </CardContent>
          </Card>
          <Card className="relative p-6 rounded-2xl backdrop-blur-lg bg-white/70 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 border border-white/20 dark:border-slate-700/50 shadow-xl dark:shadow-2xl dark:shadow-blue-500/20 hover:shadow-2xl dark:hover:shadow-blue-500/30 transition-all duration-300 dark:hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-blue-500/10 dark:to-transparent opacity-50" />
            <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-blue-500/5 dark:to-purple-500/5 opacity-0 dark:opacity-100 rounded-2xl" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium dark:text-white dark:drop-shadow-lg">
                Total Orders
              </CardTitle>
              <FaShoppingCart className="h-4 w-4 text-muted-foreground dark:text-blue-400 dark:drop-shadow-sm" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold dark:text-white dark:drop-shadow-lg">
                {stats?.totalOrders || 0}
              </div>
              <p className="text-xs text-muted-foreground dark:text-gray-300">
                <Link
                  href="/my-orders"
                  className="text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  View All Orders
                </Link>
              </p>
            </CardContent>
          </Card>
          <Card className="relative p-6 rounded-2xl backdrop-blur-lg bg-white/70 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 border border-white/20 dark:border-slate-700/50 shadow-xl dark:shadow-2xl dark:shadow-green-500/20 hover:shadow-2xl dark:hover:shadow-green-500/30 transition-all duration-300 dark:hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-green-500/10 dark:to-transparent opacity-50" />
            <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-green-500/5 dark:to-emerald-500/5 opacity-0 dark:opacity-100 rounded-2xl" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium dark:text-white dark:drop-shadow-lg">
                Total Spent
              </CardTitle>
              <FaDollarSign className="h-4 w-4 text-muted-foreground dark:text-green-400 dark:drop-shadow-sm" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold dark:text-white dark:drop-shadow-lg">
                {formatCurrency(stats?.totalSpent || 0)}
              </div>
              <p className="text-xs text-muted-foreground dark:text-gray-300">
                Amount spent on orders
              </p>
            </CardContent>
          </Card>
          <Card className="relative p-6 rounded-2xl backdrop-blur-lg bg-white/70 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 border border-white/20 dark:border-slate-700/50 shadow-xl dark:shadow-2xl dark:shadow-orange-500/20 hover:shadow-2xl dark:hover:shadow-orange-500/30 transition-all duration-300 dark:hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-orange-500/10 dark:to-transparent opacity-50" />
            <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-orange-500/5 dark:to-yellow-500/5 opacity-0 dark:opacity-100 rounded-2xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium dark:text-white dark:drop-shadow-lg">
                Pending Orders
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground dark:text-orange-400 dark:drop-shadow-sm" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold dark:text-white dark:drop-shadow-lg">
                {stats?.ordersByStatus?.pending || 0}
              </div>
              <p className="text-xs text-muted-foreground dark:text-gray-300">
                Orders awaiting processing
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 mt-6">
          <Card className="col-span-1 relative p-6 rounded-2xl backdrop-blur-lg bg-white/70 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 border border-white/20 dark:border-slate-700/50 shadow-xl dark:shadow-2xl dark:shadow-indigo-500/20 hover:shadow-2xl dark:hover:shadow-indigo-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-indigo-500/10 dark:to-transparent opacity-50" />
            <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-indigo-500/5 dark:to-purple-500/5 opacity-0 dark:opacity-100 rounded-2xl" />
            <CardHeader className="relative z-10">
              <CardTitle className="dark:text-white dark:drop-shadow-lg">
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between border-b dark:border-slate-600/50 pb-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 p-2 rounded-lg transition-all duration-300"
                    >
                      <div>
                        <p className="font-medium truncate max-w-[200px] dark:text-white">
                          {order.service.name}
                        </p>
                        <p className="text-xs text-muted-foreground dark:text-gray-300">
                          {order.category.category_name}
                        </p>
                        <p className="text-xs dark:text-gray-400">
                          {moment(order.createdAt).format('DD/MM/YYYY')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        {(() => {
                          const displayStatus = order.providerStatus === 'forward_failed' && order.status === 'failed' ? 'pending' : order.status;
                          return (
                            <Badge
                              className={
                                displayStatus === 'pending'
                                  ? 'bg-yellow-500 dark:bg-yellow-600 dark:shadow-lg dark:shadow-yellow-500/30'
                                  : displayStatus === 'processing'
                                  ? 'bg-blue-500 dark:bg-blue-600 dark:shadow-lg dark:shadow-blue-500/30'
                                  : displayStatus === 'completed'
                                  ? 'bg-green-500 dark:bg-green-600 dark:shadow-lg dark:shadow-green-500/30'
                                  : 'bg-red-500 dark:bg-red-600 dark:shadow-lg dark:shadow-red-500/30'
                              }
                            >
                              {displayStatus}
                            </Badge>
                          );
                        })()}
                        <span className="text-sm mt-1 dark:text-white">
                          {(() => {
                            const displayCurrency = stats?.currency || 'USD';
                            if (displayCurrency === 'USD') {
                              return `$${order.usdPrice.toFixed(2)}`;
                            }
                            const currencyData = availableCurrencies?.find(c => c.code === displayCurrency);
                            const currencyRate = currencyData?.rate || rate || 1;
                            const symbol = currencyData?.symbol || '$';
                            return `${symbol}${(order.usdPrice * currencyRate).toFixed(2)}`;
                          })()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground dark:text-gray-400">
                    No orders found
                  </p>
                )}
              </div>
              {stats?.recentOrders && stats.recentOrders.length > 0 && (
                <div className="mt-4 text-center">
                  <Link
                    href="/my-orders"
                    className="text-sm text-blue-500 dark:text-blue-400 hover:underline dark:hover:text-blue-300 transition-colors"
                  >
                    View All Orders
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="col-span-1 relative p-6 rounded-2xl backdrop-blur-lg bg-white/70 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 border border-white/20 dark:border-slate-700/50 shadow-xl dark:shadow-2xl dark:shadow-pink-500/20 hover:shadow-2xl dark:hover:shadow-pink-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-pink-500/10 dark:to-transparent opacity-50" />
            <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-pink-500/5 dark:to-purple-500/5 opacity-0 dark:opacity-100 rounded-2xl" />
            <CardHeader className="relative z-10">
              <CardTitle className="dark:text-white dark:drop-shadow-lg">
                Favorite Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {stats?.favoriteCategories &&
                stats.favoriteCategories.length > 0 ? (
                  stats.favoriteCategories.map((category: any) => (
                    <div
                      key={category.id}
                      className="border-b dark:border-slate-600/50 pb-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 p-2 rounded-lg transition-all duration-300"
                    >
                      <p className="font-medium dark:text-white">
                        {category.name}
                      </p>
                      <div className="mt-1 grid grid-cols-1 gap-1">
                        {category.services.map((service: any) => (
                          <Link
                            href={`/new-order?sId=${service.id}`}
                            key={service.id}
                            className="text-xs text-blue-500 dark:text-blue-400 hover:underline dark:hover:text-blue-300 transition-colors"
                          >
                            {service.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground dark:text-gray-400">
                    No favorite categories found
                  </p>
                )}
              </div>
              <div className="mt-4 text-center">
                <Link
                  href="/services"
                  className="text-sm text-blue-500 dark:text-blue-400 hover:underline dark:hover:text-blue-300 transition-colors"
                >
                  View All Services
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

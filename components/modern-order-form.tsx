'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCurrency } from '@/contexts/currency-context';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface OrderFormProps {
  type: 'new' | 'mass' | 'custom' | 'subscription';
  darkMode?: boolean;
}

export default function ModernOrderForm({
  type,
  darkMode = false,
}: OrderFormProps) {
  const { currency, formatCurrency, currentCurrencyData, convertAmount } = useCurrency();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);

  const categories = [
    { id: '1', name: 'Facebook - Live Stream Views', icon: '👤' },
    { id: '2', name: 'Instagram - Followers', icon: '📸' },
    { id: '3', name: 'YouTube - Views', icon: '🎥' },
    { id: '4', name: 'Twitter - Retweets', icon: '🐦' },
  ];

  const services = [
    {
      id: '14678',
      categoryId: '1',
      name: 'Facebook Live Stream Viewers | 15 Minutes - $0.549 per 1000',
      price: 0.549,
      minQuantity: 25,
      maxQuantity: 3000,
      averageTime: '15 minutes',
    },
    {
      id: '14679',
      categoryId: '1',
      name: 'Facebook Live Stream Viewers | 30 Minutes - $0.899 per 1000',
      price: 0.899,
      minQuantity: 25,
      maxQuantity: 5000,
      averageTime: '30 minutes',
    },
  ];

  const filteredServices = services.filter(
    (service) => service.categoryId === selectedCategory
  );

  const currentService = services.find(
    (service) => service.id === selectedService
  );

  useEffect(() => {
    if (currentService && quantity) {
      const basePrice = (currentService.price * quantity) / 1000;

      const convertedPrice = convertAmount(basePrice, 'USD', currency);
      setPrice(convertedPrice);
    } else {
      setPrice(0);
    }
  }, [currentService, quantity, currency, convertAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService || !link || !quantity) {
      alert('Please fill in all required fields');
      return;
    }

    if (
      currentService &&
      (quantity < currentService.minQuantity ||
        quantity > currentService.maxQuantity)
    ) {
      alert(
        `Quantity must be between ${currentService.minQuantity} and ${currentService.maxQuantity}`
      );
      return;
    }

    alert(
      `Order submitted: Service ID ${selectedService}, Link: ${link}, Quantity: ${quantity}`
    );
  };

  const [massOrderText, setMassOrderText] = useState('');

  const handleMassOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!massOrderText.trim()) {
      alert('Please enter at least one order');
      return;
    }

    const lines = massOrderText.trim().split('\n');
    alert(`${lines.length} orders submitted`);
  };

  if (type === 'mass') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`rounded-lg shadow-lg ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        <form onSubmit={handleMassOrderSubmit} className="space-y-4 p-5">
          <div>
            <Label
              htmlFor="massOrders"
              className={`text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              } mb-2 block`}
            >
              Mass Orderss (One per line)
            </Label>
            <textarea
              id="massOrders"
              className={`w-full h-48 p-3 border rounded-lg font-mono ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
              }`}
              placeholder="service_id|link|quantity"
              value={massOrderText}
              onChange={(e) => setMassOrderText(e.target.value)}
            ></textarea>
            <p
              className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              } mt-2`}
            >
              Format: service_id|link|quantity
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            Submit
          </Button>
        </form>
      </motion.div>
    );
  }

  if (type === 'custom') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`rounded-lg shadow-lg ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <Label
              htmlFor="customDescription"
              className={`text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              } mb-2 block`}
            >
              Custom Service Description
            </Label>
            <textarea
              id="customDescription"
              className={`w-full h-24 p-3 border rounded-lg ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
              }`}
              placeholder="Describe your custom service requirements in detail..."
            ></textarea>
          </div>

          <div>
            <Label
              htmlFor="customLink"
              className={`text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              } mb-2 block`}
            >
              Link
            </Label>
            <Input
              id="customLink"
              type="url"
              placeholder="https://"
              className={`w-full p-2.5 border rounded-lg ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
              }`}
            />
          </div>

          <div>
            <Label
              htmlFor="customBudget"
              className={`text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              } mb-2 block`}
            >
              Budget ({currentCurrencyData?.symbol || '$'})
            </Label>
            <Input
              id="customBudget"
              type="number"
              className={`w-full p-2.5 border rounded-lg ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
              }`}
              min={1}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            Request Quote
          </Button>
        </form>
      </motion.div>
    );
  }

  if (type === 'subscription') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`rounded-lg shadow-lg ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <Label
              htmlFor="subscriptionCategory"
              className={`text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              } mb-2 block`}
            >
              Subscription Type
            </Label>
            <select
              id="subscriptionCategory"
              className={`w-full p-2.5 border rounded-lg ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
              }`}
            >
              <option value="">Select Subscription Type</option>
              <option value="weekly">Weekly Engagement</option>
              <option value="monthly">Monthly Growth</option>
              <option value="autolike">Auto Like & Comment</option>
            </select>
          </div>

          <div>
            <Label
              htmlFor="subscriptionLink"
              className={`text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              } mb-2 block`}
            >
              Profile/Page URL
            </Label>
            <Input
              id="subscriptionLink"
              type="url"
              placeholder="https://"
              className={`w-full p-2.5 border rounded-lg ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
              }`}
            />
          </div>

          <div>
            <Label
              htmlFor="subscriptionDuration"
              className={`text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              } mb-2 block`}
            >
              Duration
            </Label>
            <select
              id="subscriptionDuration"
              className={`w-full p-2.5 border rounded-lg ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
              }`}
            >
              <option value="">Select Duration</option>
              <option value="1">1 Month</option>
              <option value="3">3 Months</option>
              <option value="6">6 Months</option>
              <option value="12">12 Months</option>
            </select>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            Subscribe
          </Button>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-lg shadow-lg ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <div>
          <Label
            htmlFor="category"
            className={`text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            } mb-2 block`}
          >
            Category
          </Label>
          <select
            id="category"
            className={`w-full p-2.5 border rounded-lg ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
            }`}
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedService('');
            }}
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label
            htmlFor="service"
            className={`text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            } mb-2 block`}
          >
            Service
          </Label>
          <select
            id="service"
            className={`w-full p-2.5 border rounded-lg ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
            }`}
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            disabled={!selectedCategory}
          >
            <option value="">Select Service</option>
            {filteredServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label
            htmlFor="link"
            className={`text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            } mb-2 block`}
          >
            Link
          </Label>
          <Input
            id="link"
            type="url"
            placeholder="https://"
            className={`w-full p-2.5 border rounded-lg ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
            }`}
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>

        <div>
          <Label
            htmlFor="quantity"
            className={`text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            } mb-2 block`}
          >
            Quantity
          </Label>
          <Input
            id="quantity"
            type="number"
            className={`w-full p-2.5 border rounded-lg ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
            }`}
            value={quantity || ''}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            min={currentService?.minQuantity || 0}
            max={currentService?.maxQuantity || 9999}
          />
          {currentService && (
            <p
              className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              } mt-2`}
            >
              Min: {currentService.minQuantity} - Max:{' '}
              {currentService.maxQuantity}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor="average-time"
            className={`text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            } mb-2 block`}
          >
            Average Time
          </Label>
          <Input
            id="average-time"
            type="text"
            className={`w-full p-2.5 border rounded-lg ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'border-gray-300 bg-gray-100'
            }`}
            value={currentService?.averageTime || ''}
            readOnly
            disabled
          />
        </div>

        <div>
          <Label
            htmlFor="charge"
            className={`text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            } mb-2 block`}
          >
            Charge
          </Label>
          <Input
            id="charge"
            type="text"
            className={`w-full p-2.5 border rounded-lg ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'border-gray-300 bg-gray-100'
            }`}
            value={formatCurrency(price)}
            readOnly
            disabled
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          disabled={!selectedService || !link || !quantity}
        >
          Submit
        </Button>
      </form>
    </motion.div>
  );
}

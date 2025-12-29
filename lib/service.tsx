import { PageContainer } from '@/components/layout/page-container';
import { GridLayout } from '@/components/ui/grid-layout';
import { InfoCard } from '@/components/ui/info-card';
import { PageHeader } from '@/components/ui/page-header';
import { ServiceTile } from '@/components/ui/service-tile';

const popularServices = [
  { id: '1', title: 'Facebook Page Likes', description: 'High quality Facebook page likes from real users', price: 5.99, badge: 'Popular' },
  { id: '2', title: 'Instagram Followers', description: 'Organic Instagram followers for your profile', price: 7.99, badge: 'Hot' },
  { id: '3', title: 'YouTube Views', description: 'Real and engaging YouTube views', price: 3.99 },
  { id: '4', title: 'TikTok Followers', description: 'Increase your TikTok followers fast', price: 6.99 },
  { id: '5', title: 'Twitter Retweets', description: 'Get more engagement with retweets', price: 4.99 },
  { id: '6', title: 'LinkedIn Connections', description: 'Build your professional network', price: 9.99 },
];

const stats = [
  { title: 'Total Services', value: '2,450+', description: 'From all categories', icon: <i className="ri-stack-line"></i>, iconColor: 'blue' },
  { title: 'Average Delivery', value: '2 Days', description: 'For most services', icon: <i className="ri-time-line"></i>, iconColor: 'green' },
  { title: 'Support Response', value: '1 Hour', description: 'For all questions', icon: <i className="ri-customer-service-2-line"></i>, iconColor: 'purple' },
];

const categories = [
  { title: 'Social Media', value: '890 Services', icon: <i className="ri-group-line"></i>, iconColor: 'indigo' },
  { title: 'Marketing', value: '560 Services', icon: <i className="ri-mega-phone-line"></i>, iconColor: 'red' },
  { title: 'Website Traffic', value: '340 Services', icon: <i className="ri-global-line"></i>, iconColor: 'green' },
  { title: 'SEO', value: '210 Services', icon: <i className="ri-line-chart-line"></i>, iconColor: 'orange' },
];

export default function ExploreServicesPage() {
  return (
    <PageContainer title="Explore Services" subtitle="Browse and order from our wide range of social media services">
      <section className="mb-8">
        <GridLayout cols={3} gap="md">
          {stats.map((stat, index) => (
            <InfoCard
              key={index}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              iconColor={stat.iconColor as 'blue' | 'green' | 'purple'}
            />
          ))}
        </GridLayout>
      </section>
      <section className="mb-8">
        <PageHeader title="Service Categories" subtitle="Browse services by category" />
        <GridLayout cols={4} gap="md">
          {categories.map((category, index) => (
            <InfoCard
              key={index}
              title={category.title}
              value={category.value}
              icon={category.icon}
              iconColor={category.iconColor as 'indigo' | 'red' | 'green' | 'orange'}
              className="cursor-pointer hover:translate-y-[-5px] transition-transform"
            />
          ))}
        </GridLayout>
      </section>
      <section>
        <PageHeader 
          title="Popular Services" 
          subtitle="Most frequently ordered services"
          action={
            <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
              View All
            </button>
          }
        />
        <GridLayout cols={3} gap="md">
          {popularServices.map((service) => (
            <ServiceTile
              key={service.id}
              id={parseInt(service.id)}
              title={service.title}
              description={service.description}
              price={service.price}
              badge={service.badge}
              icon={<i className="ri-shopping-cart-2-line"></i>}
              bgColor={['purple', 'blue', 'green', 'red', 'orange', 'indigo'][Math.floor(Math.random() * 6)] as 'purple' | 'blue' | 'green' | 'red' | 'orange' | 'indigo'}
              href={`/new-order?service=${service.id}`}
            />
          ))}
        </GridLayout>
      </section>
    </PageContainer>
  );
}
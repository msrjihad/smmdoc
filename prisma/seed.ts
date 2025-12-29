import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const sampleProvider = await prisma.apiProviders.upsert({
    where: { name: 'SampleSMM' },
    update: {},
    create: {
      name: 'SampleSMM',
      api_url: 'https://api.samplesmm.com',
      api_key: 'sample_api_key_123',
      status: 'active',
      endpoints: JSON.stringify({
        services: '/services',
        get: '/services',
        categories: '/categories'
      }),
      headers: JSON.stringify({
        'Accept': 'application/json',
        'User-Agent': 'SMM-Panel/1.0'
      })
    }
  });

  console.log('✅ Created sample API provider:', sampleProvider.name);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
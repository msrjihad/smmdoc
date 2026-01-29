import { PrismaClient } from '@prisma/client';
import { TEMPLATE_SLOTS_BY_CATEGORY } from '../lib/email-templates/template-slots';

const prisma = new PrismaClient();

const DEFAULT_BODY = '<p>Edit this template in Admin → Settings → Email Templates.</p>';

async function main() {
  console.log('🌱 Starting database seeding...');

  const slots = Object.values(TEMPLATE_SLOTS_BY_CATEGORY).flat();
  for (const slot of slots) {
    await prisma.emailTemplate.upsert({
      where: { templateKey: slot.templateKey },
      create: {
        templateKey: slot.templateKey,
        subject: slot.name,
        bodyHtml: DEFAULT_BODY,
      },
      update: {},
    });
  }
  console.log(`  Seeded ${slots.length} email template(s).`);

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
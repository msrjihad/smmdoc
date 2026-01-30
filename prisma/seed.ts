import { PrismaClient } from '@prisma/client';
import { TEMPLATE_SLOTS_BY_CATEGORY } from '../lib/email-templates/template-slots';
import { getPredefinedTemplateBody } from '../lib/email-templates/predefined-bodies';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const slots = Object.values(TEMPLATE_SLOTS_BY_CATEGORY).flat();
  for (const slot of slots) {
    const predefined = getPredefinedTemplateBody(slot.templateKey);
    const subject = predefined?.subject ?? slot.name;
    const bodyHtml = predefined?.bodyHtml ?? '<p>Edit this template in Admin → Settings → Email Templates.</p>';

    const fromName = predefined?.fromName?.trim() ? predefined.fromName : '{sitename}';

    await prisma.emailTemplate.upsert({
      where: { templateKey: slot.templateKey },
      create: {
        templateKey: slot.templateKey,
        fromName,
        subject,
        bodyHtml,
        isActive: true,
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
import { auth } from '@/auth';
import { contactDB } from '@/lib/contact-db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 GET Request - Starting database query...');
    
    const settings = await contactDB.getContactSettings();

    const categories = await contactDB.getContactCategories();

    const formattedSettings = {
      contactSystemEnabled: settings?.contactSystemEnabled ?? true,
      maxPendingContacts: settings?.maxPendingContacts ?? 'unlimited',
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name
      }))
    };
    
    console.log('🔍 GET Request - Raw settings from DB:', settings);
    console.log('🔍 GET Request - Formatted settings:', JSON.stringify(formattedSettings, null, 2));

    return NextResponse.json({
      success: true,
      contactSettings: formattedSettings
    });
  } catch (error) {
    console.error('Error loading contact settings:', error);
    return NextResponse.json({ error: 'Failed to load contact settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contactSettings } = await request.json();
    console.log('🔍 POST Request - Received contactSettings:', JSON.stringify(contactSettings, null, 2));
    
    if (!contactSettings) {
      return NextResponse.json({ error: 'Contact settings data is required' }, { status: 400 });
    }

    if (!contactSettings.categories || !Array.isArray(contactSettings.categories)) {
      return NextResponse.json({ error: 'Categories must be an array' }, { status: 400 });
    }

    if (contactSettings.categories.length === 0) {
      return NextResponse.json({ error: 'At least one category is required' }, { status: 400 });
    }

    for (const category of contactSettings.categories) {
      if (!category.name || !category.name.trim()) {
        return NextResponse.json({ error: 'All categories must have a name' }, { status: 400 });
      }
    }

    const settingsData = {
      contactSystemEnabled: contactSettings.contactSystemEnabled ?? true,
      maxPendingContacts: contactSettings.maxPendingContacts
    };
    console.log('🔍 About to upsert with data:', JSON.stringify(settingsData, null, 2));
    
    await contactDB.upsertContactSettings(settingsData);

    console.log('📋 Processing categories:', contactSettings.categories);

    const existingCategories = await contactDB.getContactCategories();
    const existingCategoryMap = new Map(
      existingCategories.map((cat) => [cat.id, cat.name])
    );

    console.log('📂 Existing categories:', existingCategories);

    for (const category of contactSettings.categories) {
      console.log('🔄 Processing category:', category);

      if (category.id && existingCategoryMap.has(category.id)) {
        if (existingCategoryMap.get(category.id) !== category.name) {
          console.log('✏️ Updating category:', category.id, category.name);
          await contactDB.updateContactCategory(category.id, category.name.trim());
        }
      } else if (!category.id) {
        console.log('➕ Creating new category:', category.name);
        const created = await contactDB.createContactCategory(category.name.trim());
        console.log('✅ Category creation result:', created);
      }
    }

    const newCategoryIds = contactSettings.categories
      .filter((cat: any) => cat.id)
      .map((cat: any) => cat.id);

    for (const [existingId] of existingCategoryMap) {
      if (!newCategoryIds.includes(existingId)) {
        await contactDB.deleteContactCategory(Number(existingId));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Contact settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving contact settings:', error);
    return NextResponse.json({ error: 'Failed to save contact settings' }, { status: 500 });
  }
}

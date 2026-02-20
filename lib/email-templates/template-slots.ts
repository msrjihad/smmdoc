

import { PREDEFINED_EMAIL_CATEGORIES, PREDEFINED_EMAIL_TEMPLATES } from '@/app/api/admin/email-templates/template-data';

export interface TemplateSlot {
  templateId: number;
  templateKey: string;
  name: string;
}

function buildSlotsByCategory(): Record<number, TemplateSlot[]> {
  const record: Record<number, TemplateSlot[]> = {};
  for (const cat of PREDEFINED_EMAIL_CATEGORIES) {
    record[cat.id] = PREDEFINED_EMAIL_TEMPLATES.filter((t) => t.categoryId === cat.id).map(
      (t) => ({ templateId: t.id, templateKey: t.templateKey, name: t.name })
    );
  }
  return record;
}

export const TEMPLATE_SLOTS_BY_CATEGORY: Record<number, TemplateSlot[]> = buildSlotsByCategory();

 
export function getSlotsForCategory(categoryId: string): TemplateSlot[] {
  const numId = parseInt(categoryId, 10);
  if (Number.isNaN(numId)) return [];
  return TEMPLATE_SLOTS_BY_CATEGORY[numId] ?? [];
}

 
export function getCategoryName(categoryId: string): string {
  const numId = parseInt(categoryId, 10);
  const cat = PREDEFINED_EMAIL_CATEGORIES.find((c) => c.id === numId);
  return cat?.name ?? categoryId;
}

import z from 'zod';

const createCategorySchema = z.object({
  category_name: z
    .string()
    .nonempty('Category name is required')
    .min(5, { message: 'Category name must be at least 5 characters long' }),
  hideCategory: z
    .enum(['yes', 'no'])
    .default('no'),
});

type CreateCategorySchema = z.infer<typeof createCategorySchema>;

const createCategoryDefaultValues: CreateCategorySchema = {
  category_name: '',
  hideCategory: 'no',
};

export {
  createCategoryDefaultValues,
  createCategorySchema,
  type CreateCategorySchema,
};

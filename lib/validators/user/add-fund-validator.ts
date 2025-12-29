import z from 'zod';

const addFundSchema = z.object({
  method: z.string().min(1, 'Payment method is required'),
  amountUSD: z.string().optional(),
  amountBDT: z.string().min(1, 'Amount is required'),
  amountBDTConverted: z.string().optional(),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(14, 'Phone number must not exceed 14 digits')
    .refine((value) => /^\d{10,14}$/.test(value.replace(/\D/g, '')), {
      message: 'Please enter a valid phone number (digits only)',
    }),
  amount: z.string().nonempty('Amount is required'),
});

type AddFundSchema = z.infer<typeof addFundSchema>;

const addFundDefaultValues: AddFundSchema = {
  method: 'UddoktaPay',
  amountUSD: '',
  amountBDT: '',
  amountBDTConverted: '',
  phone: '',
  amount: '',
};

export { addFundDefaultValues, addFundSchema, type AddFundSchema };

import z from 'zod';

const addFundSchema = z.object({
  method: z.string().min(1, 'Payment method is required'),
  amountUSD: z.string().optional(),
  amountBDT: z.string().min(1, 'Amount is required'),
  amountBDTConverted: z.string().optional(),
  amount: z.string().nonempty('Amount is required'),
});

type AddFundSchema = z.infer<typeof addFundSchema>;

const addFundDefaultValues: AddFundSchema = {
  method: 'UddoktaPay',
  amountUSD: '',
  amountBDT: '',
  amountBDTConverted: '',
  amount: '',
};

export { addFundDefaultValues, addFundSchema, type AddFundSchema };

import z from 'zod';

const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Username or Email is required')
    .refine((value) => {

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9._-]+$/;

      if (value.includes('@')) {
        return emailRegex.test(value);
      }

      return usernameRegex.test(value) && value.length >= 3;
    }, 'Please enter a valid email address or username'),
  password: z
    .string()
    .min(1, 'Password is required'),
  code: z.optional(z.string()),
});

type SignInSchema = z.infer<typeof signInSchema>;

const signInDefaultValues: SignInSchema = {
  email: '',
  password: '',
  code: '',
};

export { signInDefaultValues, signInSchema, type SignInSchema };

const signUpSchema = z
  .object({
    username: z.string().nonempty('Username is required'),
    name: z.string().nonempty('Name is required'),
    email: z
      .string()
      .nonempty('Email is required')
      .email('Invalid email address'),
    password: z
      .string()
      .nonempty('Password is required')
      .min(5, 'Password must be at least 5 characters'),
    confirmPassword: z
      .string()
      .nonempty('Confirm password is required')
      .min(5, 'Confirm password must be at least 5 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const createSignUpSchema = (nameFieldEnabled: boolean = true) => {
  const baseSchema = {
    username: z.string().nonempty('Username is required'),
    email: z
      .string()
      .nonempty('Email is required')
      .email('Invalid email address'),
    password: z
      .string()
      .nonempty('Password is required')
      .min(5, 'Password must be at least 5 characters'),
    confirmPassword: z
      .string()
      .nonempty('Confirm password is required')
      .min(5, 'Confirm password must be at least 5 characters'),
  };

  const schemaWithName = nameFieldEnabled
    ? { ...baseSchema, name: z.string().nonempty('Name is required') }
    : { ...baseSchema, name: z.string().optional() };

  return z
    .object(schemaWithName)
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    });
};

export type DynamicSignUpSchema = z.infer<ReturnType<typeof createSignUpSchema>>;

type SignUpSchema = z.infer<typeof signUpSchema>;

const signUpDefaultValues: SignUpSchema = {
  username: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export { createSignUpSchema, signUpDefaultValues, signUpSchema, type SignUpSchema };

const resetSchema = z.object({
  email: z
    .string()
    .nonempty('Email is required')
    .email('Invalid email address'),
});

type ResetSchema = z.infer<typeof resetSchema>;

const resetDefaultValues: ResetSchema = {
  email: '',
};

export { resetDefaultValues, resetSchema, type ResetSchema };

const newPasswordSchema = z.object({
  password: z
    .string()
    .nonempty('Password is required')
    .min(5, 'Password must be at least 5 characters'),
});

type NewPasswordSchema = z.infer<typeof newPasswordSchema>;

const newPasswordDefaultValues: NewPasswordSchema = {
  password: '',
};

const passwordSchema = z
  .object({
    currentPass: z.string().min(1, 'Current password is required'),
    newPass: z.string().min(5, 'New password must be at least 5 characters'),
    confirmNewPass: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPass === data.confirmNewPass, {
    message: 'Passwords do not match',
    path: ['confirmNewPass'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

const verifyEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  code: z
    .string()
    .min(1, 'Verification code is required')
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d+$/, 'Verification code must contain only numbers'),
});

type VerifyEmailSchema = z.infer<typeof verifyEmailSchema>;

const verifyEmailDefaultValues: VerifyEmailSchema = {
  email: '',
  code: '',
};

export {
    newPasswordDefaultValues,
    newPasswordSchema,
    passwordSchema,
    type NewPasswordSchema,
    type PasswordForm,
    verifyEmailDefaultValues,
    verifyEmailSchema,
    type VerifyEmailSchema
};

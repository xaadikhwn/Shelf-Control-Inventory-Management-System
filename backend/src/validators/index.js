const { z } = require('zod');

// Auth Validators
const registerSchema = z.object({
  body: z.object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role_id: z.number().optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required")
  })
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email")
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required"),
    new_password: z.string().min(6, "Password must be at least 6 characters")
  })
});

// Sales Validator
const createSaleSchema = z.object({
  body: z.object({
    customer_id: z.number().min(1, "Customer ID is required"),
    payment_status: z.enum(['paid', 'credit', 'pending']),
    items: z.array(z.object({
      product_id: z.number().min(1, "Product ID is required"),
      quantity: z.number().min(1, "Quantity must be at least 1")
    })).min(1, "At least one item is required")
  })
});

// General paginated query
const paginatedQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
    limit: z.string().optional().transform(val => (val ? parseInt(val) : 20))
  }).passthrough()
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createSaleSchema,
  paginatedQuerySchema
};

export default {
  type: 'object',
  properties: {
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string' },
    format: { type: 'string' },
  },
  required: ['firstName', 'lastName', 'email', 'phone', 'format'],
} as const;

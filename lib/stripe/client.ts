import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export { stripePromise }

export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Basic chat functionality',
      '10 conversations per month',
      'Standard models only',
      'Community support',
    ],
    limits: {
      conversations: 10,
      messagesPerConversation: 50,
      fileUploads: 5,
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    features: [
      'Unlimited conversations',
      'All AI models',
      'Advanced plugins',
      'Priority support',
      'Voice features',
      'File uploads up to 100MB',
    ],
    limits: {
      conversations: -1, // unlimited
      messagesPerConversation: -1,
      fileUploads: -1,
      fileSize: 100 * 1024 * 1024, // 100MB
    },
  },
  TEAM: {
    id: 'team',
    name: 'Team',
    price: 29.99,
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Shared knowledge base',
      'Admin controls',
      'SSO integration',
      'Custom branding',
    ],
    limits: {
      conversations: -1,
      messagesPerConversation: -1,
      fileUploads: -1,
      fileSize: 500 * 1024 * 1024, // 500MB
      teamMembers: 10,
    },
  },
} as const

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const { planId, userId, userEmail } = await req.json()

    if (!planId || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Vortex AI ${plan.name} Plan`,
              description: plan.features.join(', '),
            },
            unit_amount: Math.round(plan.price * 100), // Convert to cents
            recurring: plan.price > 0 ? {
              interval: 'month',
            } : undefined,
          },
          quantity: 1,
        },
      ],
      mode: plan.price > 0 ? 'subscription' : 'payment',
      success_url: `${req.nextUrl.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/pricing`,
      metadata: {
        userId,
        planId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}